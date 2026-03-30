-- Belka_faces Database Schema
-- Скопируй этот скрипт и выполни в Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('MASTER', 'CLIENT')),
  telegram_chat_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  master_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  total_visits INTEGER DEFAULT 0,
  last_visit DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  master_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- в минутах
  price INTEGER NOT NULL, -- в рублях
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  master_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  duration INTEGER NOT NULL,
  price INTEGER NOT NULL,
  notes TEXT,
  face_zones TEXT[], -- массив зон лица ['forehead', 'eyes', 'cheeks', etc.]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes для производительности
CREATE INDEX idx_clients_master_id ON public.clients(master_id);
CREATE INDEX idx_services_master_id ON public.services(master_id);
CREATE INDEX idx_appointments_master_id ON public.appointments(master_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_date_time ON public.appointments(date_time);

-- RLS (Row Level Security) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Clients policies (только мастер видит своих клиентов)
CREATE POLICY "Masters can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = master_id);

CREATE POLICY "Masters can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = master_id);

CREATE POLICY "Masters can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = master_id);

CREATE POLICY "Masters can delete own clients" ON public.clients
  FOR DELETE USING (auth.uid() = master_id);

-- Services policies
CREATE POLICY "Masters can view own services" ON public.services
  FOR SELECT USING (auth.uid() = master_id);

CREATE POLICY "Masters can insert own services" ON public.services
  FOR INSERT WITH CHECK (auth.uid() = master_id);

CREATE POLICY "Masters can update own services" ON public.services
  FOR UPDATE USING (auth.uid() = master_id);

CREATE POLICY "Masters can delete own services" ON public.services
  FOR DELETE USING (auth.uid() = master_id);

-- Appointments policies
CREATE POLICY "Masters can view own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = master_id);

CREATE POLICY "Masters can insert own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = master_id);

CREATE POLICY "Masters can update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = master_id);

CREATE POLICY "Masters can delete own appointments" ON public.appointments
  FOR DELETE USING (auth.uid() = master_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Новый пользователь'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CLIENT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для создания профиля
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Вставка тестовых данных (опционально)
-- Раскомментируй, если нужны тестовые данные

/*
-- Тестовый мастер (пароль: demo123)
-- Сначала создай пользователя через Supabase Auth UI: master@belkafaces.ru
-- Затем обнови его профиль:
UPDATE public.profiles 
SET full_name = 'Анастасия Белкина', role = 'MASTER'
WHERE email = 'master@belkafaces.ru';

-- Получи master_id из profiles и вставь тестовые данные:
-- INSERT INTO public.services (master_id, name, duration, price, description) VALUES
-- ('твой-master-id-uuid', 'Лимфодренажный массаж лица', 30, 3500, 'Мягкий лимфодренаж для снятия отёчности'),
-- ('твой-master-id-uuid', 'Скульптурный массаж лица', 60, 6000, 'Глубокая проработка мышечного каркаса');
*/
