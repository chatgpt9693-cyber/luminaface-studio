import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Topbar from '@/components/layout/Topbar';
import AppointmentDialog from '@/components/AppointmentDialog';
import { useAppointments } from '@/hooks/useAppointments';
import type { Appointment } from '@/lib/data';

const hours = Array.from({ length: 12 }, (_, i) => i + 9);

function getWeekDays(startDate: Date) {
  const days = [];
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    days.push({
      label: `${dayNames[date.getDay()]} ${date.getDate()}`,
      date: date,
      dateStr: date.toISOString().split('T')[0],
    });
  }
  return days;
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDateRange(startDate: Date) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDate.getDate()} – ${endDate.getDate()} ${months[startDate.getMonth()]} ${startDate.getFullYear()}`;
  } else {
    return `${startDate.getDate()} ${months[startDate.getMonth()]} – ${endDate.getDate()} ${months[endDate.getMonth()]} ${startDate.getFullYear()}`;
  }
}

const serviceColors: Record<string, string> = {
  '1': 'bg-primary/20 border-primary/30 text-primary',
  '2': 'bg-primary/20 border-primary/30 text-primary',
  '3': 'bg-primary/20 border-primary/30 text-primary',
  '4': 'bg-accent/20 border-accent/30 text-accent',
  '5': 'bg-lavender/20 border-lavender/30 text-lavender',
  '6': 'bg-blush/20 border-blush/30 text-blush',
};

export default function CalendarPage() {
  const { appointments, loading, createAppointment, updateAppointment } = useAppointments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));
  
  const days = getWeekDays(currentWeekStart);

  const getAppointmentForSlot = (dayIdx: number, hour: number) => {
    const targetDate = days[dayIdx].dateStr;
    const targetTime = `${hour.toString().padStart(2, '0')}:00:00`;
    
    return appointments.find(a => {
      const aptDate = a.dateTime.split('T')[0];
      const aptTime = a.dateTime.split('T')[1];
      return aptDate === targetDate && aptTime.startsWith(targetTime.slice(0, 5));
    });
  };

  const handleSlotClick = (dayIdx: number, hour: number) => {
    const date = days[dayIdx].dateStr;
    const time = `${hour.toString().padStart(2, '0')}:00`;
    setSelectedSlot({ date, time });
    setDialogOpen(true);
  };

  const handleSave = async (appointmentData: Omit<Appointment, 'id'> & { id?: string }) => {
    try {
      if (appointmentData.id) {
        await updateAppointment(appointmentData.id, appointmentData);
        toast.success('Запись обновлена');
      } else {
        await createAppointment(appointmentData);
        toast.success('Запись создана');
      }
      setSelectedSlot(null);
    } catch (error) {
      toast.error('Ошибка при сохранении записи');
    }
  };

  const handleNewAppointment = () => {
    setSelectedSlot(null);
    setDialogOpen(true);
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  return (
    <div>
      <Topbar title="Календарь" />
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={goToPreviousWeek}
              className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-semibold">{formatDateRange(currentWeekStart)}</h2>
            <button 
              onClick={goToNextWeek}
              className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="ml-2 px-3 py-1.5 rounded-lg bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Сегодня
            </button>
          </div>
          <button 
            onClick={handleNewAppointment}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + Новая запись
          </button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
          <div className="grid grid-cols-8">
            <div className="p-3 border-b border-border" />
            {days.map((d, i) => {
              const isToday = d.dateStr === new Date().toISOString().split('T')[0];
              return (
                <div 
                  key={i} 
                  className={`p-3 text-center text-sm border-b border-border ${
                    isToday ? 'text-primary font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {d.label}
                </div>
              );
            })}

            {hours.map(hour => (
              <div key={`row-${hour}`} className="contents">
                <div className="p-3 text-xs text-muted-foreground text-right pr-4 border-r border-border">
                  {hour}:00
                </div>
                {days.map((_, dayIdx) => {
                  const appointment = getAppointmentForSlot(dayIdx, hour);
                  return (
                    <div
                      key={`${dayIdx}-${hour}`}
                      onClick={() => !appointment && handleSlotClick(dayIdx, hour)}
                      className="p-1 min-h-[48px] border-b border-r border-border/50 hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      {appointment && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`p-1.5 rounded-lg border text-xs ${serviceColors[appointment.serviceId] || 'bg-primary/20 border-primary/30 text-primary'}`}
                        >
                          <p className="font-medium truncate">{appointment.clientName}</p>
                          <p className="opacity-70">{appointment.duration} мин</p>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={selectedSlot?.date}
        defaultTime={selectedSlot?.time}
        onSave={handleSave}
      />
    </div>
  );
}
