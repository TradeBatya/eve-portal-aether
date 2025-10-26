-- Fix operation_signups RLS policies for better security
-- Drop the overly permissive public view policy
DROP POLICY IF EXISTS "Anyone can view signups" ON public.operation_signups;

-- Allow users to view signups only for operations they're signed up for or if they're admin
CREATE POLICY "Users can view signups for their operations"
  ON public.operation_signups FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- User can see signups for operations they're participating in
      EXISTS (
        SELECT 1 FROM public.operation_signups os
        WHERE os.operation_id = operation_signups.operation_id
        AND os.user_id = auth.uid()
      )
      -- Or if user is an admin
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- Add missing UPDATE policy so users can modify their own signups
CREATE POLICY "Users can update their own signups"
  ON public.operation_signups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add explicit denial for anonymous access to profiles (defense in depth)
CREATE POLICY "Deny anonymous profile access"
  ON public.profiles FOR SELECT
  TO anon
  USING (false);