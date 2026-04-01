import { motion } from 'framer-motion';
import { CalendarCheck, TrendingUp, Users, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Topbar from '@/components/layout/Topbar';
import { useAppointments } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { monthlyIncome } from '@/lib/data';
import { utcToMinsk, formatTimeMinsk, formatDateMinsk } from '@/lib/timezone';
import { useIsMobile } from '@/hooks/use-mobile';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function MasterDashboard() {
  const isMobile = useIsMobile();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { clients, loading: clientsLoading } = useClients();

  // Получаем сегодняшнюю дату в Минске
  const today = new Date();
  const minskToday = utcToMinsk(today);
  const todayStr = formatDateMinsk(minskToday);

  // Фильтруем записи на сегодня
  const todayAppointments = appointments.filter(a => {
    const minskDate = utcToMinsk(a.dateTime);
    const dateStr = formatDateMinsk(minskDate);
    return dateStr === todayStr;
  });

  const nextAppointment = todayAppointments.find(a => a.status === 'CONFIRMED' || a.status === 'PENDING');
  const monthRevenue = monthlyIncome[monthlyIncome.length - 1].income;

  const stats = [
    { icon: CalendarCheck, label: 'Сегодня записей', value: todayAppointments.length, color: 'text-primary' },
    { icon: TrendingUp, label: 'Выручка за март', value: `${(monthRevenue / 1000).toFixed(0)}K ₽`, color: 'text-accent' },
    { icon: Users, label: 'Всего клиентов', value: clients.length, color: 'text-blush' },
    { icon: Clock, label: 'Следующая запись', value: nextAppointment ? formatTimeMinsk(utcToMinsk(nextAppointment.dateTime)) : '—', color: 'text-lavender' },
  ];

  const loading = appointmentsLoading || clientsLoading;

  if (loading) {
    return (
      <div>
        <Topbar title="Дашборд" />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? 'min-h-screen bg-background' : ''}>
      <Topbar title="Дашборд" />
      <motion.div variants={container} initial="hidden" animate="show" className={isMobile ? 'pt-14 pb-4 px-4 space-y-4' : 'p-6 space-y-6'}>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s, i) => (
            <motion.div key={i} variants={item} className="glass-card-hover p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground leading-tight">{s.label}</span>
              </div>
              <p className="stat-value text-xl sm:text-3xl">{s.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Income chart */}
          <motion.div variants={item} className="glass-card p-4 sm:p-5 lg:col-span-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Динамика дохода</h3>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
              <AreaChart data={monthlyIncome}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(340, 45%, 72%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(280, 30%, 70%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="hsl(280,8%,40%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(280,8%,40%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v / 1000}K`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(280,8%,7%)', border: '1px solid hsl(280,10%,16%)', borderRadius: 12, color: 'hsl(330,20%,92%)' }}
                  formatter={(v: number) => [`${v.toLocaleString()} ₽`, 'Доход']}
                />
                <Area type="monotone" dataKey="income" stroke="hsl(340, 45%, 72%)" strokeWidth={2} fill="url(#incomeGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Today's schedule */}
          <motion.div variants={item} className="glass-card p-4 sm:p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Расписание на сегодня</h3>
            <div className="space-y-3">
              {todayAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Нет записей на сегодня</p>
              ) : (
                todayAppointments.map(a => {
                  const minskDate = utcToMinsk(a.dateTime);
                  const time = formatTimeMinsk(minskDate);
                  return (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <div className="glow-dot flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{a.clientName}</p>
                        <p className="text-xs text-muted-foreground">{time} • {a.duration} мин</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${
                        a.status === 'CONFIRMED' ? 'bg-primary/10 text-primary' : 
                        a.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                        a.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' :
                        'bg-accent/10 text-accent'
                      }`}>
                        {a.status === 'CONFIRMED' ? 'Подтверждён' : 
                         a.status === 'COMPLETED' ? 'Завершён' :
                         a.status === 'CANCELLED' ? 'Отменён' :
                         'Ожидание'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
