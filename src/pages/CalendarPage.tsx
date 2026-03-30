import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import Topbar from '@/components/layout/Topbar';
import AppointmentDialog from '@/components/AppointmentDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAppointments } from '@/hooks/useAppointments';
import { formatDateMinsk, formatTimeMinsk, utcToMinsk, getTodayMinsk } from '@/lib/timezone';
import type { Appointment } from '@/lib/data';

const hours = Array.from({ length: 24 }, (_, i) => i + 9); // 9:00 - 20:30 (12 часов * 2 слота)

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
  const { appointments, loading, createAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));
  
  const days = getWeekDays(currentWeekStart);

  const getAppointmentForSlot = (slotIdx: number) => {
    const dayIdx = Math.floor(slotIdx / 24);
    const timeSlot = slotIdx % 24;
    const hour = Math.floor(timeSlot / 2) + 9;
    const minute = (timeSlot % 2) * 30;
    
    const targetDate = days[dayIdx].dateStr;
    
    const found = appointments.find(a => {
      // Конвертируем UTC время из БД в локальное время Минска
      const minskDate = utcToMinsk(a.dateTime);
      const aptDate = formatDateMinsk(minskDate);
      const aptHour = minskDate.getUTCHours();
      const aptMinute = minskDate.getUTCMinutes();
      
      const match = aptDate === targetDate && aptHour === hour && aptMinute === minute;
      
      if (match) {
        console.log('Found appointment for slot:', {
          slotIdx,
          targetDate,
          targetTime: `${hour}:${minute}`,
          appointmentRaw: a.dateTime,
          appointmentConverted: minskDate.toISOString(),
          appointmentDisplay: `${aptDate} ${aptHour}:${aptMinute}`
        });
      }
      
      return match;
    });
    
    return found;
  };

  const handleSlotClick = (slotIdx: number) => {
    const dayIdx = Math.floor(slotIdx / 24);
    const timeSlot = slotIdx % 24;
    const hour = Math.floor(timeSlot / 2) + 9;
    const minute = (timeSlot % 2) * 30;
    
    const date = days[dayIdx].dateStr;
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    console.log('CalendarPage slot clicked:', { date, time, slotIdx, dayIdx, timeSlot, hour, minute });
    
    setSelectedSlot({ date, time });
    setSelectedAppointment(null);
    setDialogOpen(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedSlot(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingAppointment(appointment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingAppointment) {
      try {
        await deleteAppointment(deletingAppointment.id);
        toast.success('Запись удалена');
        setDeletingAppointment(null);
      } catch (error) {
        toast.error('Ошибка при удалении записи');
      }
    }
  };

  const handleCompleteAppointment = async (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateAppointment(appointment.id, { ...appointment, status: 'COMPLETED' });
      toast.success('Запись завершена');
    } catch (error) {
      toast.error('Ошибка при обновлении записи');
    }
  };

  const handleCancelAppointment = async (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateAppointment(appointment.id, { ...appointment, status: 'CANCELLED' });
      toast.success('Запись отменена');
    } catch (error) {
      toast.error('Ошибка при обновлении записи');
    }
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
              const isToday = d.dateStr === getTodayMinsk();
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

            {hours.map((_, hourIdx) => {
              const hour = Math.floor(hourIdx / 2) + 9;
              const minute = (hourIdx % 2) * 30;
              const isFullHour = minute === 0;
              
              return (
                <div key={`row-${hourIdx}`} className="contents">
                  <div className="p-3 text-xs text-muted-foreground text-right pr-4 border-r border-border">
                    {isFullHour ? `${hour}:00` : ''}
                  </div>
                  {days.map((_, dayIdx) => {
                    const slotIdx = dayIdx * 24 + hourIdx;
                    const appointment = getAppointmentForSlot(slotIdx);
                    return (
                      <div
                        key={`${dayIdx}-${hourIdx}`}
                        onClick={() => !appointment && handleSlotClick(slotIdx)}
                        className="p-1 min-h-[32px] border-b border-r border-border/50 hover:bg-primary/5 transition-colors cursor-pointer"
                      >
                        {appointment && (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={() => handleAppointmentClick(appointment)}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer relative group ${
                              appointment.status === 'COMPLETED' ? 'bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-300' :
                              appointment.status === 'CANCELLED' ? 'bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300 opacity-60' :
                              serviceColors[appointment.serviceId] || 'bg-primary/20 border-primary/30 text-primary'
                            }`}
                          >
                            <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                                <>
                                  <button
                                    onClick={(e) => handleCompleteAppointment(appointment, e)}
                                    className="w-4 h-4 rounded bg-green-500/80 text-white flex items-center justify-center hover:bg-green-600"
                                    title="Завершить"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleCancelAppointment(appointment, e)}
                                    className="w-4 h-4 rounded bg-orange-500/80 text-white flex items-center justify-center hover:bg-orange-600"
                                    title="Отменить"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={(e) => handleDeleteClick(appointment, e)}
                                className="w-4 h-4 rounded bg-destructive/80 text-destructive-foreground flex items-center justify-center hover:bg-destructive"
                                title="Удалить"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <p className="font-medium truncate pr-12">{appointment.clientName}</p>
                            <p className="opacity-70 text-[10px]">
                              {appointment.duration} мин
                              {appointment.status === 'COMPLETED' && ' • Завершено'}
                              {appointment.status === 'CANCELLED' && ' • Отменено'}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment}
        defaultDate={selectedSlot?.date}
        defaultTime={selectedSlot?.time}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить запись для {deletingAppointment?.clientName}? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
