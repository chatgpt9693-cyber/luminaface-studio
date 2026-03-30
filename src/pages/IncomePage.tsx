import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Topbar from '@/components/layout/Topbar';
import { monthlyIncome, mockAppointments } from '@/lib/data';
import { exportIncomeToCSV } from '@/lib/export';

const serviceBreakdown = [
  { name: 'Лимфодренаж 30м', value: 42000, color: 'hsl(340, 45%, 72%)' },
  { name: 'Лимфодренаж 45м', value: 54000, color: 'hsl(340, 35%, 62%)' },
  { name: 'Лимфодренаж 60м', value: 66000, color: 'hsl(330, 30%, 55%)' },
  { name: 'Скульптурный', value: 48000, color: 'hsl(280, 30%, 70%)' },
  { name: 'Буки-массаж', value: 19200, color: 'hsl(350, 30%, 80%)' },
  { name: 'Комбо', value: 17000, color: 'hsl(300, 25%, 65%)' },
];

const totalMonth = monthlyIncome[monthlyIncome.length - 1].income;
const completedCount = mockAppointments.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length;

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function IncomePage() {
  const handleExport = () => {
    try {
      exportIncomeToCSV();
      toast.success('Данные экспортированы');
    } catch (error) {
      toast.error('Ошибка экспорта');
    }
  };

  return (
    <div>
      <Topbar title="Доходы" />
      <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div variants={item} className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Доход за март</p>
            <p className="stat-value">{totalMonth.toLocaleString()} ₽</p>
          </motion.div>
          <motion.div variants={item} className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Процедур проведено</p>
            <p className="stat-value">{completedCount}</p>
          </motion.div>
          <motion.div variants={item} className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Средний чек</p>
            <p className="stat-value">{Math.round(totalMonth / (completedCount || 1)).toLocaleString()} ₽</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={item} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">По месяцам</h3>
              <button 
                onClick={handleExport}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Download className="w-3.5 h-3.5" /> Экспорт
              </button>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyIncome}>
                <XAxis dataKey="month" stroke="hsl(280,8%,40%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(280,8%,40%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v / 1000}K`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(280,8%,7%)', border: '1px solid hsl(280,10%,16%)', borderRadius: 12, color: 'hsl(330,20%,92%)' }}
                  formatter={(v: number) => [`${v.toLocaleString()} ₽`, 'Доход']}
                />
                <Bar dataKey="income" fill="hsl(340, 45%, 72%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div variants={item} className="glass-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">По услугам</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={serviceBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                  {serviceBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(280,8%,7%)', border: '1px solid hsl(280,10%,16%)', borderRadius: 12, color: 'hsl(330,20%,92%)' }}
                  formatter={(v: number) => [`${v.toLocaleString()} ₽`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {serviceBreakdown.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
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
