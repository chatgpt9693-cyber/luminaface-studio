-- Создание мастер-аккаунта
-- Выполните этот скрипт в Supabase SQL Editor ПОСЛЕ выполнения schema.sql

-- Шаг 1: Создайте пользователя через Supabase Dashboard
-- Authentication → Users → Add user → Create new user
-- Email: rf9339945@gmail.com
-- Password: rf9339945
-- Auto Confirm User: ✅ (включите!)

-- Шаг 2: После создания пользователя, скопируйте его UUID из списка пользователей
-- и замените 'USER_UUID_HERE' ниже на этот UUID

-- Шаг 3: Выполните этот запрос (замените USER_UUID_HERE на реальный UUID):
/*
INSERT INTO public.profiles (id, email, full_name, role, telegram_chat_id, avatar_url)
VALUES (
  'USER_UUID_HERE',
  'rf9339945@gmail.com',
  'Анна Белькович',
  'MASTER',
  NULL,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Анна Белькович',
  role = 'MASTER';
*/

-- Альтернативный способ: Если пользователь уже создан и есть в auth.users,
-- можно использовать этот запрос (он найдет UUID автоматически):
INSERT INTO public.profiles (id, email, full_name, role, telegram_chat_id, avatar_url)
SELECT 
  id,
  'rf9339945@gmail.com',
  'Анна Белькович',
  'MASTER',
  NULL,
  NULL
FROM auth.users
WHERE email = 'rf9339945@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Анна Белькович',
  role = 'MASTER';
