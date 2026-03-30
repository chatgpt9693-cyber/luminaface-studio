/* Упрощенные политики БЕЗ проверки ролей */

-- Удаляем ВСЕ политики
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
DROP POLICY IF EXISTS "Anyone can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

DROP POLICY IF EXISTS "Masters can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can delete own clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view clients list" ON public.clients;
DROP POLICY IF EXISTS "Clients can view master clients list" ON public.clients;
DROP POLICY IF EXISTS "Masters full access to clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can view clients" ON public.clients;

DROP POLICY IF EXISTS "Masters can view own services" ON public.services;
DROP POLICY IF EXISTS "Masters can insert own services" ON public.services;
DROP POLICY IF EXISTS "Masters can update own services" ON public.services;
DROP POLICY IF EXISTS "Masters can delete own services" ON public.services;
DROP POLICY IF EXISTS "Clients can view services" ON public.services;
DROP POLICY IF EXISTS "Masters full access to services" ON public.services;
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Удаляем функции если существуют
DROP FUNCTION IF EXISTS public.is_master();
DROP FUNCTION IF EXISTS public.is_client();

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
  USING (id = auth.uid());

/* ============================================
   APPOINTMENTS POLICIES - МАКСИМАЛЬНО УПРОЩЕННЫЕ
   ============================================ */

-- Мастер: полный доступ к записям где он мастер
CREATE POLICY "Master appointments access" ON public.appointments
  FOR ALL 
  USING (master_id = auth.uid());

-- Все авторизованные: могут видеть записи (для клиентов чтобы выбрать время)
CREATE POLICY "Anyone can view appointments" ON public.appointments
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Все авторизованные: могут создавать записи
CREATE POLICY "Anyone can create appointments" ON public.appointments
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

/* ============================================
   CLIENTS POLICIES - МАКСИМАЛЬНО УПРОЩЕННЫЕ
   ============================================ */

-- Мастер: полный доступ к своим клиентам
CREATE POLICY "Master clients access" ON public.clients
  FOR ALL 
  USING (master_id = auth.uid());

-- Все авторизованные: могут видеть клиентов
CREATE POLICY "Anyone can view clients" ON public.clients
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

/* ============================================
   SERVICES POLICIES - МАКСИМАЛЬНО УПРОЩЕННЫЕ
   ============================================ */

-- Мастер: полный доступ к своим услугам
CREATE POLICY "Master services access" ON public.services
  FOR ALL 
  USING (master_id = auth.uid());

-- Все авторизованные: могут видеть услуги
CREATE POLICY "Anyone can view services" ON public.services
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);
