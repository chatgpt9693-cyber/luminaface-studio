import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import FaceModel, { FaceZone } from '@/components/FaceModel';

interface Visit {
  id: string;
  date: string;
  service: string;
  duration: number;
  price: number;
  zones: FaceZone[];
  notes?: string;
}

const visits: Visit[] = [
  { id: 'v1', date: '2026-03-28', service: 'Лимфодренаж + скульптура комбо 90 мин', duration: 90, price: 8500, zones: ['cheeks', 'lymph', 'jaw', 'eyes'] },
  { id: 'v2', date: '2026-03-14', service: 'Скульптурный массаж лица 60 мин', duration: 60, price: 6000, zones: ['cheeks', 'jaw', 'forehead'], notes: 'Акцент на скуловых мышцах' },
  { id: 'v3', date: '2026-02-28', service: 'Буки-массаж лица 45 мин', duration: 45, price: 4800, zones: ['cheeks', 'lips'], notes: 'Буккальная техника' },
  { id: 'v4', date: '2026-02-14', service: 'Лимфодренажный массаж лица 60 мин', duration: 60, price: 5500, zones: ['lymph', 'eyes', 'forehead'] },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function HistoryPage() {
  const [expandedVisit, setExpandedVisit] = useState<string | null>(visits[0]?.id || null);

  const activeVisit = visits.find(v => v.id === expandedVisit);

  return (
    <div>
      <Topbar title="История процедур" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: visit list */}
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            <p className="text-sm text-muted-foreground">{visits.length} процедур</p>
            {visits.map(visit => (
              <motion.div key={visit.id} variants={item}>
                <button
                  onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                  className={`w-full text-left glass-card p-4 transition-all ${
                    expandedVisit === visit.id ? 'border-primary/30' : 'hover:border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{visit.service}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(visit.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}{visit.duration} мин
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

                  {/* Zone pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {visit.zones.map(z => (
                      <span key={z} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {z === 'forehead' ? 'Лоб' : z === 'eyes' ? 'Глаза' : z === 'cheeks' ? 'Скулы' : z === 'jaw' ? 'Челюсть' : z === 'lymph' ? 'Лимфодренаж' : 'Губы'}
                      </span>
                    ))}
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: face model */}
          <div className="glass-card p-5 sticky top-6 self-start">
            <p className="text-sm font-medium text-muted-foreground mb-4">
              {activeVisit
                ? `Зоны: ${new Date(activeVisit.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
                : 'Выберите процедуру'}
            </p>
            {activeVisit ? (
              <FaceModel
                mode="history"
                activeZones={activeVisit.zones}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Нажмите на запись для просмотра зон
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
