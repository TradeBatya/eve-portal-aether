-- Create enum for operation types
CREATE TYPE public.operation_type AS ENUM ('pvp', 'pve', 'mining', 'training', 'logistics', 'defense');

-- Create enum for operation status
CREATE TYPE public.operation_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');

-- Create table for fleet operations
CREATE TABLE public.fleet_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  operation_type public.operation_type NOT NULL,
  status public.operation_status NOT NULL DEFAULT 'scheduled',
  fc_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  doctrine TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  location TEXT,
  objectives TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create table for ping notifications (urgent alerts)
CREATE TABLE public.ping_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal', -- normal, high, urgent
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create table for operation signups
CREATE TABLE public.operation_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_id UUID NOT NULL REFERENCES public.fleet_operations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT, -- DPS, Logi, Scout, etc.
  ship_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(operation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.fleet_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ping_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_signups ENABLE ROW LEVEL SECURITY;

-- Policies for fleet_operations
CREATE POLICY "Anyone can view operations"
  ON public.fleet_operations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage operations"
  ON public.fleet_operations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for ping_notifications
CREATE POLICY "Anyone can view active pings"
  ON public.ping_notifications FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage pings"
  ON public.ping_notifications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for operation_signups
CREATE POLICY "Anyone can view signups"
  ON public.operation_signups FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own signups"
  ON public.operation_signups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signups"
  ON public.operation_signups FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_fleet_operations_updated_at
  BEFORE UPDATE ON public.fleet_operations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for operations
ALTER PUBLICATION supabase_realtime ADD TABLE public.fleet_operations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ping_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operation_signups;