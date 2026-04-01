-- Проверка и создание мастера для Belka_faces
-- Выполни этот скрипт в Supabase SQL Editor

-- Шаг 1: Проверяем существующих пользователей
SELECT 
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Шаг 2: Проверяем профили
SELECT * FROM public.profiles ORDER BY created_at DESC;

-- Если пользователь rf9339945@gmail.com существует, но профиль не создан:
-- Найди его ID из первого запроса и выполни:
/*
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'ЗАМЕНИ_НА_UUID_ИЗ_ПЕРВОГО_ЗАПРОСА',
  'rf9339945@gmail.com',
  'Анна Белькович',
  'MASTER'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Анна Белькович',
  role = 'MASTER';
*/

-- Если пользователь существует и профиль есть, но роль не MASTER:
UPDATE public.profiles 
SET role = 'MASTER', full_name = 'Анна Белькович'
WHERE email = 'rf9339945@gmail.com';

-- Проверка результата
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'rf9339945@gmail.com';
