import { motion } from 'framer-motion';
import { Bell, Send, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import Topbar from '@/components/layout/Topbar';
import NotificationSettings from '@/components/NotificationSettings';
import TelegramConnect from '@/components/TelegramConnect';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function NotificationsPage() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { notifications, loading } = useNotifications();
  const { settings } = useNotificationSettings();

  const handleTestNotification = async () => {
    if (!settings?.telegramChatId) {
      toast.error('Сначала подключите Telegram');
      return;
    }

    try {
      // Создаем запись в БД для истории
      await supabase.from('notifications').insert({
        user_id: user?.id,
        type: 'CUSTOM',
        channel: 'TELEGRAM',
        status: 'SENT',
        title: 'Тестовое уведомление',
        message: 'Привет! Это тестовое сообщение от Belka_faces. Уведомления работают! 🎉',
        sent_at: new Date().toISOString(),
      });

      // Отправляем через Telegram Bot API
      const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      if (!BOT_TOKEN) {
        toast.error('Токен бота не настроен');
        return;
      }

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: `🔔 Тестовое уведомление\n\nПривет! Это тестовое сообщение от Belka_faces.\n\nУведомления работают! 🎉`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || 'Failed to send');
      }

      toast.success('Тестовое уведомление отправлено! Проверьте Telegram');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleTestAppointment = async () => {
    if (!settings?.telegramChatId) {
      toast.error('Сначала подключите Telegram');
      return;
    }

    try {
      // Отправляем команду /reminder боту через API
      const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      if (!BOT_TOKEN) {
        toast.error('Токен бота не настроен');
        return;
      }

      // Проверяем роль пользователя
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user?.id)
        .single();

      let appointments;
      
      // Если мастер - ищем записи где он мастер
      if (profile?.role === 'MASTER') {
        const { data } = await supabase
          .from('appointments')
          .select('id, date_time, duration, price, client_id, master_id')
          .eq('master_id', user?.id)
          .eq('status', 'CONFIRMED')
          .order('date_time', { ascending: true })
          .limit(1);
        appointments = data;
      } else {
        // Если клиент - ищем записи где он клиент
        const { data } = await supabase
          .from('appointments')
          .select('id, date_time, duration, price, client_id, master_id')
          .eq('client_id', user?.id)
          .eq('status', 'CONFIRMED')
          .order('date_time', { ascending: true })
          .limit(1);
        appointments = data;
      }

      if (!appointments || appointments.length === 0) {
        toast.error('У вас нет записей для тестирования');
        return;
      }

      const appointment = appointments[0];

      // Получаем имя клиента
      const { data: client } = await supabase
        .from('clients')
        .select('full_name')
        .eq('id', appointment.client_id)
        .single();

      // Получаем настройки уведомлений клиента
      const { data: clientSettings } = await supabase
        .from('notification_settings')
        .select('telegram_chat_id')
        .eq('user_id', appointment.client_id)
        .single();

      if (!clientSettings?.telegram_chat_id) {
        toast.error('У клиента не подключен Telegram');
        return;
      }

      const dateTime = new Date(appointment.date_time);
      const message = 
        `🔔 Напоминание о записи\n\n` +
        `Привет, ${client?.full_name || 'Клиент'}!\n\n` +
        `Напоминаем о вашей записи:\n` +
        `📅 ${dateTime.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
        `🕐 ${dateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}\n` +
        `⏱ Длительность: ${appointment.duration} мин\n` +
        `💰 Стоимость: ${appointment.price} ₽\n\n` +
        `До встречи! ✨`;

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: clientSettings.telegram_chat_id,
          text: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || 'Failed to send');
      }

      // Сохраняем в БД
      await supabase.from('notifications').insert({
        user_id: appointment.client_id,
        appointment_id: appointment.id,
        type: 'CUSTOM',
        channel: 'TELEGRAM',
        status: 'SENT',
        title: 'Тестовое напоминание о записи',
        message: message,
        sent_at: new Date().toISOString(),
      });

      toast.success('Напоминание отправлено клиенту!');
      toast.info(`Клиент: ${client?.full_name}, Запись: ${dateTime.toLocaleDateString('ru-RU')} в ${dateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      toast.error('Ошибка при отправке напоминания');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'text-green-500 bg-green-500/10';
      case 'FAILED': return 'text-red-500 bg-red-500/10';
      case 'PENDING': return 'text-yellow-500 bg-yellow-500/10';
      case 'CANCELLED': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-muted-foreground bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SENT': return 'Отправлено';
      case 'FAILED': return 'Ошибка';
      case 'PENDING': return 'Ожидание';
      case 'CANCELLED': return 'Отменено';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'REMINDER_24H': return 'Напоминание за 24ч';
      case 'REMINDER_2H': return 'Напоминание за 2ч';
      case 'NEW_BOOKING': return 'Новая запись';
      case 'CANCELLATION': return 'Отмена';
      case 'CONFIRMATION': return 'Подтверждение';
      default: return type;
    }
  };

  return (
    <div className={isMobile ? 'min-h-screen bg-background' : ''}>
      <Topbar title="Уведомления" />
      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className={isMobile ? 'pt-14 pb-4 px-4 space-y-4' : 'p-6 space-y-6'}
      >
        {/* Settings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <motion.div variants={item}>
            <NotificationSettings />
          </motion.div>
          <motion.div variants={item} className="space-y-4">
            <TelegramConnect />
            
            {/* Test notification buttons */}
            {settings?.telegramEnabled && settings?.telegramChatId && (
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                    <Send className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Тестирование</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Проверьте работу уведомлений
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={handleTestNotification}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Отправить тестовое сообщение
                  </Button>
                  <Button
                    onClick={handleTestAppointment}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Отправить напоминание о записи
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  💡 Обе кнопки отправляют сообщения мгновенно. Вторая отправит напоминание о вашей ближайшей записи.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Notification History */}
        <motion.div variants={item} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">История уведомлений</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Нет уведомлений</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">{notif.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(notif.status)}`}>
                          {getStatusText(notif.status)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {new Date(notif.createdAt).toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {new Date(notif.createdAt).toLocaleTimeString('ru-RU', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {getTypeText(notif.type)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {notif.channel === 'TELEGRAM' ? '📱 Telegram' : 
                       notif.channel === 'EMAIL' ? '📧 Email' : 
                       '📱 SMS'}
                    </span>
                  </div>
                  {notif.errorMessage && (
                    <p className="text-xs text-red-500 mt-2">Ошибка: {notif.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
