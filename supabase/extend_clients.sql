-- Расширение таблицы клиентов дополнительными полями
-- Выполни этот скрипт в Supabase SQL Editor

-- Добавляем новые поля в таблицу clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS preferences TEXT[],
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Обновляем notes если его нет
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Создаем view для расширенной статистики клиентов
CREATE OR REPLACE VIEW public.client_stats AS
SELECT 
  c.id,
  c.master_id,
  c.full_name,
  c.phone,
  c.email,
  c.total_visits,
  c.last_visit,
  c.birthday,
  c.preferences,
  c.allergies,
  c.tags,
  c.discount,
  c.notes,
  c.avatar_url,
  COALESCE(SUM(CASE WHEN a.status = 'COMPLETED' THEN a.price ELSE 0 END), 0) as total_spent,
  COALESCE(AVG(CASE WHEN a.status = 'COMPLETED' THEN a.price ELSE NULL END), 0) as average_check,
  (
    SELECT s.name 
    FROM public.appointments a2
    JOIN public.services s ON s.id = a2.service_id
    WHERE a2.client_id = c.id AND a2.status = 'COMPLETED'
    GROUP BY s.name
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) as favorite_service
FROM public.clients c
LEFT JOIN public.appointments a ON a.client_id = c.id
GROUP BY c.id;

-- Функция для автоматического обновления статистики клиента
CREATE OR REPLACE FUNCTION public.update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновляем total_visits и last_visit при завершении записи
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    UPDATE public.clients
    SET 
      total_visits = total_visits + 1,
      last_visit = DATE(NEW.date_time)
    WHERE id = NEW.client_id;
  END IF;
  
  -- Уменьшаем total_visits если запись была завершена, но теперь отменена
  IF OLD.status = 'COMPLETED' AND NEW.status != 'COMPLETED' THEN
    UPDATE public.clients
    SET total_visits = GREATEST(total_visits - 1, 0)
    WHERE id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления статистики
DROP TRIGGER IF EXISTS trigger_update_client_stats ON public.appointments;
CREATE TRIGGER trigger_update_client_stats
  AFTER INSERT OR UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_stats();

-- Функция для автоматического назначения тегов
CREATE OR REPLACE FUNCTION public.auto_assign_client_tags(client_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  completed_count INTEGER;
  total_spent_amount INTEGER;
  last_visit_date DATE;
  months_since_visit INTEGER;
  auto_tags TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Получаем статистику клиента
  SELECT 
    COUNT(*) FILTER (WHERE status = 'COMPLETED'),
    COALESCE(SUM(price) FILTER (WHERE status = 'COMPLETED'), 0),
    MAX(DATE(date_time)) FILTER (WHERE status = 'COMPLETED')
  INTO completed_count, total_spent_amount, last_visit_date
  FROM public.appointments
  WHERE appointments.client_id = auto_assign_client_tags.client_id;
  
  -- VIP - более 10 визитов или потратил более 50000
  IF completed_count >= 10 OR total_spent_amount >= 50000 THEN
    auto_tags := array_append(auto_tags, 'VIP');
  END IF;
  
  -- Постоянный - от 5 до 9 визитов
  IF completed_count >= 5 AND completed_count < 10 THEN
    auto_tags := array_append(auto_tags, 'REGULAR');
  END IF;
  
  -- Новый - менее 3 визитов
  IF completed_count < 3 THEN
    auto_tags := array_append(auto_tags, 'NEW');
  END IF;
  
  -- Неактивный - последний визит более 3 месяцев назад
  IF last_visit_date IS NOT NULL THEN
    months_since_visit := EXTRACT(MONTH FROM AGE(CURRENT_DATE, last_visit_date));
    IF months_since_visit >= 3 AND completed_count > 0 THEN
      auto_tags := array_append(auto_tags, 'INACTIVE');
    END IF;
  END IF;
  
  RETURN auto_tags;
END;
$$ LANGUAGE plpgsql;

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_clients_birthday ON public.clients(birthday);
CREATE INDEX IF NOT EXISTS idx_clients_discount ON public.clients(discount) WHERE discount > 0;

COMMENT ON COLUMN public.clients.birthday IS 'День рождения клиента';
COMMENT ON COLUMN public.clients.preferences IS 'Предпочтения клиента (массив строк)';
COMMENT ON COLUMN public.clients.allergies IS 'Аллергии и противопоказания';
COMMENT ON COLUMN public.clients.tags IS 'Теги клиента: VIP, REGULAR, NEW, INACTIVE, PROBLEM';
COMMENT ON COLUMN public.clients.discount IS 'Персональная скидка в процентах (0-100)';
