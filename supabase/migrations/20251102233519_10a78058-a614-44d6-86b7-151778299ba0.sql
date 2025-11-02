-- Create table for EVE characters linked to user profiles
CREATE TABLE public.eve_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id BIGINT NOT NULL UNIQUE,
  character_name TEXT NOT NULL,
  character_owner_hash TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scopes TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, character_id)
);

-- Enable RLS
ALTER TABLE public.eve_characters ENABLE ROW LEVEL SECURITY;

-- Users can view their own characters
CREATE POLICY "Users can view their own characters"
ON public.eve_characters
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own characters (max 3 check will be in edge function)
CREATE POLICY "Users can insert their own characters"
ON public.eve_characters
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own characters
CREATE POLICY "Users can update their own characters"
ON public.eve_characters
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own characters
CREATE POLICY "Users can delete their own characters"
ON public.eve_characters
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_eve_characters_updated_at
BEFORE UPDATE ON public.eve_characters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_eve_characters_user_id ON public.eve_characters(user_id);
CREATE INDEX idx_eve_characters_character_id ON public.eve_characters(character_id);