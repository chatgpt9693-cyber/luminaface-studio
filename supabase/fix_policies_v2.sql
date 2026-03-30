/* Полное исправление политик с функциями-помощниками */

-- Удаляем все существующие политики
DROP POLICY IF EXISTS "Masters can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Masters can insert own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Masters can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Masters can delete own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can view master schedule" ON public.appointments;
DROP POLICY IF EXISTS "Clients can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Masters full access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can view appointments" ON public.appointments;

DROP POLICY IF EXISTS "Masters can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can delete own clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view clients list" ON public.clients;
DROP POLICY IF EXISTS "Clients can view master clients list" ON public.clients;
DROP POLICY IF EXISTS "Masters full access to clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view clients" ON public.clients;

DROP POLICY IF EXISTS "Masters can view own services" ON public.services;
DROP POLICY IF EXISTS "Masters can insert own services" ON public.services;
DROP POLICY IF EXISTS "Masters can update own services" ON public.services;
DROP POLICY IF EXISTS "Masters can delete own services" ON public.services;
DROP POLICY IF EXISTS "Clients can view services" ON public.services;
DROP POLICY IF EXISTS "Masters full access to services" ON public.services;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Создаем функции-помощники для проверки ролей
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'MASTER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'CLIENT'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Включаем RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

/* ============================================
   PROFILES POLICIES
   ============================================ */

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

/* ============================================
   APPOINTMENTS POLICIES - УПРОЩЕННЫЕ
   ============================================ */

-- Мастер: полный доступ к своим записям
CREATE POLICY "Masters full access to appointments" ON public.appointments
  FOR ALL 
  USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- Клиенты: могут видеть все записи и создавать свои
CREATE POLICY "Clients can view appointments" ON public.appointments
  FOR SELECT 
  USING (public.is_client());

CREATE POLICY "Clients can create appointments" ON public.appointments
  FOR INSERT 
  WITH CHECK (public.is_client());

/* ============================================
   CLIENTS POLICIES - УПРОЩЕННЫЕ
   ============================================ */

-- Мастер: полный доступ к своим клиентам
CREATE POLICY "Masters full access to clients" ON public.clients
  FOR ALL 
  USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- Клиенты: могут видеть список клиентов
CREATE POLICY "Clients can view clients" ON public.clients
  FOR SELECT 
  USING (public.is_client());

/* ============================================
   SERVICES POLICIES - УПРОЩЕННЫЕ
   ============================================ */

-- Мастер: полный доступ к своим услугам
CREATE POLICY "Masters full access to services" ON public.services
  FOR ALL 
  USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- Клиенты: могут видеть услуги
CREATE POLICY "Clients can view services" ON public.services
  FOR SELECT 
  USING (public.is_client());

-- Проверка созданных политик (выполни отдельно после создания)
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
