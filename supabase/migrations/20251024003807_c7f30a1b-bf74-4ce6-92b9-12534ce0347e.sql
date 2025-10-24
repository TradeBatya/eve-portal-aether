-- Add timezone to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Add comment
COMMENT ON COLUMN public.profiles.timezone IS 'User primary timezone (USTZ, EUTZ, AUTZ)';