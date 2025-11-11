-- Create achievements system
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  description_en text NOT NULL,
  description_ru text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL, -- operations, intel, activity, special
  points integer NOT NULL DEFAULT 10,
  requirement_count integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user achievements tracking
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress integer DEFAULT 0,
  unlocked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements
CREATE POLICY "Anyone can view active achievements"
ON public.achievements
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can manage achievements"
ON public.achievements
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for user achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "System can track achievements"
ON public.user_achievements
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update achievement progress"
ON public.user_achievements
FOR UPDATE
TO public
USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (key, name_en, name_ru, description_en, description_ru, icon, category, points, requirement_count) VALUES
('first_operation', 'First Operation', 'Первая операция', 'Participate in your first fleet operation', 'Участие в первой флотской операции', '🚀', 'operations', 10, 1),
('operation_veteran', 'Operation Veteran', 'Ветеран операций', 'Participate in 10 fleet operations', 'Участие в 10 флотских операциях', '⚔️', 'operations', 50, 10),
('operation_master', 'Operation Master', 'Мастер операций', 'Participate in 50 fleet operations', 'Участие в 50 флотских операциях', '👑', 'operations', 200, 50),
('first_intel', 'First Intel Report', 'Первый Intel отчет', 'Submit your first intel report', 'Отправка первого Intel отчета', '🔍', 'intel', 10, 1),
('intel_specialist', 'Intel Specialist', 'Специалист Intel', 'Submit 20 intel reports', 'Отправка 20 Intel отчетов', '🎯', 'intel', 100, 20),
('week_active', 'Weekly Active', 'Активность за неделю', 'Log in for 7 consecutive days', 'Вход в систему 7 дней подряд', '📅', 'activity', 30, 7),
('month_active', 'Monthly Champion', 'Чемпион месяца', 'Log in for 30 consecutive days', 'Вход в систему 30 дней подряд', '🏆', 'activity', 150, 30);

-- Function to update achievement progress
CREATE OR REPLACE FUNCTION public.update_achievement_progress(
  p_user_id uuid,
  p_achievement_key text,
  p_increment integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement_id uuid;
  v_requirement_count integer;
  v_current_progress integer;
BEGIN
  -- Get achievement details
  SELECT id, requirement_count INTO v_achievement_id, v_requirement_count
  FROM achievements
  WHERE key = p_achievement_key AND is_active = true;

  IF v_achievement_id IS NULL THEN
    RETURN;
  END IF;

  -- Insert or update progress
  INSERT INTO user_achievements (user_id, achievement_id, progress)
  VALUES (p_user_id, v_achievement_id, p_increment)
  ON CONFLICT (user_id, achievement_id)
  DO UPDATE SET progress = user_achievements.progress + p_increment
  RETURNING progress INTO v_current_progress;

  -- Check if achievement is unlocked
  IF v_current_progress >= v_requirement_count THEN
    UPDATE user_achievements
    SET unlocked_at = now()
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id AND unlocked_at IS NULL;
  END IF;
END;
$$;