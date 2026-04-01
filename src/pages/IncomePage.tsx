import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Topbar from '@/components/layout/Topbar';
import { monthlyIncome } from '@/lib/data';
import { useAppointments } from '@/hooks/useAppointments';
import { exportIncomeToCSV } from '@/lib/export';
import { useIsMobile } from '@/hooks/use-mobile';

const serviceBreakdown = [
  { name: 'Лимфодренаж 30м', value: 42000, color: 'hsl(340, 45%, 72%)' },
  { name: 'Лимфодренаж 45м', value: 54000, color: 'hsl(340, 35%, 62%)' },
  { name: 'Лимфодренаж 60м', value: 66000, color: 'hsl(330, 30%, 55%)' },
  { name: 'Скульптурный', value: 48000, color: 'hsl(280, 30%, 70%)' },
  { name: 'Буки-массаж', value: 19200, color: 'hsl(350, 30%, 80%)' },
  { name: 'Комбо', value: 17000, color: 'hsl(300, 25%, 65%)' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function IncomePage() {
  const isMobile = useIsMobile();
  const { appointments, loading } = useAppointments();

  const totalMonth = monthlyIncome[monthlyIncome.length - 1].income;
  const completedCount = appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length;
  const handleExport = () => {
    try {
      exportIncomeToCSV();
      toast.success('Данные экспортированы');
    } catch (error) {
      toast.error('Ошибка экспорта');
    }
  };

  if (loading) {
    return (
      <div>
        <Topbar title="Доходы" />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? 'min-h-screen bg-background' : ''}>
      <Topbar title="Доходы" />
      <motion.div variants={container} initial="hidden" animate="show" className={isMobile ? 'pt-14 pb-4 px-4 space-y-4' : 'p-6 space-y-6'}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div variants={item} className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Доход за март</p>
            <p className="stat-value text-2xl sm:text-3xl">{totalMonth.toLocaleString()} Br</p>
          </motion.div>
          <motion.div variants={item} className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Процедур проведено</p>
            <p className="stat-value text-2xl sm:text-3xl">{completedCount}</p>
          </motion.div>
          <motion.div variants={item} className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Средний чек</p>
            <p className="stat-value text-2xl sm:text-3xl">{Math.round(totalMonth / (completedCount || 1)).toLocaleString()} Br</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <motion.div variants={item} className="glass-card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">По месяцам</h3>
              <button 
                onClick={handleExport}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Download className="w-3.5 h-3.5" /> Экспорт
              </button>
            </div>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
              <BarChart data={monthlyIncome}>
                <XAxis dataKey="month" stroke="hsl(280,8%,40%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(280,8%,40%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v / 1000}K`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(280,8%,7%)', border: '1px solid hsl(280,10%,16%)', borderRadius: 12, color: 'hsl(330,20%,92%)' }}
                  formatter={(v: number) => [`${v.toLocaleString()} Br`, 'Доход']}
                />
                <Bar dataKey="income" fill="hsl(340, 45%, 72%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div variants={item} className="glass-card p-4 sm:p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">По услугам</h3>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
              <PieChart>
                <Pie data={serviceBreakdown} cx="50%" cy="50%" innerRadius={isMobile ? 50 : 60} outerRadius={isMobile ? 80 : 90} dataKey="value" stroke="none">
                  {serviceBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(280,8%,7%)', border: '1px solid hsl(280,10%,16%)', borderRadius: 12, color: 'hsl(330,20%,92%)' }}
                  formatter={(v: number) => [`${v.toLocaleString()} Br`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {serviceBreakdown.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
