import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Check, Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useAuth } from '@/contexts/AuthContext';

export default function TelegramConnect() {
  const { user } = useAuth();
  const { settings, loading, connectTelegram, disconnectTelegram } = useNotificationSettings();
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    // Получаем код из настроек
    if (settings?.connectionCode) {
      setCode(settings.connectionCode);
    } else if (user) {
      // Fallback: генерируем временный код
      const hash = user.id.substring(0, 6).toUpperCase();
      setCode(`BF-${hash}`);
    }
  }, [user, settings]);

  const copyCode = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = async () => {
    try {
      await disconnectTelegram();
      toast.success('Telegram отключен');
    } catch (error) {
      toast.error('Ошибка при отключении');
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

  const isConnected = settings?.telegramEnabled && settings?.telegramChatId;

  const telegramLink = `https://t.me/belka_faces_bot?start=${code}`;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isConnected ? 'bg-green-500/20' : 'bg-blue-500/20'
          }`}>
            <Send className={`w-4 h-4 ${isConnected ? 'text-green-400' : 'text-blue-400'}`} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {isConnected ? 'Telegram подключен' : 'Подключить Telegram'}
          </h3>
        </div>
        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            title="Отключить"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <Check className="w-3.5 h-3.5" />
            <span>Уведомления активны</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Вы будете получать напоминания о записях в Telegram
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-4">
            Получайте напоминания о записях за 24 часа до процедуры
          </p>

          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-center font-medium transition-colors mb-3"
          >
            <div className="flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              <span>Подключить в один клик</span>
            </div>
          </a>

          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground transition-colors mb-2">
              Или подключить вручную
            </summary>
            <div className="bg-secondary/50 rounded-xl p-3 mb-2">
              <p className="text-xs text-muted-foreground mb-2">Ваш код подключения:</p>
              <div className="flex items-center gap-2">
                <code className="text-base font-mono font-bold text-primary tracking-wider">{code}</code>
                <button 
                  onClick={copyCode} 
                  className="ml-auto p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                  title="Копировать"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                </button>
              </div>
            </div>
            <p className="text-xs">
              Отправьте этот код боту{' '}
              <a href="https://t.me/belka_faces_bot" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                @belka_faces_bot
              </a>
              {' '}в Telegram
            </p>
          </details>
        </>
      )}
    </motion.div>
  );
}
