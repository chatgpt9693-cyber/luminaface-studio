/* Автоматическое создание записи в clients при регистрации пользователя с ролью CLIENT */

/* Функция для создания клиента */
CREATE OR REPLACE FUNCTION public.handle_new_client()
RETURNS TRIGGER AS $$
DECLARE
  master_uuid UUID;
  user_phone TEXT;
BEGIN
  /* Проверяем, что это клиент */
  IF NEW.role = 'CLIENT' THEN
    /* Находим мастера (предполагаем, что мастер один) */
    SELECT id INTO master_uuid
    FROM public.profiles
    WHERE role = 'MASTER'
    LIMIT 1;
    
    /* Получаем телефон из auth.users metadata */
    SELECT COALESCE(raw_user_meta_data->>'phone', '') INTO user_phone
    FROM auth.users
    WHERE id = NEW.id;
    
    /* Если мастер найден, создаем запись клиента */
    IF master_uuid IS NOT NULL THEN
      INSERT INTO public.clients (master_id, full_name, phone, email, total_visits)
      VALUES (
        master_uuid,
        NEW.full_name,
        user_phone,
        NEW.email,
        0
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/* Триггер на создание профиля */
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'CLIENT')
  EXECUTE FUNCTION public.handle_new_client();

/* Также создадим клиентов для уже существующих пользователей */
INSERT INTO public.clients (master_id, full_name, phone, email, total_visits)
SELECT 
  (SELECT id FROM public.profiles WHERE role = 'MASTER' LIMIT 1) as master_id,
  p.full_name,
  '',
  p.email,
  0
FROM public.profiles p
WHERE p.role = 'CLIENT'
AND NOT EXISTS (
  SELECT 1 FROM public.clients c WHERE c.email = p.email
);
