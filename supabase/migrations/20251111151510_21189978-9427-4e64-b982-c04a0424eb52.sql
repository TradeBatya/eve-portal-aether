-- Fix infinite recursion in operation_signups RLS policy
-- Drop the problematic SELECT policy
DROP POLICY IF EXISTS "Users can view signups for their operations" ON public.operation_signups;

-- Create a simpler policy: authenticated users can view all signups
-- This makes sense for an alliance portal where operation participation is visible to members
CREATE POLICY "Authenticated users can view all signups"
ON public.operation_signups
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);