-- Create roles table for flexible role management
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  hierarchy_level INTEGER NOT NULL DEFAULT 0,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Everyone can view roles
CREATE POLICY "Anyone can view roles"
  ON public.roles
  FOR SELECT
  USING (true);

-- Only super_admins can manage roles
CREATE POLICY "Super admins can manage roles"
  ON public.roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.name = 'super_admin'
      WHERE ur.user_id = auth.uid()
    )
  );

-- Update user_roles table to support expiration and tracking
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create corporation role mapping table
CREATE TABLE IF NOT EXISTS public.corporation_role_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporation_id BIGINT NOT NULL,
  eve_role_name TEXT NOT NULL,
  system_role_name TEXT NOT NULL REFERENCES public.roles(name),
  permissions JSONB DEFAULT '[]'::jsonb,
  auto_assign BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(corporation_id, eve_role_name)
);

-- Add RLS for corporation_role_mappings
ALTER TABLE public.corporation_role_mappings ENABLE ROW LEVEL SECURITY;

-- Everyone can view mappings
CREATE POLICY "Anyone can view corp role mappings"
  ON public.corporation_role_mappings
  FOR SELECT
  USING (true);

-- Only admins can manage mappings
CREATE POLICY "Admins can manage corp role mappings"
  ON public.corporation_role_mappings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create role assignment logs table
CREATE TABLE IF NOT EXISTS public.role_assignment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'expired')),
  granted_by UUID REFERENCES auth.users(id),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS for logs
ALTER TABLE public.role_assignment_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs, admins can view all
CREATE POLICY "Users can view their own role logs"
  ON public.role_assignment_logs
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Insert default system roles
INSERT INTO public.roles (name, display_name, description, hierarchy_level, is_system_role, permissions) VALUES
  ('super_admin', 'Super Administrator', 'Full system access with all permissions', 100, true, 
   '["manage_users", "manage_roles", "manage_settings", "manage_content", "view_logs", "manage_operations", "manage_intel"]'::jsonb),
  ('admin', 'Administrator', 'Manage users and system settings', 90, true,
   '["manage_users", "manage_settings", "manage_content", "view_logs", "manage_operations", "manage_intel"]'::jsonb),
  ('moderator', 'Moderator', 'Content moderation and user management', 50, true,
   '["manage_content", "view_logs", "manage_intel"]'::jsonb),
  ('fc', 'Fleet Commander', 'Lead fleet operations', 40, false,
   '["create_operations", "manage_operations", "view_signups"]'::jsonb),
  ('corp_director', 'Corporation Director', 'Corporation leadership role from EVE', 80, false,
   '["manage_users", "manage_content", "manage_operations", "view_logs"]'::jsonb),
  ('corp_personnel_manager', 'Personnel Manager', 'HR and personnel management from EVE', 70, false,
   '["manage_users", "view_logs"]'::jsonb),
  ('corp_accountant', 'Accountant', 'Financial oversight from EVE', 60, false,
   '["view_logs"]'::jsonb),
  ('user', 'User', 'Basic user permissions', 10, true,
   '["view_content", "create_intel", "signup_operations"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert default corporation role mappings (example for common EVE roles)
INSERT INTO public.corporation_role_mappings (corporation_id, eve_role_name, system_role_name, auto_assign) VALUES
  (0, 'Director', 'corp_director', true),
  (0, 'Personnel Manager', 'corp_personnel_manager', true),
  (0, 'Accountant', 'corp_accountant', true)
ON CONFLICT (corporation_id, eve_role_name) DO NOTHING;

-- Create function to get user permissions
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
    SELECT jsonb_array_elements_text(r.permissions) as perm
    FROM public.user_roles ur
    JOIN public.roles r ON r.name::text = ur.role::text
    WHERE ur.user_id = user_uuid
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ) perms;
$$;

-- Create function to check if user has permission
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
    JOIN public.roles r ON r.name::text = ur.role::text
    WHERE ur.user_id = user_uuid
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND r.permissions ? permission_name
  );
$$;

-- Create trigger for updated_at on roles
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on corporation_role_mappings
CREATE TRIGGER update_corp_mappings_updated_at
  BEFORE UPDATE ON public.corporation_role_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();