import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import FaceModel, { FaceZone } from '@/components/FaceModel';
import { useAppointments } from '@/hooks/useAppointments';
import { utcToMinsk, formatDateMinsk, formatTimeMinsk } from '@/lib/timezone';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function HistoryPage() {
  const { appointments, loading } = useAppointments();
  
  // Фильтруем только завершенные записи и сортируем по дате (новые первые)
  const completedVisits = appointments
    .filter(a => a.status === 'COMPLETED')
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const [expandedVisit, setExpandedVisit] = useState<string | null>(completedVisits[0]?.id || null);

  const activeVisit = completedVisits.find(v => v.id === expandedVisit);

  if (loading) {
    return (
      <div>
        <Topbar title="История процедур" />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="История процедур" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: visit list */}
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            <p className="text-sm text-muted-foreground">{completedVisits.length} процедур</p>
            {completedVisits.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-sm text-muted-foreground">У вас пока нет завершенных процедур</p>
              </div>
            ) : (
              completedVisits.map(visit => {
                const minskDate = utcToMinsk(visit.dateTime);
                const dateStr = formatDateMinsk(minskDate);
                const timeStr = formatTimeMinsk(minskDate);
                
                return (
                  <motion.div key={visit.id} variants={item}>
                    <button
                      onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                      className={`w-full text-left glass-card p-4 transition-all ${
                        expandedVisit === visit.id ? 'border-primary/30' : 'hover:border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{visit.serviceName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {' · '}{timeStr} · {visit.duration} мин
                          </p>
                          {visit.notes && (
                            <p className="text-xs text-muted-foreground/70 mt-1 italic">{visit.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">{visit.price.toLocaleString()} ₽</span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                            expandedVisit === visit.id ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })
            )}
          </motion.div>

          {/* Right: face model */}
          <div className="glass-card p-5 sticky top-6 self-start">
            <p className="text-sm font-medium text-muted-foreground mb-4">
              {activeVisit
                ? `Процедура: ${new Date(formatDateMinsk(utcToMinsk(activeVisit.dateTime))).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
                : 'Выберите процедуру'}
            </p>
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              История зон лица будет доступна в следующей версии
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
