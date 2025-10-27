-- Initial base schema for Advent Coalition
-- 
-- 1. Core Tables
--    - user_roles: User permission system
--    - profiles: Extended user information
--    - news: Alliance news and announcements
--
-- 2. Operations Tables
--    - fleet_operations: Fleet operation scheduling
--    - operation_signups: Pilot registration for operations
--
-- 3. Intel Tables
--    - intel_reports: Enemy activity tracking
--    - ping_notifications: Urgent alliance notifications

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE TABLE public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_ru TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_ru TEXT NOT NULL,
    category_en TEXT NOT NULL,
    category_ru TEXT NOT NULL,
    image_url TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view news"
ON public.news FOR SELECT USING (true);

CREATE POLICY "Admins can insert news"
ON public.news FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update news"
ON public.news FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete news"
ON public.news FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    display_name TEXT,
    discord_username TEXT,
    discord_id TEXT,
    alliance_auth_username TEXT,
    alliance_auth_id TEXT,
    timezone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE TYPE public.operation_type AS ENUM ('pvp', 'pve', 'mining', 'training', 'logistics', 'defense');
CREATE TYPE public.operation_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');

CREATE TABLE public.fleet_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    operation_type operation_type NOT NULL,
    status operation_status DEFAULT 'scheduled',
    fc_name TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    location TEXT,
    doctrine TEXT,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    objectives TEXT,
    image_url TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.fleet_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view operations"
ON public.fleet_operations FOR SELECT USING (true);

CREATE POLICY "Admins can insert operations"
ON public.fleet_operations FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update operations"
ON public.fleet_operations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete operations"
ON public.fleet_operations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.operation_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_id UUID REFERENCES fleet_operations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT,
    ship_type TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.operation_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all signups"
ON public.operation_signups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create own signups"
ON public.operation_signups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own signups"
ON public.operation_signups FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE public.intel_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_name TEXT NOT NULL,
    region_name TEXT,
    activity_type TEXT NOT NULL,
    threat_level TEXT DEFAULT 'medium',
    hostiles_count INTEGER,
    hostile_corps TEXT[],
    ship_types TEXT[],
    description TEXT,
    reported_by UUID,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.intel_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view intel reports"
ON public.intel_reports FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create intel reports"
ON public.intel_reports FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update intel reports"
ON public.intel_reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete intel reports"
ON public.intel_reports FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ping_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ping_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active pings"
ON public.ping_notifications FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can insert pings"
ON public.ping_notifications FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pings"
ON public.ping_notifications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pings"
ON public.ping_notifications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));