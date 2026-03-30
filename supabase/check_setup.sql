/* Проверка настройки системы */

/* 1. Проверяем, есть ли триггер для автоматического создания клиентов */
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_profile_created';

/* 2. Проверяем профили */
SELECT id, email, full_name, role, created_at
FROM public.profiles
ORDER BY created_at DESC;

/* 3. Проверяем клиентов */
SELECT c.id, c.full_name, c.email, c.phone, p.email as master_email
FROM public.clients c
LEFT JOIN public.profiles p ON c.master_id = p.id
ORDER BY c.created_at DESC;

/* 4. Проверяем услуги */
SELECT s.id, s.name, s.duration, s.price, p.email as master_email
FROM public.services s
LEFT JOIN public.profiles p ON s.master_id = p.id
ORDER BY s.created_at DESC;

/* 5. Проверяем записи */
SELECT 
  a.id,
  a.date_time,
  a.status,
  c.full_name as client_name,
  s.name as service_name,
  p.email as master_email
FROM public.appointments a
LEFT JOIN public.clients c ON a.client_id = c.id
LEFT JOIN public.services s ON a.service_id = s.id
LEFT JOIN public.profiles p ON a.master_id = p.id
ORDER BY a.date_time DESC;

/* 6. Проверяем RLS политики */
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
