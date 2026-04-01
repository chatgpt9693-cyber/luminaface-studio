import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import { handleStart, handleConnect, handleTestMessage, handleTestReminder } from './handlers/commands';
import { startNotificationScheduler } from './notifications/scheduler';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN!;
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

if (!token || !supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

export const bot = new TelegramBot(token, { polling: true });
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🤖 Belka_faces Bot started!');

// Команды
bot.onText(/\/start/, handleStart);
bot.onText(/\/test/, handleTestMessage);
bot.onText(/\/reminder/, handleTestReminder);
bot.onText(/^BF-[A-Z0-9]+$/, handleConnect);

// Запускаем планировщик уведомлений
startNotificationScheduler();

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('SIGINT', () => {
  console.log('\n👋 Bot stopped');
  bot.stopPolling();
  process.exit(0);
});
