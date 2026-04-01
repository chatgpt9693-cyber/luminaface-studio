import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Topbar from '@/components/layout/Topbar';
import { useAppointments } from '@/hooks/useAppointments';
import { exportIncomeToCSV } from '@/lib/export';
import { useIsMobile } from '@/hooks/use-mobile';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function IncomePage() {
  const isMobile = useIsMobile();
  const { appointments, loading } = useAppointments();

  // Считаем реальные доходы из завершенных записей
  const incomeStats = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'COMPLETED');
    
    // Общая статистика
    const totalIncome = completed.reduce((sum, a) => sum + (a.price || 0), 0);
    const completedCount = completed.length;
    const averageCheck = completedCount > 0 ? totalIncome / completedCount : 0;

    // Группировка по месяцам (последние 6 месяцев)
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const now = new Date();
    const monthlyData: { month: string; income: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthIncome = completed
        .filter(a => {
          const aptDate = new Date(a.dateTime);
          const aptKey = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}`;
          return aptKey === monthKey;
        })
        .reduce((sum, a) => sum + (a.price || 0), 0);
      
      monthlyData.push({
        month: monthNames[date.getMonth()],
        income: monthIncome,
      });
    }

    // Группировка по услугам
    const serviceIncome: Record<string, { name: string; value: number }> = {};
    completed.forEach(a => {
      if (!serviceIncome[a.serviceId]) {
        serviceIncome[a.serviceId] = { name: a.serviceName, value: 0 };
      }
      serviceIncome[a.serviceId].value += a.price || 0;
    });

    const serviceBreakdown = Object.values(serviceIncome).sort((a, b) => b.value - a.value);
    
    // Цвета для услуг
    const colors = [
      'hsl(340, 45%, 72%)',
      'hsl(340, 35%, 62%)',
      'hsl(330, 30%, 55%)',
      'hsl(280, 30%, 70%)',
      'hsl(350, 30%, 80%)',
      'hsl(300, 25%, 65%)',
    ];
    
    const serviceBreakdownWithColors = serviceBreakdown.map((s, i) => ({
      ...s,
      color: colors[i % colors.length],
    }));

    // Доход текущего месяца
    const currentMonthIncome = monthlyData[monthlyData.length - 1]?.income || 0;

    return {
      totalIncome,
      completedCount,
      averageCheck: Math.round(averageCheck),
      monthlyData,
      serviceBreakdown: serviceBreakdownWithColors,
      currentMonthIncome,
    };
  }, [appointments]);
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
            <p className="text-xs text-muted-foreground mb-1">Доход за текущий месяц</p>
            <p className="stat-value text-2xl sm:text-3xl">{incomeStats.currentMonthIncome.toLocaleString()} Br</p>
          </motion.div>
          <motion.div variants={item} className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Процедур проведено</p>
            <p className="stat-value text-2xl sm:text-3xl">{incomeStats.completedCount}</p>
          </motion.div>
          <motion.div variants={item} className="glass-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Средний чек</p>
            <p className="stat-value text-2xl sm:text-3xl">{incomeStats.averageCheck.toLocaleString()} Br</p>
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
              <BarChart data={incomeStats.monthlyData}>
                <XAxis dataKey="month" stroke="hsl(280,8%,40%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(280,8%,40%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
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
            {incomeStats.serviceBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                  <PieChart>
                    <Pie data={incomeStats.serviceBreakdown} cx="50%" cy="50%" innerRadius={isMobile ? 50 : 60} outerRadius={isMobile ? 80 : 90} dataKey="value" stroke="none">
                      {incomeStats.serviceBreakdown.map((entry, i) => (
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
                  {incomeStats.serviceBreakdown.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
                Нет данных о завершенных процедурах
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
