# 🗄️ Настройка Supabase

Пошаговая инструкция по подключению реальной базы данных.

## Шаг 1: Выполни SQL-скрипт

1. Открой Supabase Dashboard → **SQL Editor**
2. Нажми **New query**
3. Скопируй весь код из файла `supabase/schema.sql`
4. Вставь в редактор и нажми **Run** (или Ctrl+Enter)

✅ Должно появиться сообщение "Success. No rows returned"

## Шаг 2: Создай тестового мастера

1. Открой **Authentication** → **Users**
2. Нажми **Add user** → **Create new user**
3. Заполни:
   - Email: `master@belkafaces.ru`
   - Password: `demo123`
   - Auto Confirm User: ✅ (включи)
4. Нажми **Create user**

5. Открой **SQL Editor** и выполни:
```sql
UPDATE public.profiles 
SET full_name = 'Анастасия Белкина', role = 'MASTER'
WHERE email = 'master@belkafaces.ru';
```

## Шаг 3: Получи API ключи

1. Открой **Project Settings** (⚙️ внизу слева)
2. Перейди в **API**
3. Скопируй:
   - **Project URL** (например: `https://abcdefgh.supabase.co`)
   - **anon/public key** (длинный ключ)

## Шаг 4: Настрой проект

1. Скопируй `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Открой `.env` и вставь свои ключи:
```env
VITE_SUPABASE_URL=https://твой-проект.supabase.co
VITE_SUPABASE_ANON_KEY=твой-anon-ключ
```

3. Перезапусти dev-сервер:
```bash
npm run dev
```

## Шаг 5: Проверь работу

1. Открой http://localhost:8080/login
2. Войди как мастер: `master@belkafaces.ru` / `demo123`
3. Попробуй создать услугу или клиента
4. Открой Supabase → **Table Editor** → проверь, что данные появились в таблицах

## 🎉 Готово!

Теперь все данные сохраняются в реальной базе данных Supabase.

---

## 🔧 Troubleshooting

### Ошибка "relation does not exist"
- Убедись, что SQL-скрипт выполнился без ошибок
- Проверь, что таблицы созданы в **Table Editor**

### Ошибка "JWT expired" или "Invalid API key"
- Проверь, что ключи в `.env` скопированы правильно
- Убедись, что используешь **anon/public** ключ, а не service_role

### Не могу войти
- Проверь, что пользователь создан в **Authentication → Users**
- Убедись, что профиль обновлён (role = 'MASTER')
- Проверь, что Auto Confirm User был включён при создании

### Данные не сохраняются
- Открой консоль браузера (F12) и проверь ошибки
- Убедись, что RLS политики настроены (они в SQL-скрипте)
- Проверь, что `master_id` в запросах соответствует твоему user id
