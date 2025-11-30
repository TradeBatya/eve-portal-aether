-- Phase 5: Fix remaining function search_path security warnings

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with basic data
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix install_default_plugins function
CREATE OR REPLACE FUNCTION public.install_default_plugins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Install all system plugins for new user
  INSERT INTO public.user_plugins (user_id, plugin_id, enabled)
  SELECT NEW.id, p.id, true
  FROM public.plugins p
  WHERE p.is_system = true AND p.enabled = true
  ON CONFLICT (user_id, plugin_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Add comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile for new authenticated users';
COMMENT ON FUNCTION public.install_default_plugins() IS 'Automatically installs system plugins for new users';

-- Add additional performance indexes for member_audit tables
CREATE INDEX IF NOT EXISTS idx_member_audit_skills_character 
ON member_audit_skills(character_id, skill_name);

CREATE INDEX IF NOT EXISTS idx_member_audit_wallet_journal_character_date 
ON member_audit_wallet_journal(character_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_member_audit_wallet_transactions_character_date 
ON member_audit_wallet_transactions(character_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_member_audit_contacts_character_standing 
ON member_audit_contacts(character_id, standing DESC);

CREATE INDEX IF NOT EXISTS idx_member_audit_contracts_character_status 
ON member_audit_contracts(character_id, status, date_issued DESC);

CREATE INDEX IF NOT EXISTS idx_member_audit_industry_jobs_character_status 
ON member_audit_industry_jobs(character_id, status, end_date DESC);