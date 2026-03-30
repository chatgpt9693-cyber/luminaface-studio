import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarPlus, Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Topbar from '@/components/layout/Topbar';
import FaceModel, { FaceZone } from '@/components/FaceModel';
import { useAuth } from '@/contexts/AuthContext';
import { mockAppointments } from '@/lib/data';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

// Zones treated in last visit
const lastTreatedZones: FaceZone[] = ['cheeks', 'lymph', 'jaw'];

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState<FaceZone | null>(null);

  const upcomingAppointment = mockAppointments.find(a => a.status === 'CONFIRMED');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

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
              {' '} в {upcomingAppointment.dateTime.split('T')[1].slice(0, 5)}
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
                  <p className="stat-value text-xl">12</p>
                  <p className="text-xs text-muted-foreground">Процедур всего</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary">
                  <p className="stat-value text-xl">3</p>
                  <p className="text-xs text-muted-foreground">В этом месяце</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Следующая рекомендация</p>
                  <p className="text-sm font-medium text-foreground">Лимфодренаж через 7 дней</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
