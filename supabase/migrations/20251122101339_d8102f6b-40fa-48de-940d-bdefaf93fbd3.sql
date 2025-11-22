-- Fix security warning: Set search_path for increment_token_failures function
DROP FUNCTION IF EXISTS increment_token_failures(INTEGER);

CREATE OR REPLACE FUNCTION increment_token_failures(char_id INTEGER)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE esi_service_tokens
  SET 
    validation_failures = COALESCE(validation_failures, 0) + 1,
    auto_refresh_enabled = CASE 
      WHEN COALESCE(validation_failures, 0) + 1 >= 3 THEN false
      ELSE auto_refresh_enabled
    END,
    updated_at = NOW()
  WHERE character_id = char_id;
END;
$$;