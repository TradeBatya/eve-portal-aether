-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create news table
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

-- Enable RLS on news
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- RLS policies for news - everyone can read
CREATE POLICY "Anyone can view news"
ON public.news
FOR SELECT
USING (true);

-- Only admins can insert news
CREATE POLICY "Admins can insert news"
ON public.news
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update news
CREATE POLICY "Admins can update news"
ON public.news
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete news
CREATE POLICY "Admins can delete news"
ON public.news
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for news table
CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policy for user_roles - users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Insert some initial news data
INSERT INTO public.news (title_en, title_ru, description_en, description_ru, category_en, category_ru, image_url, date) VALUES
('Fleet Expansion Announced', 'Объявлено расширение флота', 'Advent Coalition announces major fleet expansion with 50+ new capital ships joining our ranks this month.', 'Advent Coalition объявляет о крупном расширении флота: в этом месяце к нам присоединяются более 50 новых капитальных кораблей.', 'Fleet Operations', 'Операции флота', '/assets/fleet-ships.jpg', '2024-01-15'),
('Territory Control Update', 'Обновление контроля территории', 'Successfully secured three new systems in null-sec space, expanding our sovereignty and resources.', 'Успешно захвачены три новые системы в нулевом секторе, расширяя наш суверенитет и ресурсы.', 'Sovereignty', 'Суверенитет', '/assets/hero-fleet.webp', '2024-01-12'),
('New Citadel Construction', 'Строительство новой цитадели', 'Construction begins on our newest Keepstar-class citadel in strategic location J-XXXX.', 'Начато строительство нашей новейшей цитадели класса Keepstar в стратегическом месте J-XXXX.', 'Infrastructure', 'Инфраструктура', '/assets/station.jpg', '2024-01-10');