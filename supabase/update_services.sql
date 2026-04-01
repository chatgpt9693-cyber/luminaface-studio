-- Обновление услуг для Belka_faces
-- Этот скрипт обновляет существующие услуги или создает новые

-- Шаг 1: Найди свой master_id
-- Выполни этот запрос, чтобы узнать свой ID:
-- SELECT id, email, full_name, role FROM public.profiles WHERE role = 'MASTER';

-- Шаг 2: Замени 'YOUR_MASTER_ID_HERE' на свой реальный UUID мастера
-- Затем выполни скрипт ниже

DO $$
DECLARE
  v_master_id UUID;
BEGIN
  -- Получаем ID мастера (замени email на свой, если нужно)
  SELECT id INTO v_master_id 
  FROM public.profiles 
  WHERE role = 'MASTER' 
  LIMIT 1;

  IF v_master_id IS NULL THEN
    RAISE EXCEPTION 'Мастер не найден. Сначала создайте профиль мастера.';
  END IF;

  -- Удаляем старые услуги (опционально, раскомментируй если нужно)
  -- DELETE FROM public.services WHERE master_id = v_master_id;

  -- Обновляем или создаем новые услуги
  -- Используем ON CONFLICT для обновления существующих по имени
  
  -- Услуга 1: Классический массаж лица
  INSERT INTO public.services (master_id, name, duration, price, description, is_active)
  VALUES (
    v_master_id,
    'Классический массаж лица',
    80,
    65,
    'Традиционная техника массажа для расслабления и улучшения тонуса кожи',
    true
  )
  ON CONFLICT DO NOTHING;

  -- Услуга 2: Массаж лица Асахи
  INSERT INTO public.services (master_id, name, duration, price, description, is_active)
  VALUES (
    v_master_id,
    'Массаж лица Асахи',
    40,
    50,
    'Японская техника лимфодренажного массажа для омоложения и подтяжки',
    true
  )
  ON CONFLICT DO NOTHING;

  -- Услуга 3: Буккальный массаж лица
  INSERT INTO public.services (master_id, name, duration, price, description, is_active)
  VALUES (
    v_master_id,
    'Буккальный массаж лица',
    90,
    75,
    'Глубокая проработка мышц лица изнутри для максимального лифтинг-эффекта',
    true
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Услуги успешно добавлены для мастера: %', v_master_id;
END $$;

-- Проверка результата
SELECT id, name, duration, price, description 
FROM public.services 
WHERE is_active = true
ORDER BY name;
