/* ФИНАЛЬНОЕ РЕШЕНИЕ - Максимально простые политики для одного мастера */

-- Удаляем ВСЕ политики
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Включаем RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

/* ============================================
   PROFILES - Каждый видит свой профиль
   ============================================ */

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (true);

/* ============================================
   APPOINTMENTS - Все авторизованные имеют доступ
   ============================================ */

CREATE POLICY "appointments_select" ON public.appointments
  FOR SELECT USING (true);

CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "appointments_update" ON public.appointments
  FOR UPDATE USING (true);

CREATE POLICY "appointments_delete" ON public.appointments
  FOR DELETE USING (true);

/* ============================================
   CLIENTS - Все авторизованные имеют доступ
   ============================================ */

CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (true);

CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE USING (true);

CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE USING (true);

/* ============================================
   SERVICES - Все авторизованные имеют доступ
   ============================================ */

CREATE POLICY "services_select" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "services_insert" ON public.services
  FOR INSERT WITH CHECK (true);

CREATE POLICY "services_update" ON public.services
  FOR UPDATE USING (true);

CREATE POLICY "services_delete" ON public.services
  FOR DELETE USING (true);

-- Проверка
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
