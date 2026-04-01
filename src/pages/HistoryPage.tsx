import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import FaceModel, { FaceZone } from '@/components/FaceModel';
import { useAppointments } from '@/hooks/useAppointments';
import { utcToMinsk, formatDateMinsk, formatTimeMinsk } from '@/lib/timezone';
import { useIsMobile } from '@/hooks/use-mobile';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function HistoryPage() {
  const isMobile = useIsMobile();
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
    <div className={isMobile ? 'min-h-screen bg-background' : ''}>
      <Topbar title="История процедур" />
      <div className={isMobile ? 'pt-14 pb-4 px-4' : 'p-6'}>
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ваши процедуры
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-3 py-1.5 rounded-full bg-primary/15 border border-primary/25 text-xs sm:text-sm text-primary font-medium">
              ✨ {completedVisits.length} завершено
            </div>
            {completedVisits.length > 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Последняя: {new Date(completedVisits[0].dateTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
        </div>

        <div className={isMobile ? 'space-y-3' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
          {/* Visit list */}
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {completedVisits.length === 0 ? (
              <div className="glass-card p-8 sm:p-12 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl">📋</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Пока нет истории</h3>
                <p className="text-sm text-muted-foreground">Ваши завершенные процедуры появятся здесь</p>
              </div>
            ) : (
              completedVisits.map(visit => {
                const minskDate = utcToMinsk(visit.dateTime);
                const dateStr = formatDateMinsk(minskDate);
                const timeStr = formatTimeMinsk(minskDate);
                const isExpanded = expandedVisit === visit.id;
                
                return (
                  <motion.div key={visit.id} variants={item}>
                    <button
                      onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                      className={`w-full text-left rounded-xl sm:rounded-2xl border p-4 sm:p-5 transition-all ${
                        isExpanded 
                          ? 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/40 shadow-lg shadow-primary/10' 
                          : 'glass-card hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base sm:text-lg">✨</span>
                            <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">{visit.serviceName}</h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="px-2 py-1 rounded-lg bg-secondary/60 text-xs text-muted-foreground whitespace-nowrap">
                              📅 {new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="px-2 py-1 rounded-lg bg-secondary/60 text-xs text-muted-foreground whitespace-nowrap">
                              🕐 {timeStr}
                            </span>
                          </div>
                          {visit.notes && (
                            <p className="text-xs text-muted-foreground/80 italic mt-2 line-clamp-2">{visit.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-sm sm:text-base font-bold text-primary whitespace-nowrap">{visit.price.toLocaleString()} ₽</span>
                          <span className="text-xs text-muted-foreground">{visit.duration} мин</span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </div>

                      {/* Mobile: expanded details inline */}
                      {isMobile && isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-primary/20 space-y-3"
                        >
                          <div className="p-3 rounded-xl bg-secondary/50">
                            <p className="text-xs text-muted-foreground mb-1">Процедура</p>
                            <p className="text-sm font-semibold text-foreground">{visit.serviceName}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-secondary/50">
                              <p className="text-xs text-muted-foreground mb-1">Длительность</p>
                              <p className="text-sm font-semibold text-foreground">{visit.duration} мин</p>
                            </div>
                            <div className="p-3 rounded-xl bg-secondary/50">
                              <p className="text-xs text-muted-foreground mb-1">Стоимость</p>
                              <p className="text-sm font-semibold text-primary">{visit.price.toLocaleString()} ₽</p>
                            </div>
                          </div>
                          {visit.notes && (
                            <div className="p-3 rounded-xl bg-secondary/50">
                              <p className="text-xs text-muted-foreground mb-1">Заметки</p>
                              <p className="text-sm text-foreground">{visit.notes}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </button>
                  </motion.div>
                );
              })
            )}
          </motion.div>

          {/* Desktop: details card */}
          {!isMobile && (
            <div className="glass-card p-6 sticky top-6 self-start">
              {activeVisit ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-xl">💆‍♀️</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Детали процедуры</p>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(formatDateMinsk(utcToMinsk(activeVisit.dateTime))).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="p-3 rounded-xl bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">Процедура</p>
                      <p className="text-sm font-semibold text-foreground">{activeVisit.serviceName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">Длительность</p>
                        <p className="text-sm font-semibold text-foreground">{activeVisit.duration} мин</p>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">Стоимость</p>
                        <p className="text-sm font-semibold text-primary">{activeVisit.price.toLocaleString()} ₽</p>
                      </div>
                    </div>
                    {activeVisit.notes && (
                      <div className="p-3 rounded-xl bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">Заметки</p>
                        <p className="text-sm text-foreground">{activeVisit.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
                    <p className="text-xs text-center text-muted-foreground">
                      💡 Визуализация обработанных зон будет доступна в следующей версии
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">👈</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Выберите процедуру для просмотра деталей</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
