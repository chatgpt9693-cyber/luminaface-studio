import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarPlus, Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Topbar from '@/components/layout/Topbar';
import FaceModel, { FaceZone } from '@/components/FaceModel';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/hooks/useAppointments';
import { utcToMinsk, formatTimeMinsk, formatDateMinsk } from '@/lib/timezone';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

// Zones treated in last visit
const lastTreatedZones: FaceZone[] = ['cheeks', 'lymph', 'jaw'];

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
    <div>
      <Topbar title="Мой кабинет" />
      <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">

        {/* Welcome */}
        <motion.div variants={item} className="glass-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{greeting()},</p>
              <h2 className="text-2xl font-bold glow-text mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                {user?.name?.split(' ')[0]} 🌸
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Ваша кожа заслуживает лучшего</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xl">
              {user?.avatarInitials}
            </div>
          </div>
        </motion.div>

        {/* Upcoming appointment */}
        {upcomingAppointment && (
          <motion.div variants={item} className="glass-card p-5 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Ближайшая запись</span>
            </div>
            <p className="text-base font-semibold text-foreground">{upcomingAppointment.serviceName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(upcomingAppointment.dateTime).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' '} в {formatTimeMinsk(utcToMinsk(upcomingAppointment.dateTime))}
            </p>
            <p className="text-sm text-muted-foreground">{upcomingAppointment.duration} мин · {upcomingAppointment.price.toLocaleString()} ₽</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Face Model */}
          <motion.div variants={item} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Зоны последней процедуры</span>
            </div>
            <FaceModel
              mode="history"
              activeZones={lastTreatedZones}
              selectedZone={selectedZone}
              onZoneClick={setSelectedZone}
            />
            {selectedZone && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-center text-muted-foreground mt-2">
                Нажмите на зону для подробностей
              </motion.p>
            )}
          </motion.div>

          {/* Quick actions */}
          <motion.div variants={item} className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Быстрые действия</h3>
              <button
                onClick={() => navigate('/client/booking')}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <CalendarPlus className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Записаться</p>
                  <p className="text-xs text-muted-foreground">Выбрать удобное время</p>
                </div>
              </button>
            </div>

            {/* Stats */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Моя статистика</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary">
                  <p className="stat-value text-xl">{totalVisits}</p>
                  <p className="text-xs text-muted-foreground">Процедур всего</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary">
                  <p className="stat-value text-xl">{thisMonthVisits}</p>
                  <p className="text-xs text-muted-foreground">В этом месяце</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Следующая рекомендация</p>
                  <p className="text-sm font-medium text-foreground">
                    {totalVisits > 0 ? 'Лимфодренаж через 7 дней' : 'Запишитесь на первую процедуру'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
