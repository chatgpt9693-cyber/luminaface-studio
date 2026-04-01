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

        {/* Welcome - Enhanced with 3D effects */}
        <motion.div variants={item} className="relative overflow-hidden rounded-3xl border border-primary/25 p-6 sm:p-8" style={{
          background: 'linear-gradient(145deg, hsl(340 45% 72% / 0.12), hsl(280 30% 70% / 0.08), hsl(340 45% 72% / 0.06))',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 20px 60px -15px hsl(340 45% 72% / 0.3), 0 0 0 1px hsl(340 45% 72% / 0.1) inset'
        }}>
          {/* Animated background orbs */}
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-3xl opacity-30" 
            style={{ 
              background: 'radial-gradient(circle, hsl(340 45% 72% / 0.4), transparent 70%)',
              animation: 'float-slow 8s ease-in-out infinite'
            }} 
          />
          <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 rounded-full blur-3xl opacity-20" 
            style={{ 
              background: 'radial-gradient(circle, hsl(280 30% 70% / 0.4), transparent 70%)',
              animation: 'float-slow 10s ease-in-out infinite reverse'
            }} 
          />
          
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1 opacity-80">{greeting()},</p>
              <h2 className="text-2xl sm:text-4xl font-bold glow-text mb-2 truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                {user?.name?.split(' ')[0]} ✨
              </h2>
              <p className="text-sm sm:text-base text-foreground/90 mb-4 sm:mb-5 font-light">Ваша кожа заслуживает лучшего</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-primary/30 text-xs sm:text-sm text-primary font-medium whitespace-nowrap backdrop-blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.2), hsl(340 45% 72% / 0.1))',
                    boxShadow: '0 4px 12px hsl(340 45% 72% / 0.2), 0 0 0 1px hsl(340 45% 72% / 0.2) inset'
                  }}>
                  💎 Premium клиент
                </div>
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-secondary/80 backdrop-blur-sm text-xs sm:text-sm text-muted-foreground whitespace-nowrap border border-border/50">
                  {totalVisits} процедур
                </div>
              </div>
            </div>
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center text-xl sm:text-3xl flex-shrink-0 relative"
              style={{
                background: 'linear-gradient(145deg, hsl(340 45% 72% / 0.3), hsl(280 30% 70% / 0.2))',
                boxShadow: '0 8px 24px hsl(340 45% 72% / 0.3), 0 0 0 2px hsl(340 45% 72% / 0.3) inset',
                backdropFilter: 'blur(12px)'
              }}>
              <span className="relative z-10">{user?.avatarInitials}</span>
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* Upcoming appointment - Enhanced with 3D depth */}
        {upcomingAppointment && (
          <motion.div 
            variants={item} 
            className="premium-card p-5 sm:p-6"
          >
            <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 rounded-full blur-2xl opacity-20" 
              style={{ background: 'radial-gradient(circle, hsl(340 45% 72%), transparent)' }} 
            />
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
                <span className="text-base sm:text-lg font-bold text-primary">{upcomingAppointment.price.toLocaleString()} Br</span>
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
            {/* CTA Button - More prominent with 3D effect */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/35 p-5 sm:p-6" style={{
              background: 'linear-gradient(145deg, hsl(340 45% 72% / 0.18), hsl(280 30% 70% / 0.12))',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 12px 40px -10px hsl(340 45% 72% / 0.4), 0 0 0 1px hsl(340 45% 72% / 0.15) inset'
            }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-40" 
                style={{ background: 'radial-gradient(circle, hsl(340 45% 72%), transparent)' }} 
              />
              <div className="relative">
                <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-3 sm:mb-4">Готовы к преображению?</h3>
                <button
                  onClick={() => navigate('/client/booking')}
                  className="btn-3d w-full flex items-center gap-3 sm:gap-4 p-5 sm:p-6 rounded-2xl border border-primary/40 transition-all group"
                  style={{
                    background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.25), hsl(280 30% 70% / 0.2))',
                    boxShadow: '0 8px 24px -8px hsl(340 45% 72% / 0.4), 0 0 0 1px hsl(340 45% 72% / 0.2) inset'
                  }}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.4), hsl(340 45% 72% / 0.3))',
                      boxShadow: '0 4px 12px hsl(340 45% 72% / 0.3)'
                    }}>
                    <CalendarPlus className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-base sm:text-lg font-bold text-foreground truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Записаться на процедуру
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Выберите удобное время</p>
                  </div>
                  <div className="text-2xl sm:text-3xl flex-shrink-0 group-hover:scale-125 transition-transform">✨</div>
                </button>
              </div>
            </div>

            {/* Stats - Enhanced with depth */}
            <div className="premium-card p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(280 30% 70% / 0.2), hsl(280 30% 70% / 0.1))',
                    boxShadow: '0 4px 12px hsl(280 30% 70% / 0.2)'
                  }}>
                  <span className="text-base sm:text-lg">📊</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Ваша статистика
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-2xl border border-primary/20 relative overflow-hidden group hover:border-primary/40 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.12), hsl(340 45% 72% / 0.08))',
                    boxShadow: '0 4px 16px hsl(340 45% 72% / 0.15)'
                  }}>
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'radial-gradient(circle, hsl(340 45% 72% / 0.3), transparent)' }} 
                  />
                  <p className="stat-value text-2xl sm:text-3xl mb-1 relative z-10">{totalVisits}</p>
                  <p className="text-xs text-muted-foreground relative z-10">Процедур всего</p>
                </div>
                <div className="p-4 sm:p-5 rounded-2xl border border-lavender/20 relative overflow-hidden group hover:border-lavender/40 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, hsl(280 30% 70% / 0.12), hsl(280 30% 70% / 0.08))',
                    boxShadow: '0 4px 16px hsl(280 30% 70% / 0.15)'
                  }}>
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'radial-gradient(circle, hsl(280 30% 70% / 0.3), transparent)' }} 
                  />
                  <p className="stat-value text-2xl sm:text-3xl mb-1 relative z-10">{thisMonthVisits}</p>
                  <p className="text-xs text-muted-foreground relative z-10">В этом месяце</p>
                </div>
                <div className="p-4 sm:p-5 rounded-2xl border border-border/50 col-span-2 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, hsl(280 8% 13%), hsl(280 8% 10%))',
                    boxShadow: '0 4px 16px hsl(280 20% 0% / 0.3)'
                  }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl sm:text-2xl flex-shrink-0">💡</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1.5">Рекомендация эксперта</p>
                      <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
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
