import { motion } from 'framer-motion';
import { Bell, Mail, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { Switch } from '@/components/ui/switch';

export default function NotificationSettings() {
  const { settings, loading, updateSettings } = useNotificationSettings();

  const handleToggle = async (field: string, value: boolean) => {
    try {
      await updateSettings({ [field]: value });
      toast.success('Настройки обновлены');
    } catch (error) {
      toast.error('Ошибка при обновлении');
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!settings) return null;

  const notificationTypes = [
    {
      icon: Clock,
      label: 'Напоминание за 24 часа',
      description: 'Получать уведомление за день до записи',
      field: 'reminder24h',
      value: settings.reminder24h,
    },
    {
      icon: Clock,
      label: 'Напоминание за 2 часа',
      description: 'Получать уведомление за 2 часа до записи',
      field: 'reminder2h',
      value: settings.reminder2h,
    },
    {
      icon: Bell,
      label: 'Новые записи',
      description: 'Уведомлять о новых бронированиях',
      field: 'newBookingNotify',
      value: settings.newBookingNotify,
    },
    {
      icon: Bell,
      label: 'Отмены записей',
      description: 'Уведомлять об отмене записей',
      field: 'cancellationNotify',
      value: settings.cancellationNotify,
    },
  ];

  const channels = [
    {
      icon: MessageSquare,
      label: 'Telegram',
      description: 'Уведомления в Telegram',
      field: 'telegramEnabled',
      value: settings.telegramEnabled,
      disabled: !settings.telegramChatId,
    },
    {
      icon: Mail,
      label: 'Email',
      description: 'Уведомления на почту',
      field: 'emailEnabled',
      value: settings.emailEnabled,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Настройки уведомлений</h3>
          <p className="text-xs text-muted-foreground">Управление каналами и типами уведомлений</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Каналы уведомлений */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Каналы</p>
          <div className="space-y-3">
            {channels.map((channel) => (
              <div key={channel.field} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <channel.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{channel.label}</p>
                    <p className="text-xs text-muted-foreground">{channel.description}</p>
                    {channel.disabled && (
                      <p className="text-xs text-orange-500 mt-0.5">Требуется подключение</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={channel.value}
                  onCheckedChange={(checked) => handleToggle(channel.field, checked)}
                  disabled={channel.disabled}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Типы уведомлений */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Типы уведомлений</p>
          <div className="space-y-3">
            {notificationTypes.map((type) => (
              <div key={type.field} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <type.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                <Switch
                  checked={type.value}
                  onCheckedChange={(checked) => handleToggle(type.field, checked)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
