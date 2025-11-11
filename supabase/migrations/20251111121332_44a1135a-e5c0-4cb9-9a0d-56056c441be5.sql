-- Create corporations table
CREATE TABLE IF NOT EXISTS public.corporations (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  ticker text NOT NULL,
  alliance_id bigint,
  member_count integer DEFAULT 0,
  ceo_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create alliances table
CREATE TABLE IF NOT EXISTS public.alliances (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  ticker text NOT NULL,
  executor_corp_id bigint,
  member_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create plugins table
CREATE TABLE IF NOT EXISTS public.plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id text NOT NULL UNIQUE,
  name text NOT NULL,
  version text NOT NULL,
  description text,
  author text,
  enabled boolean DEFAULT true,
  is_system boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_plugins table
CREATE TABLE IF NOT EXISTS public.user_plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id uuid NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  installed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, plugin_id)
);

-- Add foreign key for corporations to alliances
ALTER TABLE public.corporations 
ADD CONSTRAINT fk_corporations_alliance 
FOREIGN KEY (alliance_id) REFERENCES public.alliances(id) ON DELETE SET NULL;

-- Add foreign key for alliances to corporations
ALTER TABLE public.alliances 
ADD CONSTRAINT fk_alliances_executor 
FOREIGN KEY (executor_corp_id) REFERENCES public.corporations(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plugins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for corporations
CREATE POLICY "Anyone can view corporations"
ON public.corporations FOR SELECT
USING (true);

CREATE POLICY "Admins can manage corporations"
ON public.corporations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for alliances
CREATE POLICY "Anyone can view alliances"
ON public.alliances FOR SELECT
USING (true);

CREATE POLICY "Admins can manage alliances"
ON public.alliances FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for plugins
CREATE POLICY "Anyone can view enabled plugins"
ON public.plugins FOR SELECT
USING (enabled = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage plugins"
ON public.plugins FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_plugins
CREATE POLICY "Users can view their own plugins"
ON public.user_plugins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own plugins"
ON public.user_plugins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plugins"
ON public.user_plugins FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plugins"
ON public.user_plugins FOR DELETE
USING (auth.uid() = user_id);

-- Create update triggers
CREATE TRIGGER update_corporations_updated_at
BEFORE UPDATE ON public.corporations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alliances_updated_at
BEFORE UPDATE ON public.alliances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plugins_updated_at
BEFORE UPDATE ON public.plugins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('media', 'media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS policies for avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage RLS policies for media
CREATE POLICY "Anyone can view media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Admins can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);