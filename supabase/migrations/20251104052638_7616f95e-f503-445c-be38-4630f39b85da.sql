-- Add Discord integration fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS discord_user_id text,
ADD COLUMN IF NOT EXISTS discord_username text,
ADD COLUMN IF NOT EXISTS discord_avatar text,
ADD COLUMN IF NOT EXISTS discord_email text,
ADD COLUMN IF NOT EXISTS discord_access_token text,
ADD COLUMN IF NOT EXISTS discord_refresh_token text,
ADD COLUMN IF NOT EXISTS discord_connected_at timestamp with time zone;