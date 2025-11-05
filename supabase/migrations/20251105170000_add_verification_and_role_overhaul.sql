-- Verification and role management overhaul

-- Drop legacy policies that referenced the old has_role(app_role) signature
DROP POLICY IF EXISTS "Admins can insert news" ON public.news;
DROP POLICY IF EXISTS "Admins can update news" ON public.news;
DROP POLICY IF EXISTS "Admins can delete news" ON public.news;

DROP POLICY IF EXISTS "Admins can insert operations" ON public.fleet_operations;
DROP POLICY IF EXISTS "Admins can update operations" ON public.fleet_operations;
DROP POLICY IF EXISTS "Admins can delete operations" ON public.fleet_operations;
DROP POLICY IF EXISTS "Admins can manage operations" ON public.fleet_operations;

DROP POLICY IF EXISTS "Admins can insert pings" ON public.ping_notifications;
DROP POLICY IF EXISTS "Admins can update pings" ON public.ping_notifications;
DROP POLICY IF EXISTS "Admins can delete pings" ON public.ping_notifications;
DROP POLICY IF EXISTS "Admins can manage pings" ON public.ping_notifications;

DROP POLICY IF EXISTS "Users can view signups for their operations" ON public.operation_signups;

DROP POLICY IF EXISTS "Admins can manage all intel" ON public.intel_reports;
DROP POLICY IF EXISTS "Admins can update intel reports" ON public.intel_reports;
DROP POLICY IF EXISTS "Admins can delete intel reports" ON public.intel_reports;

DROP POLICY IF EXISTS "Admins can insert doctrine categories" ON public.doctrine_categories;
DROP POLICY IF EXISTS "Admins can update doctrine categories" ON public.doctrine_categories;
DROP POLICY IF EXISTS "Admins can delete doctrine categories" ON public.doctrine_categories;

DROP POLICY IF EXISTS "Admins can insert doctrines" ON public.ship_doctrines;
DROP POLICY IF EXISTS "Admins can update doctrines" ON public.ship_doctrines;
DROP POLICY IF EXISTS "Admins can delete doctrines" ON public.ship_doctrines;

DROP POLICY IF EXISTS "Admins can insert fittings" ON public.ship_fittings;
DROP POLICY IF EXISTS "Admins can update fittings" ON public.ship_fittings;
DROP POLICY IF EXISTS "Admins can delete fittings" ON public.ship_fittings;

DROP POLICY IF EXISTS "Admins can insert tags" ON public.doctrine_tags;
DROP POLICY IF EXISTS "Admins can delete tags" ON public.doctrine_tags;

DROP POLICY IF EXISTS "Admins can manage corp role mappings" ON public.corporation_role_mappings;

-- Drop helper functions that will be recreated with the new role_id-based structure
DROP FUNCTION IF EXISTS public.get_user_permissions(user_uuid UUID);
DROP FUNCTION IF EXISTS public.has_permission(user_uuid UUID, permission_name TEXT);
DROP FUNCTION IF EXISTS public.has_role(_user_id UUID, _role public.app_role);

-- Restructure user_roles table to rely on role identifiers instead of the legacy enum
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE TEXT USING role::TEXT;

ALTER TABLE public.user_roles
  RENAME COLUMN role TO role_name;

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS role_id UUID;

-- Ensure role tracking metadata columns are present
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id);

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill role_id based on the existing role_name values
UPDATE public.user_roles ur
SET role_id = r.id
FROM public.roles r
WHERE LOWER(r.name) = LOWER(ur.role_name)
  AND ur.role_id IS NULL;

-- Ensure role linkage is fully enforced
ALTER TABLE public.user_roles
  ALTER COLUMN role_name SET NOT NULL;

ALTER TABLE public.user_roles
  ALTER COLUMN role_id SET NOT NULL;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- Drop the obsolete enum type now that the column no longer depends on it
DROP TYPE IF EXISTS public.app_role;

-- Bring roles table in line with the specification (permissions not null, sensible defaults)
ALTER TABLE public.roles
  ALTER COLUMN permissions SET NOT NULL,
  ALTER COLUMN permissions SET DEFAULT '[]'::jsonb,
  ALTER COLUMN hierarchy_level SET DEFAULT 0,
  ALTER COLUMN is_system_role SET DEFAULT false,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Ensure update trigger exists for roles (recreate defensively)
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Align corporation_role_mappings with the new role system
ALTER TABLE public.corporation_role_mappings
  DROP CONSTRAINT IF EXISTS corporation_role_mappings_system_role_name_fkey;

ALTER TABLE public.corporation_role_mappings
  RENAME COLUMN system_role_name TO system_role;

ALTER TABLE public.corporation_role_mappings
  ADD COLUMN IF NOT EXISTS system_role_id UUID;

ALTER TABLE public.corporation_role_mappings
  ADD COLUMN IF NOT EXISTS discord_role_id TEXT;

ALTER TABLE public.corporation_role_mappings
  ALTER COLUMN permissions SET DEFAULT '{}'::jsonb,
  ALTER COLUMN permissions SET NOT NULL;

UPDATE public.corporation_role_mappings crm
SET system_role_id = r.id
FROM public.roles r
WHERE LOWER(r.name) = LOWER(crm.system_role)
  AND crm.system_role_id IS NULL;

ALTER TABLE public.corporation_role_mappings
  ALTER COLUMN system_role SET NOT NULL;

ALTER TABLE public.corporation_role_mappings
  ADD CONSTRAINT corporation_role_mappings_system_role_id_fkey
    FOREIGN KEY (system_role_id) REFERENCES public.roles(id) ON DELETE SET NULL;

