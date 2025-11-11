-- Create discord_webhooks table
CREATE TABLE public.discord_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_url TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  webhook_type TEXT NOT NULL CHECK (webhook_type IN ('operations', 'intel', 'pings', 'recruitment', 'general')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.discord_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage webhooks"
  ON public.discord_webhooks
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active webhooks"
  ON public.discord_webhooks
  FOR SELECT
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_discord_webhooks_updated_at
  BEFORE UPDATE ON public.discord_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();