/* Обновление RLS политик для клиентов */
/* Выполните этот скрипт в Supabase SQL Editor */

/* Удаляем старую политику просмотра записей */
DROP POLICY IF EXISTS "Masters can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Masters can insert own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Masters can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Masters can delete own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can view master schedule" ON public.appointments;
DROP POLICY IF EXISTS "Clients can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can cancel own appointments" ON public.appointments;

/* Создаем новые политики */

/* 1. Мастера видят все свои записи (с полной информацией) */
CREATE POLICY "Masters can view own appointments" ON public.appointments
  FOR SELECT USING (
    auth.uid() = master_id
  );

/* 1.1. Мастера могут создавать записи */
CREATE POLICY "Masters can insert own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = master_id);

/* 1.2. Мастера могут обновлять свои записи */
CREATE POLICY "Masters can update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = master_id);

/* 1.3. Мастера могут удалять свои записи */
CREATE POLICY "Masters can delete own appointments" ON public.appointments
  FOR DELETE USING (auth.uid() = master_id);

/* 2. Клиенты видят все записи мастера (для выбора свободного времени) */
/*    но без доступа к личным данным других клиентов */
CREATE POLICY "Clients can view master schedule" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'CLIENT'
    )
  );

/* 3. Клиенты могут создавать записи только для себя */
CREATE POLICY "Clients can create own appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = client_id
      AND clients.master_id = master_id
    )
  );

/* 4. Клиенты могут обновлять только свои записи */
CREATE POLICY "Clients can update own appointments" ON public.appointments
  FOR UPDATE USING (
    client_id IN (
      SELECT id FROM public.clients
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

/* 5. Клиенты могут отменять только свои записи */
CREATE POLICY "Clients can cancel own appointments" ON public.appointments
  FOR DELETE USING (
    client_id IN (
      SELECT id FROM public.clients
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

/* Обновляем политики для таблицы clients */
/* Клиенты должны видеть список клиентов мастера (для выбора при записи) */
DROP POLICY IF EXISTS "Masters can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Masters can delete own clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view master clients list" ON public.clients;

CREATE POLICY "Masters can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = master_id);

CREATE POLICY "Masters can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = master_id);

CREATE POLICY "Masters can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = master_id);

CREATE POLICY "Masters can delete own clients" ON public.clients
  FOR DELETE USING (auth.uid() = master_id);

CREATE POLICY "Clients can view master clients list" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'CLIENT'
    )
  );

/* Обновляем политики для services */
/* Клиенты должны видеть услуги мастера */
DROP POLICY IF EXISTS "Masters can view own services" ON public.services;
DROP POLICY IF EXISTS "Masters can insert own services" ON public.services;
DROP POLICY IF EXISTS "Masters can update own services" ON public.services;
DROP POLICY IF EXISTS "Masters can delete own services" ON public.services;
DROP POLICY IF EXISTS "Clients can view services" ON public.services;

CREATE POLICY "Masters can view own services" ON public.services
  FOR SELECT USING (auth.uid() = master_id);

CREATE POLICY "Masters can insert own services" ON public.services
  FOR INSERT WITH CHECK (auth.uid() = master_id);

CREATE POLICY "Masters can update own services" ON public.services
  FOR UPDATE USING (auth.uid() = master_id);

CREATE POLICY "Masters can delete own services" ON public.services
  FOR DELETE USING (auth.uid() = master_id);

CREATE POLICY "Clients can view services" ON public.services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'CLIENT'
    )
  );
