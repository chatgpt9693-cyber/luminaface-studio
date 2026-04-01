import { useEffect, ReactNode } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

export function TelegramProvider({ children }: { children: ReactNode }) {
  const { tg, isTelegramWebApp } = useTelegram();

  useEffect(() => {
    if (isTelegramWebApp && tg) {
      // Настройка темы под Telegram
      document.documentElement.classList.add('dark');
      
      // Скрываем кнопку "Назад" по умолчанию
      tg.BackButton.hide();
      
      // Скрываем главную кнопку по умолчанию
      tg.MainButton.hide();
    }
  }, [isTelegramWebApp, tg]);

  return <>{children}</>;
}
