import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, Sparkles, Heart, Calendar as CalendarIcon } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function AboutServicePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <div className={isMobile ? 'min-h-screen bg-background' : ''}>
      <Topbar title="О процедуре" />
      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className={isMobile ? 'pt-14 pb-20 px-4 space-y-4' : 'p-6 space-y-6'}
      >
        {/* Hero Section */}
        <motion.div variants={item} className="glass-card p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Массаж лица
          </h1>
          <p className="text-sm text-muted-foreground">
            Комбинированная техника для глубокого расслабления и омоложения
          </p>
        </motion.div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.div variants={item} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Длительность</p>
                <p className="text-sm font-semibold text-foreground">1ч 20мин - 1ч 30мин</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Стоимость</p>
                <p className="text-sm font-semibold text-foreground">65 BYN</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card p-4 sm:col-span-1 col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Адрес</p>
                <p className="text-sm font-semibold text-foreground truncate">Независимости 85В</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Location */}
        <motion.div variants={item} className="glass-card p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Где проходит процедура</h3>
              <p className="text-sm text-muted-foreground">
                Независимости 85В, коворкинг Malina
              </p>
            </div>
          </div>
        </motion.div>

        {/* What's Included */}
        <motion.div variants={item} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Что входит в процедуру</h3>
          </div>
          
          <div className="space-y-3">
            {[
              { icon: '🧼', text: 'Умывание и тонизирование кожи' },
              { icon: '💆‍♀️', text: 'Массаж лица в комбинированной технике' },
              { icon: '🫱', text: 'Проработка шейно-воротниковой зоны' },
              { icon: '✨', text: 'Массаж декольте' },
              { icon: '🧠', text: 'Массаж головы (по желанию)' },
              { icon: '🎭', text: 'Маска для глубокого релакса' },
              { icon: '🧴', text: 'Тонизирование и уход после массажа' },
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                <span className="text-xl flex-shrink-0">{step.icon}</span>
                <p className="text-sm text-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Frequency Recommendations */}
        <motion.div variants={item} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Рекомендации по частоте</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Частота процедур подбирается индивидуально, в зависимости от реакции организма, состояния кожи и мышц:
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🌊</span>
                <h4 className="text-sm font-semibold text-foreground">Лимфодренаж и Асахи</h4>
              </div>
              <p className="text-sm text-muted-foreground">1 раз в 5 дней</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💆</span>
                <h4 className="text-sm font-semibold text-foreground">Классический массаж</h4>
              </div>
              <p className="text-sm text-muted-foreground">1 раз в 2-3 дня</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎯</span>
                <h4 className="text-sm font-semibold text-foreground">Буккальный массаж</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">1 раз в 5-7 дней</p>
              <p className="text-xs text-muted-foreground">
                Работа в долгую: снятие зажимов, расслабление и тонизирование мышц
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-muted-foreground">
              💡 Все зависит от индивидуальных особенностей: реакции лимфодренажа, тургора кожи, 
              степени зажатости мышц и скорости восстановления
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={item} className="glass-card p-5 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Готовы записаться на процедуру?
          </p>
          <Button 
            onClick={() => navigate('/booking')}
            className="w-full"
            size="lg"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Записаться на массаж
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
