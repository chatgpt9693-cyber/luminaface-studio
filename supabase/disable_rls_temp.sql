-- ВРЕМЕННО отключаем RLS для диагностики
-- Это НЕ для продакшена! Только для проверки!

ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;

-- Проверь, работает ли теперь удаление/обновление
-- Если работает, значит проблема точно в политиках RLS
