import { bot, supabase } from '../index';
import { sendReminder24h, sendReminder2h } from './templates';

export function startNotificationScheduler() {
  console.log('📅 Notification scheduler started (checking every 30 seconds for testing)');

  // Проверяем каждые 30 секунд (для тестирования)
  setInterval(async () => {
    await checkAndSendNotifications();
  }, 30 * 1000);

  // Первая проверка сразу
  checkAndSendNotifications();
}

async function checkAndSendNotifications() {
  const now = new Date();
  console.log(`🔍 Checking for notifications at ${now.toLocaleTimeString('ru-RU')}`);
  
  // Время для напоминания за 24 часа (окно ±30 секунд для тестирования)
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in24hStart = new Date(in24h.getTime() - 30 * 1000);
  const in24hEnd = new Date(in24h.getTime() + 30 * 1000);

  // Время для напоминания за 2 часа (окно ±30 секунд для тестирования)
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const in2hStart = new Date(in2h.getTime() - 30 * 1000);
  const in2hEnd = new Date(in2h.getTime() + 30 * 1000);

  console.log(`  Looking for 2h reminders between ${in2hStart.toLocaleTimeString('ru-RU')} and ${in2hEnd.toLocaleTimeString('ru-RU')}`);

  try {
    // Напоминания за 24 часа
    await send24hReminders(in24hStart, in24hEnd);
    
    // Напоминания за 2 часа
    await send2hReminders(in2hStart, in2hEnd);
  } catch (error) {
    console.error('Error in notification scheduler:', error);
  }
}

async function send24hReminders(startTime: Date, endTime: Date) {
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      date_time,
      duration,
      price,
      client_id,
      clients!inner(full_name, email),
      services(name)
    `)
    .eq('status', 'CONFIRMED')
    .gte('date_time', startTime.toISOString())
    .lte('date_time', endTime.toISOString());

  if (error || !appointments) {
    console.error('Error fetching 24h appointments:', error);
    return;
  }

  for (const apt of appointments) {
    // Проверяем настройки уведомлений клиента
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('telegram_chat_id, telegram_enabled, reminder_24h')
      .eq('user_id', apt.client_id)
      .single();

    if (!settings || !settings.telegram_enabled || !settings.reminder_24h || !settings.telegram_chat_id) {
      continue;
    }

    // Проверяем, не отправляли ли уже это уведомление
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('appointment_id', apt.id)
      .eq('type', 'REMINDER_24H')
      .eq('status', 'SENT')
      .single();

    if (existing) continue;

    // Отправляем уведомление
    try {
      await sendReminder24h(
        settings.telegram_chat_id,
        {
          clientName: apt.clients.full_name,
          serviceName: apt.services?.name || 'Процедура',
          dateTime: new Date(apt.date_time),
          duration: apt.duration,
          price: apt.price,
        }
      );

      // Сохраняем в БД
      await supabase.from('notifications').insert({
        user_id: apt.client_id,
        appointment_id: apt.id,
        type: 'REMINDER_24H',
        channel: 'TELEGRAM',
        status: 'SENT',
        title: 'Напоминание о записи',
        message: `Напоминаем о записи завтра`,
        sent_at: new Date().toISOString(),
      });

      console.log(`✅ Sent 24h reminder for appointment ${apt.id}`);
    } catch (error) {
      console.error(`Error sending 24h reminder for appointment ${apt.id}:`, error);
      
      // Сохраняем ошибку
      await supabase.from('notifications').insert({
        user_id: apt.client_id,
        appointment_id: apt.id,
        type: 'REMINDER_24H',
        channel: 'TELEGRAM',
        status: 'FAILED',
        title: 'Напоминание о записи',
        message: `Напоминаем о записи завтра`,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

async function send2hReminders(startTime: Date, endTime: Date) {
  console.log(`  📋 Querying appointments for 2h reminders...`);
  console.log(`  🕐 Time window: ${startTime.toISOString()} to ${endTime.toISOString()}`);
  
  // Сначала посмотрим все CONFIRMED записи
  const { data: allAppointments } = await supabase
    .from('appointments')
    .select('id, date_time, status, client_id')
    .eq('status', 'CONFIRMED')
    .order('date_time', { ascending: true })
    .limit(10);
  
  console.log(`  📝 All CONFIRMED appointments in DB:`, allAppointments?.map(a => ({
    id: a.id.substring(0, 8),
    time: new Date(a.date_time).toLocaleString('ru-RU'),
    client: a.client_id.substring(0, 8)
  })));
  
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      date_time,
      duration,
      price,
      client_id,
      clients!inner(full_name, email),
      services(name)
    `)
    .eq('status', 'CONFIRMED')
    .gte('date_time', startTime.toISOString())
    .lte('date_time', endTime.toISOString());

  if (error) {
    console.error('  ❌ Error fetching 2h appointments:', error);
    return;
  }

  console.log(`  📊 Found ${appointments?.length || 0} appointments in time window`);

  if (!appointments || appointments.length === 0) return;

  for (const apt of appointments) {
    console.log(`  🔔 Processing appointment ${apt.id} for client ${apt.client_id}`);
    
    // Проверяем настройки уведомлений клиента
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('telegram_chat_id, telegram_enabled, reminder_2h')
      .eq('user_id', apt.client_id)
      .single();

    console.log(`    Settings:`, settings);

    if (!settings || !settings.telegram_enabled || !settings.reminder_2h || !settings.telegram_chat_id) {
      console.log(`    ⏭️  Skipping - notifications disabled or no chat_id`);
      continue;
    }

    // Проверяем, не отправляли ли уже это уведомление
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('appointment_id', apt.id)
      .eq('type', 'REMINDER_2H')
      .eq('status', 'SENT')
      .single();

    if (existing) {
      console.log(`    ⏭️  Skipping - already sent`);
      continue;
    }

    // Отправляем уведомление
    try {
      await sendReminder2h(
        settings.telegram_chat_id,
        {
          clientName: apt.clients.full_name,
          serviceName: apt.services?.name || 'Процедура',
          dateTime: new Date(apt.date_time),
          duration: apt.duration,
          price: apt.price,
        }
      );

      await supabase.from('notifications').insert({
        user_id: apt.client_id,
        appointment_id: apt.id,
        type: 'REMINDER_2H',
        channel: 'TELEGRAM',
        status: 'SENT',
        title: 'Скоро ваша запись',
        message: `Напоминаем о записи через 2 часа`,
        sent_at: new Date().toISOString(),
      });

      console.log(`    ✅ Sent 2h reminder for appointment ${apt.id}`);
    } catch (error) {
      console.error(`    ❌ Error sending 2h reminder for appointment ${apt.id}:`, error);
      
      await supabase.from('notifications').insert({
        user_id: apt.client_id,
        appointment_id: apt.id,
        type: 'REMINDER_2H',
        channel: 'TELEGRAM',
        status: 'FAILED',
        title: 'Скоро ваша запись',
        message: `Напоминаем о записи через 2 часа`,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
