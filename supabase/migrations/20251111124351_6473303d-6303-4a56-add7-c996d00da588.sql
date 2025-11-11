
-- Добавляем поле is_main для отметки основного персонажа
ALTER TABLE eve_characters 
ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;

-- Создаём функцию для автоматической установки первого персонажа как основного
CREATE OR REPLACE FUNCTION set_first_character_as_main()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Создаём триггер для автоматической установки основного персонажа
DROP TRIGGER IF EXISTS set_main_character_trigger ON eve_characters;
CREATE TRIGGER set_main_character_trigger
  BEFORE INSERT ON eve_characters
  FOR EACH ROW
  EXECUTE FUNCTION set_first_character_as_main();
