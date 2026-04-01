-- Полная замена услуг для Belka_faces
-- Этот скрипт удаляет все старые услуги и создает новые

DO $$
DECLARE
  v_master_id UUID;
BEGIN
  -- Получаем ID первого мастера в системе
  SELECT id INTO v_master_id 
  FROM public.profiles 
  WHERE role = 'MASTER' 
  LIMIT 1;

  IF v_master_id IS NULL THEN
    RAISE EXCEPTION 'Мастер не найден. Сначала создайте профиль мастера.';
  END IF;

  RAISE NOTICE 'Найден мастер с ID: %', v_master_id;

  -- Удаляем все старые услуги этого мастера
  DELETE FROM public.services WHERE master_id = v_master_id;
  RAISE NOTICE 'Старые услуги удалены';

  -- Создаем новые услуги
  
  -- Услуга 1: Классический массаж лица
  INSERT INTO public.services (master_id, name, duration, price, description, is_active)
  VALUES (
    v_master_id,
    'Классический массаж лица',
    80,
    65,
    'Традиционная техника массажа для расслабления и улучшения тонуса кожи',
    true
  );
  RAISE NOTICE 'Добавлена услуга: Классический массаж лица';

  -- Услуга 2: Массаж лица Асахи
  INSERT INTO public.services (master_id, name, duration, price, description, is_active)
  VALUES (
    v_master_id,
    'Массаж лица Асахи',
    40,
    50,
    'Японская техника лимфодренажного массажа для омоложения и подтяжки',
    true
  );
  RAISE NOTICE 'Добавлена услуга: Массаж лица Асахи';

  -- Услуга 3: Буккальный массаж лица
  INSERT INTO public.services (master_id, name, duration, price, description, is_active)
  VALUES (
    v_master_id,
    'Буккальный массаж лица',
    90,
    75,
    'Глубокая проработка мышц лица изнутри для максимального лифтинг-эффекта',
    true
  );
  RAISE NOTICE 'Добавлена услуга: Буккальный массаж лица';

  RAISE NOTICE 'Все услуги успешно обновлены!';
END $$;

-- Проверка результата
SELECT 
  s.id,
  s.name,
  s.duration || ' мин' as duration,
  s.price || ' Br' as price,
  s.description,
  p.full_name as master_name
FROM public.services s
JOIN public.profiles p ON s.master_id = p.id
WHERE s.is_active = true
ORDER BY s.price;
