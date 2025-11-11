
-- Исправляем функцию с правильным search_path
CREATE OR REPLACE FUNCTION set_first_character_as_main()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Если это первый персонаж пользователя, делаем его основным
  IF NOT EXISTS (
    SELECT 1 FROM eve_characters 
    WHERE user_id = NEW.user_id AND id != NEW.id
  ) THEN
    NEW.is_main = true;
  END IF;
  RETURN NEW;
END;
$$;