-- Create alliance/corporation whitelist table for verification
CREATE TABLE IF NOT EXISTS public.allowed_corporations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporation_id BIGINT UNIQUE NOT NULL,
  corporation_name TEXT NOT NULL,
  alliance_id BIGINT,
  alliance_name TEXT,
  is_whitelisted BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.allowed_corporations ENABLE ROW LEVEL SECURITY;

-- Create verification status table to track user onboarding lifecycle
CREATE TABLE IF NOT EXISTS public.user_verification_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT user_verification_status_status_check CHECK (status IN ('pending', 'verified', 'rejected')),
  CONSTRAINT user_verification_status_user_unique UNIQUE (user_id)
);

ALTER TABLE public.user_verification_status ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_verification_status_user ON public.user_verification_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_status_state ON public.user_verification_status(status);

DROP TRIGGER IF EXISTS update_user_verification_status_updated_at ON public.user_verification_status;

CREATE TRIGGER update_user_verification_status_updated_at
  BEFORE UPDATE ON public.user_verification_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Recreate helper functions based on the new role_id design
CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, role_name TEXT)
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
      AND LOWER(r.name) = LOWER(role_name)
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role_level(user_uuid UUID, min_level INTEGER)
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
      AND r.hierarchy_level >= min_level
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
  ) AS perms;
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

-- Seed or update the core system roles hierarchy
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role, permissions)
VALUES
  ('super_admin', 'Super Admin', 'Full access to all alliance management features', 100, true,
    '["user.manage", "roles.manage", "corporation.manage", "settings.manage", "discord.manage"]'::jsonb),
  ('admin', 'Administrator', 'Manage users, corporations, and system configuration', 80, true,
    '["user.manage", "roles.manage", "corporation.manage", "settings.manage"]'::jsonb),
  ('moderator', 'Moderator', 'Moderate content and oversee alliance activity', 60, true,
    '["user.manage", "discord.manage"]'::jsonb),
  ('corp_director', 'Corporation Director', 'Directorial access for corporation leadership', 50, false,
    '["corporation.manage", "discord.manage"]'::jsonb),
  ('corp_member', 'Corporation Member', 'Verified corporation member with standard access', 10, true,
    '["discord.manage"]'::jsonb),
  ('guest', 'Guest', 'Unverified or guest user with minimal privileges', 0, true,
    '[]'::jsonb)
ON CONFLICT (name) DO UPDATE
SET display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    hierarchy_level = EXCLUDED.hierarchy_level,
    is_system_role = EXCLUDED.is_system_role,
    permissions = EXCLUDED.permissions;

-- Update corporation role mapping display names to match any modified roles
UPDATE public.corporation_role_mappings crm
SET system_role = r.name
FROM public.roles r
WHERE crm.system_role_id = r.id;

-- Recreate policies using the new has_role_level helper for admin-level access

-- News management
CREATE POLICY "Admins can insert news"
  ON public.news
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can update news"
  ON public.news
  FOR UPDATE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can delete news"
  ON public.news
  FOR DELETE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

-- Fleet operations
CREATE POLICY "Admins can insert operations"
  ON public.fleet_operations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can update operations"
  ON public.fleet_operations
  FOR UPDATE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can delete operations"
  ON public.fleet_operations
  FOR DELETE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can manage operations"
  ON public.fleet_operations
  FOR ALL
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

-- Ping notifications
CREATE POLICY "Admins can insert pings"
  ON public.ping_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can update pings"
  ON public.ping_notifications
  FOR UPDATE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can delete pings"
  ON public.ping_notifications
  FOR DELETE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can manage pings"
  ON public.ping_notifications
  FOR ALL
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

-- Operation signups - admins can view all, users restricted by participation
CREATE POLICY "Users can view signups for their operations"
  ON public.operation_signups
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.operation_signups os
        WHERE os.operation_id = operation_signups.operation_id
          AND os.user_id = auth.uid()
      )
      OR public.has_role_level(auth.uid(), 80)
    )
  );

-- Intel reports
CREATE POLICY "Admins can manage all intel"
  ON public.intel_reports
  FOR ALL
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can update intel reports"
  ON public.intel_reports
  FOR UPDATE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can delete intel reports"
  ON public.intel_reports
  FOR DELETE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

-- Doctrine management
CREATE POLICY "Admins can insert doctrine categories"
  ON public.doctrine_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can update doctrine categories"
  ON public.doctrine_categories
  FOR UPDATE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can delete doctrine categories"
  ON public.doctrine_categories
  FOR DELETE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can insert doctrines"
  ON public.ship_doctrines
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can update doctrines"
  ON public.ship_doctrines
  FOR UPDATE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can delete doctrines"
  ON public.ship_doctrines
  FOR DELETE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can insert fittings"
  ON public.ship_fittings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can update fittings"
  ON public.ship_fittings
  FOR UPDATE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can delete fittings"
  ON public.ship_fittings
  FOR DELETE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can insert tags"
  ON public.doctrine_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can delete tags"
  ON public.doctrine_tags
  FOR DELETE
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

-- Corporation role mappings management
CREATE POLICY "Admins can manage corp role mappings"
  ON public.corporation_role_mappings
  FOR ALL
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

-- Policies for the new allowed_corporations table
CREATE POLICY "Authenticated users can view allowed corporations"
  ON public.allowed_corporations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage allowed corporations"
  ON public.allowed_corporations
  FOR ALL
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

-- Policies for user verification status table
CREATE POLICY "Users can view their verification status"
  ON public.user_verification_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role_level(auth.uid(), 80));

CREATE POLICY "Admins can manage verification status"
  ON public.user_verification_status
  FOR ALL
  TO authenticated
  USING (public.has_role_level(auth.uid(), 80));

