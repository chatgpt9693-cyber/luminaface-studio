import { bot } from '../index';

interface AppointmentData {
  clientName: string;
  serviceName: string;
  dateTime: Date;
  duration: number;
  price: number;
}

export async function sendReminder24h(chatId: string, data: AppointmentData) {
  const dateStr = data.dateTime.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  
  const timeStr = data.dateTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const message = 
    `🔔 Напоминание о записи\n\n` +
    `Здравствуйте, ${data.clientName}!\n\n` +
    `Напоминаем, что завтра у вас запись:\n\n` +
    `✨ ${data.serviceName}\n` +
    `📅 ${dateStr}\n` +
    `🕐 ${timeStr}\n` +
    `⏱ ${data.duration} минут\n` +
    `💰 ${data.price} Br\n\n` +
    `Ждём вас! 💕`;

  await bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Подтвердить', callback_data: 'confirm' },
          { text: '❌ Отменить', callback_data: 'cancel' }
        ]
      ]
    }
  });
}

export async function sendReminder2h(chatId: string, data: AppointmentData) {
  const timeStr = data.dateTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const message = 
    `⏰ Скоро ваша запись!\n\n` +
    `${data.clientName}, через 2 часа вас ждут на процедуру:\n\n` +
    `✨ ${data.serviceName}\n` +
    `🕐 ${timeStr}\n` +
    `⏱ ${data.duration} минут\n\n` +
    `Не забудьте! 💕`;

  await bot.sendMessage(chatId, message);
}

export async function sendNewBooking(chatId: string, data: AppointmentData) {
  const dateStr = data.dateTime.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  
  const timeStr = data.dateTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const message = 
    `✅ Новая запись создана!\n\n` +
    `${data.clientName}, вы успешно записались:\n\n` +
    `✨ ${data.serviceName}\n` +
    `📅 ${dateStr}\n` +
    `🕐 ${timeStr}\n` +
    `⏱ ${data.duration} минут\n` +
    `💰 ${data.price} Br\n\n` +
    `До встречи! 💕`;

  await bot.sendMessage(chatId, message);
}

export async function sendCancellation(chatId: string, data: AppointmentData) {
  const dateStr = data.dateTime.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long'
  });
  
  const timeStr = data.dateTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const message = 
    `❌ Запись отменена\n\n` +
    `${data.clientName}, ваша запись была отменена:\n\n` +
    `✨ ${data.serviceName}\n` +
    `📅 ${dateStr} в ${timeStr}\n\n` +
    `Вы можете записаться на другое время в приложении.`;

  await bot.sendMessage(chatId, message);
}
