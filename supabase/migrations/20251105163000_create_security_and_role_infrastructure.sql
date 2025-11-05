-- Align roles table with hierarchical role requirements
ALTER TABLE IF EXISTS public.roles
  DROP COLUMN IF EXISTS display_name,
  ALTER COLUMN name TYPE VARCHAR(100),
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN permissions SET DEFAULT '[]'::jsonb,
  ALTER COLUMN permissions SET NOT NULL,
  ALTER COLUMN hierarchy_level SET DEFAULT 0,
  ALTER COLUMN is_system_role SET DEFAULT false,
  ALTER COLUMN created_at SET DEFAULT now();

-- Ensure updated_at column exists
ALTER TABLE IF EXISTS public.roles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Normalise existing role data
UPDATE public.roles
SET permissions = '[]'::jsonb
WHERE permissions IS NULL;

-- Seed or update core system roles with hierarchy configuration
INSERT INTO public.roles (name, description, permissions, hierarchy_level, is_system_role)
VALUES
  ('super_admin', 'Full system access with all permissions',
    '["user.manage", "roles.manage", "corporation.manage", "settings.manage", "discord.manage"]'::jsonb,
    100, true),
  ('admin', 'Alliance administrator with elevated permissions',
    '["user.manage", "corporation.manage", "settings.manage", "discord.manage"]'::jsonb,
    80, true),
  ('moderator', 'Moderator with limited management permissions',
    '["discord.manage"]'::jsonb,
    60, true),
  ('corp_director', 'Corporation director with operational control',
    '["corporation.manage", "discord.manage"]'::jsonb,
    50, false),
  ('corp_member', 'Verified corporation member',
    '[]'::jsonb,
    10, false),
  ('guest', 'Unverified or guest access level',
    '[]'::jsonb,
    0, true)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    hierarchy_level = EXCLUDED.hierarchy_level,
    is_system_role = EXCLUDED.is_system_role,
    updated_at = now();

-- Preserve legacy user role assignments before migrating
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles RENAME TO user_roles_legacy;
  END IF;
END $$;

-- Create new user_roles table referencing roles by id
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_minimum_role_level(auth.uid(), 80))
  WITH CHECK (public.has_minimum_role_level(auth.uid(), 80));

CREATE TRIGGER set_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate data from legacy table if present
INSERT INTO public.user_roles (user_id, role_id, granted_by, granted_at, expires_at, created_at)
SELECT
  legacy.user_id,
  roles.id,
  legacy.granted_by,
  COALESCE(legacy.granted_at, legacy.created_at),
  legacy.expires_at,
  legacy.created_at
FROM public.user_roles_legacy legacy
JOIN public.roles roles
  ON roles.name = CASE
    WHEN legacy.role::text = 'user' THEN 'corp_member'
    ELSE legacy.role::text
  END
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS public.user_roles_legacy;

-- Replace role helper functions to work with the new schema
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name = _role
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(DISTINCT perm)
      FILTER (WHERE perm IS NOT NULL),
    '[]'::jsonb
  )
  FROM (
    SELECT jsonb_array_elements_text(r.permissions) AS perm
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ) perms;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND r.permissions ? permission_name
  );
$$;

CREATE OR REPLACE FUNCTION public.has_minimum_role_level(user_uuid UUID, required_level INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND r.hierarchy_level >= required_level
  );
$$;

-- Update policies to use new helper functions
ALTER POLICY "Admins can manage operations"
  ON public.fleet_operations
  USING (public.has_minimum_role_level(auth.uid(), 80))
  WITH CHECK (public.has_minimum_role_level(auth.uid(), 80));

ALTER POLICY "Admins can manage pings"
  ON public.ping_notifications
  USING (public.has_minimum_role_level(auth.uid(), 80))
  WITH CHECK (public.has_minimum_role_level(auth.uid(), 80));

ALTER POLICY "Users can view signups for their operations"
  ON public.operation_signups
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.operation_signups os
        WHERE os.operation_id = operation_signups.operation_id
          AND os.user_id = auth.uid()
      )
      OR public.has_minimum_role_level(auth.uid(), 80)
    )
  );

ALTER POLICY "Users can view their own role logs"
  ON public.role_assignment_logs
  USING (
    auth.uid() = user_id OR public.has_minimum_role_level(auth.uid(), 80)
  );

DROP TYPE IF EXISTS public.app_role;

-- Recreate corporation role mappings table with new schema
DROP TABLE IF EXISTS public.corporation_role_mappings;

CREATE TABLE public.corporation_role_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporation_id INTEGER NOT NULL,
  eve_role_name VARCHAR(100) NOT NULL,
  system_role VARCHAR(100) NOT NULL REFERENCES public.roles(name),
  discord_role_id VARCHAR(100),
  permissions JSONB DEFAULT '[]'::jsonb,
  auto_assign BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (corporation_id, eve_role_name)
);

ALTER TABLE public.corporation_role_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View corporation role mappings"
  ON public.corporation_role_mappings
  FOR SELECT
  USING (true);

CREATE POLICY "Manage corporation role mappings"
  ON public.corporation_role_mappings
  FOR ALL
  TO authenticated
  USING (public.has_minimum_role_level(auth.uid(), 80))
  WITH CHECK (public.has_minimum_role_level(auth.uid(), 80));

CREATE TRIGGER update_corporation_role_mappings_updated_at
  BEFORE UPDATE ON public.corporation_role_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.corporation_role_mappings (corporation_id, eve_role_name, system_role)
VALUES
  (0, 'Director', 'corp_director'),
  (0, 'Personnel Manager', 'moderator'),
  (0, 'Accountant', 'corp_member')
ON CONFLICT (corporation_id, eve_role_name) DO NOTHING;

-- Create allowed corporations table
CREATE TABLE IF NOT EXISTS public.allowed_corporations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporation_id INTEGER UNIQUE NOT NULL,
  corporation_name VARCHAR(255) NOT NULL,
  alliance_id INTEGER,
  alliance_name VARCHAR(255),
  is_whitelisted BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.allowed_corporations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View allowed corporations"
  ON public.allowed_corporations
  FOR SELECT
  USING (true);

CREATE POLICY "Manage allowed corporations"
  ON public.allowed_corporations
  FOR ALL
  TO authenticated
  USING (public.has_minimum_role_level(auth.uid(), 80))
  WITH CHECK (public.has_minimum_role_level(auth.uid(), 80));

CREATE TRIGGER update_allowed_corporations_updated_at
  BEFORE UPDATE ON public.allowed_corporations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create user verification status table
CREATE TABLE IF NOT EXISTS public.user_verification_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT user_verification_status_status_check CHECK (status IN ('pending', 'verified', 'rejected')),
  UNIQUE (user_id)
);

ALTER TABLE public.user_verification_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their verification status"
  ON public.user_verification_status
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage verification status"
  ON public.user_verification_status
  FOR ALL
  TO authenticated
  USING (public.has_minimum_role_level(auth.uid(), 80))
  WITH CHECK (public.has_minimum_role_level(auth.uid(), 80));

CREATE TRIGGER update_user_verification_status_updated_at
  BEFORE UPDATE ON public.user_verification_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

