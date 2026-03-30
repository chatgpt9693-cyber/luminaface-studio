import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Check, Copy } from 'lucide-react';

export default function TelegramConnect() {
  const [copied, setCopied] = useState(false);
  const code = 'BF-' + Math.random().toString(36).slice(2, 8).toUpperCase();

  const copyCode = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Send className="w-4 h-4 text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Подключить Telegram</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Получайте напоминания о записях за 24 часа до процедуры
      </p>

      <div className="bg-secondary/50 rounded-xl p-3 mb-3">
        <p className="text-xs text-muted-foreground mb-2">Ваш код подключения:</p>
        <div className="flex items-center gap-2">
          <code className="text-base font-mono font-bold text-primary tracking-wider">{code}</code>
          <button onClick={copyCode} className="ml-auto p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Отправьте этот код боту{' '}
        <a href="https://t.me/BelkafacesBot" target="_blank" rel="noreferrer" className="text-primary hover:underline">
          @BelkafacesBot
        </a>
        {' '}в Telegram
      </p>
    </motion.div>
  );
}
