# Telegram Bot для Belka_faces

Бот для отправки уведомлений о записях клиентам.

## Быстрый старт

1. Создайте бота через [@BotFather](https://t.me/BotFather):
   - Отправьте `/newbot`
   - Назовите бота: `Belka_faces`
   - Username: `belka_faces_bot`
   - Скопируйте токен

2. Установите зависимости:
```bash
cd telegram-bot
npm install
```

3. Настройте переменные окружения:
```bash
cp .env.example .env
```

Отредактируйте `.env`:
- `TELEGRAM_BOT_TOKEN` - токен от BotFather
- `SUPABASE_URL` - URL вашего Supabase проекта
- `SUPABASE_SERVICE_KEY` - Service role key из Supabase

4. Выполните SQL скрипт в Supabase:
```sql
-- Выполните содержимое файла supabase/add_notifications.sql
```

5. Запустите бота:
```bash
npm run dev
```

## Как работает

1. Клиент нажимает "Подключить Telegram" в приложении
2. Открывается deep link: `https://t.me/belka_faces_bot?start=BF-XXXXX`
3. Бот автоматически связывает Telegram с аккаунтом
4. Каждые 5 минут бот проверяет записи и отправляет напоминания:
   - За 24 часа до записи
   - За 2 часа до записи

## Тестирование

В приложении на странице "Уведомления" есть две кнопки:
- **Отправить тестовое сообщение** - мгновенная отправка
- **Создать тестовую запись** - создает запись через 2 часа для проверки автоматических напоминаний

## Переменные окружения для фронтенда

Добавьте в `.env` проекта (корневой):
```
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
```

Это нужно для кнопки "Отправить тестовое сообщение".

## Деплой

Рекомендуется деплоить на:
- Railway.app (бесплатно)
- Render.com (бесплатно)
- Heroku
- VPS

## Структура

```
telegram-bot/
├── src/
│   ├── index.ts           # Основная логика бота
│   ├── handlers/          # Обработчики команд
│   │   └── commands.ts
│   └── notifications/     # Отправка уведомлений
│       ├── scheduler.ts
│       └── templates.ts
├── package.json
└── tsconfig.json
```
