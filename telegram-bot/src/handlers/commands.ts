import TelegramBot from 'node-telegram-bot-api';
import { bot, supabase } from '../index';

export async function handleStart(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const startParam = msg.text?.split(' ')[1]; // Получаем параметр после /start
  
  // Если есть код в параметре (deep link), сразу подключаем
  if (startParam && startParam.match(/^BF-[A-Z0-9]+$/)) {
    await handleConnect(msg, startParam);
    return;
  }
  
  await bot.sendMessage(
    chatId,
    `👋 Добро пожаловать в Belka_faces!\n\n` +
    `Для подключения уведомлений нажмите кнопку "Подключить Telegram" в приложении.\n\n` +
    `Вы будете получать:\n` +
    `🔔 Напоминания за 24 часа до записи\n` +
    `⏰ Напоминания за 2 часа до записи\n` +
    `✅ Подтверждения новых записей`,
    {
      reply_markup: {
        keyboard: [[{ text: '📱 Открыть приложение' }]],
        resize_keyboard: true
      }
    }
  );
}

export async function handleTestMessage(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(
    chatId,
    `🔔 Тестовое уведомление\n\n` +
    `Привет! Это тестовое сообщение от Belka_faces.\n\n` +
    `Уведомления работают! 🎉`
  );
}

export async function handleTestReminder(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  
  try {
    // Ищем настройки по chat_id
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('user_id')
      .eq('telegram_chat_id', chatId.toString())
      .single();

    if (!settings) {
      await bot.sendMessage(chatId, '❌ Сначала подключите Telegram через приложение');
      return;
    }

    // Ищем любую запись этого пользователя
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        id,
        date_time,
        duration,
        price,
        clients!inner(full_name),
        services(name)
      `)
      .eq('client_id', settings.user_id)
      .eq('status', 'CONFIRMED')
      .order('date_time', { ascending: true })
      .limit(1)
      .single();

    if (!appointment) {
      await bot.sendMessage(chatId, '❌ У вас нет записей для тестирования');
      return;
    }

    const dateTime = new Date(appointment.date_time);
    const message = 
      `🔔 Напоминание о записи\n\n` +
      `Привет, ${appointment.clients.full_name}!\n\n` +
      `Напоминаем о вашей записи:\n` +
      `📅 ${dateTime.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
      `🕐 ${dateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\n` +
      `⏱ Длительность: ${appointment.duration} мин\n` +
      `💰 Стоимость: ${appointment.price} ₽\n\n` +
      `До встречи! ✨`;

    await bot.sendMessage(chatId, message);

    // Сохраняем в БД
    await supabase.from('notifications').insert({
      user_id: settings.user_id,
      appointment_id: appointment.id,
      type: 'CUSTOM',
      channel: 'TELEGRAM',
      status: 'SENT',
      title: 'Тестовое напоминание',
      message: message,
      sent_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error sending test reminder:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при отправке напоминания');
  }
}

export async function handleConnect(msg: TelegramBot.Message, codeParam?: string) {
  const chatId = msg.chat.id;
  const code = codeParam || msg.text?.trim();
  
  if (!code || !code.match(/^BF-[A-Z0-9]+$/)) {
    await bot.sendMessage(chatId, '❌ Неверный формат кода. Код должен быть вида: BF-XXXXXX');
    return;
  }

  try {
    // Ищем пользователя по коду подключения
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('user_id, profiles!inner(id, full_name, email)')
      .eq('connection_code', code)
      .single();

    if (settingsError || !settings) {
      console.error('Settings lookup error:', settingsError);
      await bot.sendMessage(chatId, '❌ Код не найден. Проверьте правильность кода.');
      return;
    }

    const profile = settings.profiles;

    // Обновляем настройки уведомлений
    const { error: updateError } = await supabase
      .from('notification_settings')
      .update({
        telegram_chat_id: chatId.toString(),
        telegram_enabled: true,
      })
      .eq('user_id', settings.user_id);

    if (updateError) {
      console.error('Error updating notification settings:', updateError);
      await bot.sendMessage(chatId, '❌ Ошибка при подключении. Попробуйте позже.');
      return;
    }

    await bot.sendMessage(
      chatId,
      `✅ Отлично, ${profile.full_name}!\n\n` +
      `Telegram успешно подключен.\n` +
      `Теперь вы будете получать уведомления о записях.\n\n` +
      `Вы получите:\n` +
      `🔔 Напоминание за 24 часа до записи\n` +
      `⏰ Напоминание за 2 часа до записи\n` +
      `✅ Подтверждение новых записей`,
      {
        reply_markup: {
          keyboard: [
            [{ text: '📅 Мои записи' }, { text: '⚙️ Настройки' }],
            [{ text: '📱 Открыть приложение' }]
          ],
          resize_keyboard: true
        }
      }
    );
  } catch (error) {
    console.error('Error connecting Telegram:', error);
    await bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.');
  }
}
