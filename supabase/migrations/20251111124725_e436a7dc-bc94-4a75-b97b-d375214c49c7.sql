-- Обновляем существующего персонажа как основного
UPDATE eve_characters 
SET is_main = true 
WHERE character_name = 'batyatrade';

-- Расширяем таблицу profiles для dashboard и настроек
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dashboard_layout jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"email": true, "discord": true}',
ADD COLUMN IF NOT EXISTS last_activity timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Обновляем функцию handle_new_user для автоматического заполнения display_name
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Создаём профиль с базовыми данными
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;