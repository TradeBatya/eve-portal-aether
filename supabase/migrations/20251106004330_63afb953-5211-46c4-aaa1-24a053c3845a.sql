-- Fix user_roles table to use role_id and role_name instead of enum
ALTER TABLE public.user_roles DROP COLUMN IF EXISTS role;

-- Add role_id and role_name if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_roles' AND column_name='role_id') THEN
    ALTER TABLE public.user_roles ADD COLUMN role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_roles' AND column_name='role_name') THEN
    ALTER TABLE public.user_roles ADD COLUMN role_name TEXT NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- Update has_role function to work with new structure
CREATE OR REPLACE FUNCTION public.has_role_level(user_uuid uuid, min_level integer)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid
      AND r.hierarchy_level >= min_level
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
$$;

-- Keep old has_role for backward compatibility
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role_name = _role::text
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  )
$$;