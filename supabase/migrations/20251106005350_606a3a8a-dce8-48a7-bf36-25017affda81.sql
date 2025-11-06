-- Drop existing problematic policy
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.roles;

-- Create a new policy that uses the has_role function (which doesn't query roles table)
CREATE POLICY "Super admins can manage roles"
ON public.roles
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name = 'super_admin'
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  )
);