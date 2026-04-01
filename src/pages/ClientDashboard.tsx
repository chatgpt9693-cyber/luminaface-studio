import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { CalendarPlus, Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Topbar from '@/components/layout/Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/hooks/useAppointments';
import { utcToMinsk, formatTimeMinsk, formatDateMinsk } from '@/lib/timezone';
import type { FaceZone } from '@/components/FaceModel';

const FaceModel = lazy(() => import('@/components/FaceModel'));

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

// Zones treated in last visit (new zone ids)
const lastTreatedZones: FaceZone[] = ['left_cheek', 'right_cheek', 'neck', 'jawline'];

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { appointments, loading } = useAppointments();
  const [selectedZone, setSelectedZone] = useState<FaceZone | null>(null);

  // Находим ближайшую подтвержденную запись
  const now = new Date();
  const upcomingAppointment = appointments
    .filter(a => (a.status === 'CONFIRMED' || a.status === 'PENDING') && new Date(a.dateTime) > now)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];

  // Считаем статистику
  const totalVisits = appointments.filter(a => a.status === 'COMPLETED').length;
  const thisMonthVisits = appointments.filter(a => {
    if (a.status !== 'COMPLETED') return false;
    const aptDate = new Date(a.dateTime);
    const nowDate = new Date();
    return aptDate.getMonth() === nowDate.getMonth() && aptDate.getFullYear() === nowDate.getFullYear();
  }).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  if (loading) {
    return (
      <div>
        <Topbar title="Мой кабинет" />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Topbar title="Мой кабинет" />
      <motion.div variants={container} initial="hidden" animate="show" className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">

        {/* Welcome - Enhanced */}
        <motion.div variants={item} className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/20 p-4 sm:p-8" style={{
          background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.08), hsl(280 30% 70% / 0.05))',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-lavender/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">{greeting()},</p>
              <h2 className="text-2xl sm:text-3xl font-bold glow-text mb-2 truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                {user?.name?.split(' ')[0]} ✨
              </h2>
              <p className="text-sm sm:text-base text-foreground/80 mb-3 sm:mb-4">Ваша кожа заслуживает лучшего</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/15 border border-primary/25 text-xs text-primary font-medium whitespace-nowrap">
                  💎 Premium клиент
                </div>
                <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary/80 text-xs text-muted-foreground whitespace-nowrap">
                  {totalVisits} процедур
                </div>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/30 to-lavender/30 border-2 border-primary/40 flex items-center justify-center text-lg sm:text-2xl shadow-lg flex-shrink-0">
              {user?.avatarInitials}
            </div>
          </div>
        </motion.div>

        {/* Upcoming appointment - Enhanced */}
        {upcomingAppointment && (
          <motion.div 
            variants={item} 
            className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-primary/30 p-4 sm:p-6"
            style={{
              background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.12), hsl(280 30% 70% / 0.08))',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground block">Ближайшая запись</span>
                  <p className="text-xs sm:text-sm font-medium text-primary truncate">Скоро встретимся!</p>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                {upcomingAppointment.serviceName}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                <span className="px-2 py-1 rounded-lg bg-secondary/60 whitespace-nowrap">
                  📅 {new Date(upcomingAppointment.dateTime).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="px-2 py-1 rounded-lg bg-secondary/60 whitespace-nowrap">
                  🕐 {formatTimeMinsk(utcToMinsk(upcomingAppointment.dateTime))}
                </span>
                <span className="px-2 py-1 rounded-lg bg-secondary/60 whitespace-nowrap">
                  ⏱ {upcomingAppointment.duration} мин
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-primary/20">
                <span className="text-sm text-muted-foreground">Стоимость</span>
                <span className="text-base sm:text-lg font-bold text-primary">{upcomingAppointment.price.toLocaleString()} ₽</span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Face Model - Enhanced */}
          <motion.div variants={item} className="glass-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-foreground block truncate">Зоны обработки</span>
                  <p className="text-xs text-muted-foreground truncate">Последняя процедура</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap flex-shrink-0">
                {lastTreatedZones.length} зон
              </span>
            </div>
            <div className="relative">
              <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              }>
                <FaceModel
                  mode="history"
                  activeZones={lastTreatedZones}
                  selectedZone={selectedZone}
                  onZoneClick={setSelectedZone}
                />
              </Suspense>
            </div>
            {selectedZone && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/15"
              >
                <p className="text-xs text-center text-primary font-medium">
                  ✨ Нажмите на зону для подробной информации
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Quick actions & Stats - Enhanced */}
          <motion.div variants={item} className="space-y-4">
            {/* CTA Button - More prominent */}
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-primary/30 p-4 sm:p-6" style={{
              background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.15), hsl(280 30% 70% / 0.1))',
              backdropFilter: 'blur(20px)'
            }}>
              <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">Готовы к преображению?</h3>
                <button
                  onClick={() => navigate('/client/booking')}
                  className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-primary/20 to-lavender/20 border border-primary/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 transition-all group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <CalendarPlus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-foreground truncate">Записаться на процедуру</p>
                    <p className="text-xs text-muted-foreground truncate">Выберите удобное время</p>
                  </div>
                  <div className="text-xl sm:text-2xl flex-shrink-0">✨</div>
                </button>
              </div>
            </div>

            {/* Stats - Enhanced */}
            <div className="glass-card p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-lavender/15 border border-lavender/25 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs sm:text-sm">📊</span>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">Ваша статистика</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15">
                  <p className="stat-value text-xl sm:text-2xl mb-1">{totalVisits}</p>
                  <p className="text-xs text-muted-foreground">Процедур всего</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-lavender/10 to-lavender/5 border border-lavender/15">
                  <p className="stat-value text-xl sm:text-2xl mb-1">{thisMonthVisits}</p>
                  <p className="text-xs text-muted-foreground">В этом месяце</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 col-span-2 border border-border">
                  <div className="flex items-start gap-2">
                    <span className="text-base sm:text-lg flex-shrink-0">💡</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Рекомендация эксперта</p>
                      <p className="text-xs sm:text-sm font-medium text-foreground">
                        {totalVisits > 0 ? 'Лимфодренаж через 7 дней для закрепления результата' : 'Запишитесь на первую процедуру и получите скидку 10%'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
