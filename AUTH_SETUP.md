# Настройка Supabase Authentication

## Шаг 1: Создание проекта Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Дождитесь завершения инициализации

## Шаг 2: Выполнение SQL схемы

1. Откройте SQL Editor в Supabase Dashboard
2. Скопируйте содержимое файла `supabase/schema.sql`
3. Выполните скрипт

Схема автоматически создаст:
- Таблицу `profiles` для профилей пользователей
- Таблицы `clients`, `services`, `appointments`
- RLS политики для безопасности
- Триггер для автоматического создания профиля при регистрации

## Шаг 3: Настройка переменных окружения

1. Скопируйте `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```

2. Заполните переменные из Supabase Dashboard:
   - `VITE_SUPABASE_URL` - Project Settings → API → Project URL
   - `VITE_SUPABASE_ANON_KEY` - Project Settings → API → anon/public key

## Шаг 4: Настройка Email подтверждения (опционально)

По умолчанию Supabase требует подтверждение email. Для разработки можно отключить:

1. Authentication → Settings → Email Auth
2. Отключите "Enable email confirmations"

Или настройте SMTP для отправки писем:
1. Authentication → Settings → SMTP Settings
2. Введите данные вашего SMTP сервера

## Шаг 5: Тестирование

### Регистрация нового пользователя:
1. Перейдите на `/register`
2. Заполните форму
3. Выберите роль (Мастер или Клиент)
4. Нажмите "Зарегистрироваться"

### Вход:
1. Перейдите на `/login`
2. Введите email и пароль
3. Нажмите "Войти"

### Демо-аккаунты (без Supabase):
Если Supabase не настроен, работают демо-аккаунты:
- Мастер: `master@belkafaces.ru` / `demo123`
- Клиент: `client@example.ru` / `demo123`

## Возможности

### Реализовано:
- ✅ Регистрация с выбором роли (Мастер/Клиент)
- ✅ Вход с email и паролем
- ✅ Автоматическое создание профиля через триггер БД
- ✅ Сохранение сессии (автоматический вход)
- ✅ Выход из аккаунта
- ✅ Защищенные роуты
- ✅ Fallback на демо-аккаунты без Supabase

### Дополнительные возможности Supabase Auth:
- OAuth провайдеры (Google, GitHub, etc.)
- Magic Link (вход по ссылке из email)
- Сброс пароля
- Обновление профиля
- MFA (двухфакторная аутентификация)

## Структура данных

### Таблица profiles:
```sql
- id (UUID) - связь с auth.users
- email (TEXT)
- full_name (TEXT)
- role (TEXT) - 'MASTER' или 'CLIENT'
- telegram_chat_id (TEXT, nullable)
- avatar_url (TEXT, nullable)
- created_at, updated_at
```

### Триггер автоматического создания профиля:
При регистрации через `signUp()` с metadata:
```typescript
{
  data: {
    full_name: "Имя Фамилия",
    role: "MASTER" // или "CLIENT"
  }
}
```

Триггер `on_auth_user_created` автоматически создаст запись в `profiles`.

## Безопасность

### Row Level Security (RLS):
- Пользователи видят только свой профиль
- Мастера видят только своих клиентов, услуги и записи
- Клиенты (в будущем) смогут видеть только свои записи

### Политики доступа:
Все настроены в `schema.sql` - проверьте секцию "RLS Policies"

## Troubleshooting

### Ошибка "User already registered":
Email уже используется. Используйте другой или войдите.

### Ошибка "Invalid login credentials":
Неверный email или пароль.

### Профиль не создается:
Проверьте, что триггер `on_auth_user_created` создан в БД.

### Supabase не настроен:
Приложение автоматически переключится на демо-режим с моковыми данными.
