-- Добавляем поле для кода подключения
ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS connection_code TEXT UNIQUE;

-- Генерируем коды для существующих пользователей
UPDATE public.notification_settings
SET connection_code = 'BF-' || UPPER(SUBSTRING(MD5(user_id::text) FROM 1 FOR 6))
WHERE connection_code IS NULL;

-- Функция для автоматической генерации кода при создании настроек
CREATE OR REPLACE FUNCTION public.generate_connection_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.connection_code IS NULL THEN
    NEW.connection_code := 'BF-' || UPPER(SUBSTRING(MD5(NEW.user_id::text) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для генерации кода
DROP TRIGGER IF EXISTS generate_connection_code_trigger ON public.notification_settings;
CREATE TRIGGER generate_connection_code_trigger
  BEFORE INSERT ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_connection_code();
