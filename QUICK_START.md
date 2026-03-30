# ⚡ Быстрый старт

## Вариант 1: Запуск с моковыми данными (быстро)

Проект уже работает с тестовыми данными в памяти:

```bash
npm run dev
```

Открой http://localhost:8080/login и войди:
- Мастер: `master@belkafaces.ru` / `demo123`
- Клиент: `client@example.ru` / `demo123`

✅ Всё работает, но данные не сохраняются после перезагрузки страницы.

---

## Вариант 2: Подключение Supabase (реальная БД)

### 1️⃣ Выполни SQL в Supabase

1. Открой твой Supabase проект
2. Перейди в **SQL Editor**
3. Скопируй весь код из `supabase/schema.sql`
4. Вставь и нажми **Run**

### 2️⃣ Создай тестового пользователя

В **Authentication → Users** создай:
- Email: `master@belkafaces.ru`
- Password: `demo123`
- ✅ Auto Confirm User

Затем в SQL Editor выполни:
```sql
UPDATE public.profiles 
SET full_name = 'Анастасия Белкина', role = 'MASTER'
WHERE email = 'master@belkafaces.ru';
```

### 3️⃣ Настрой ключи

1. Скопируй `.env.example` в `.env`
2. Заполни ключи из **Project Settings → API**:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

### 4️⃣ Перезапусти

```bash
npm run dev
```

✅ Теперь все данные сохраняются в реальной БД!

---

## 📚 Подробная инструкция

Смотри `SUPABASE_SETUP.md` для детальных шагов и troubleshooting.

## 🎯 Что дальше?

После настройки БД можно:
- Добавить Telegram-бот для напоминаний
- Настроить PWA для оффлайн-режима
- Деплой на Vercel/Netlify
