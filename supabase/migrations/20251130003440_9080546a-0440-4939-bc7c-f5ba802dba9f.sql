-- Phase 5: Fix function search_path security warnings

-- Fix update_cache_access_stats function
CREATE OR REPLACE FUNCTION public.update_cache_access_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.access_count = OLD.access_count + 1;
  NEW.last_accessed = NOW();
  RETURN NEW;
END;
$$;

-- Fix set_first_character_as_main function
CREATE OR REPLACE FUNCTION public.set_first_character_as_main()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is the first character for the user, make it main
  IF NOT EXISTS (
    SELECT 1 FROM eve_characters 
    WHERE user_id = NEW.user_id AND id != NEW.id
  ) THEN
    NEW.is_main = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Add comment for clarity
COMMENT ON FUNCTION public.update_cache_access_stats() IS 'Automatically increments access_count and updates last_accessed timestamp for cache entries';
COMMENT ON FUNCTION public.set_first_character_as_main() IS 'Automatically marks first character as main for new users';

-- Create index on member_audit_metadata for faster sync status checks (Phase 4 race condition optimization)
CREATE INDEX IF NOT EXISTS idx_member_audit_metadata_sync_status 
ON member_audit_metadata(character_id, sync_status, last_update_at) 
WHERE sync_status = 'syncing';