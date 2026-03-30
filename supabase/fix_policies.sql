/* Полная очистка и пересоздание политик */

/* Удаляем ВСЕ существующие политики */
DROP POLICY IF EXISTS "Masters can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Masters can insert own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Masters can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Masters can delete own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can view master schedule" ON public.appointments;
DROP POLICY IF EXISTS "Clients can create own appointments" ON public.appointments;

DROP POLICY IF EXISTS "Masters can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can delete own clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view master clients list" ON public.clients;

DROP POLICY IF EXISTS "Masters can view own services" ON public.services;
DROP POLICY IF EXISTS "Masters can insert own services" ON public.services;
DROP POLICY IF EXISTS "Masters can update own services" ON public.services;
DROP POLICY IF EXISTS "Masters can delete own services" ON public.services;
DROP POLICY IF EXISTS "Clients can view services" ON public.services;

/* Убедимся что RLS включен */
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

/* ============================================
   APPOINTMENTS POLICIES
   ============================================ */

-- Мастер может видеть все свои записи
CREATE POLICY "Masters can view own appointments" ON public.appointments
  FOR SELECT 
  USING (master_id = auth.uid());

-- Мастер может создавать записи для себя
CREATE POLICY "Masters can insert own appointments" ON public.appointments
  FOR INSERT 
  WITH CHECK (master_id = auth.uid());

-- Мастер может обновлять свои записи
CREATE POLICY "Masters can update own appointments" ON public.appointments
  FOR UPDATE 
  USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- Мастер может удалять свои записи
CREATE POLICY "Masters can delete own appointments" ON public.appointments
  FOR DELETE 
  USING (master_id = auth.uid());

-- Клиенты могут видеть все записи (для выбора свободного времени)
CREATE POLICY "Clients can view all appointments" ON public.appointments
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'CLIENT'
    )
  );

-- Клиенты могут создавать записи для себя
CREATE POLICY "Clients can create appointments" ON public.appointments
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = client_id
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'CLIENT'
      )
    )
  );

/* ============================================
   CLIENTS POLICIES
   ============================================ */

-- Мастер может видеть всех своих клиентов
CREATE POLICY "Masters can view own clients" ON public.clients
  FOR SELECT 
  USING (master_id = auth.uid());

-- Мастер может добавлять клиентов
CREATE POLICY "Masters can insert own clients" ON public.clients
  FOR INSERT 
  WITH CHECK (master_id = auth.uid());

-- Мастер может обновлять своих клиентов
CREATE POLICY "Masters can update own clients" ON public.clients
  FOR UPDATE 
  USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- Мастер может удалять своих клиентов
CREATE POLICY "Masters can delete own clients" ON public.clients
  FOR DELETE 
  USING (master_id = auth.uid());

-- Клиенты могут видеть список клиентов мастера (для выбора времени)
CREATE POLICY "Clients can view clients list" ON public.clients
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'CLIENT'
    )
  );

/* ============================================
   SERVICES POLICIES
   ============================================ */

-- Мастер может видеть свои услуги
CREATE POLICY "Masters can view own services" ON public.services
  FOR SELECT 
  USING (master_id = auth.uid());

-- Мастер может добавлять услуги
CREATE POLICY "Masters can insert own services" ON public.services
  FOR INSERT 
  WITH CHECK (master_id = auth.uid());

-- Мастер может обновлять свои услуги
CREATE POLICY "Masters can update own services" ON public.services
  FOR UPDATE 
  USING (master_id = auth.uid())
  WITH CHECK (master_id = auth.uid());

-- Мастер может удалять свои услуги
CREATE POLICY "Masters can delete own services" ON public.services
  FOR DELETE 
  USING (master_id = auth.uid());

-- Клиенты могут видеть все услуги
CREATE POLICY "Clients can view services" ON public.services
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'CLIENT'
    )
  );
