import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Trash2, Check, X, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import Topbar from '@/components/layout/Topbar';
import AppointmentDialog from '@/components/AppointmentDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAppointments } from '@/hooks/useAppointments';
import { formatDateMinsk, formatTimeMinsk, utcToMinsk, getTodayMinsk } from '@/lib/timezone';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();
  const { appointments, loading, createAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));

  const getAppointmentForSlot = (slotIdx: number) => {
    const dayIdx = Math.floor(slotIdx / 24);
    const timeSlot = slotIdx % 24;
    const hour = Math.floor(timeSlot / 2) + 9;
    const minute = (timeSlot % 2) * 30;
    
    const targetDate = weekDays[dayIdx].dateStr;
    
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
    
    const date = weekDays[dayIdx].dateStr;
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

  // Get days for both mobile and desktop
  const weekDays = getWeekDays(currentWeekStart);

  // Mobile view: list of appointments grouped by date
  if (isMobile) {
    const sortedAppointments = [...appointments].sort((a, b) => 
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );

    const groupedByDate = sortedAppointments.reduce((acc, apt) => {
      const minskDate = utcToMinsk(apt.dateTime);
      const dateStr = formatDateMinsk(minskDate);
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(apt);
      return acc;
    }, {} as Record<string, Appointment[]>);

    return (
      <div className="min-h-screen bg-background">
        <Topbar title="Календарь" />
        <div className="pt-14 pb-4 px-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Записи</h2>
            <button 
              onClick={handleNewAppointment}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              + Новая
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : Object.keys(groupedByDate).length === 0 ? (
            <div className="glass-card p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Нет записей</p>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([dateStr, apts]) => (
              <div key={dateStr} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                  {new Date(dateStr).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                {apts.map(apt => {
                  const minskDate = utcToMinsk(apt.dateTime);
                  const time = formatTimeMinsk(minskDate);
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`glass-card p-4 ${
                        apt.status === 'CANCELLED' ? 'opacity-60' : ''
                      }`}
                      onClick={() => handleAppointmentClick(apt)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-primary">{time}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              apt.status === 'CONFIRMED' ? 'bg-primary/10 text-primary' :
                              apt.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                              apt.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' :
                              'bg-accent/10 text-accent'
                            }`}>
                              {apt.status === 'CONFIRMED' ? 'Подтверждён' :
                               apt.status === 'COMPLETED' ? 'Завершён' :
                               apt.status === 'CANCELLED' ? 'Отменён' :
                               'Ожидание'}
                            </span>
                          </div>
                          <p className="text-base font-medium text-foreground mb-1">{apt.clientName}</p>
                          <p className="text-sm text-muted-foreground">{apt.serviceName}</p>
                          <p className="text-xs text-muted-foreground mt-1">{apt.duration} мин • {apt.price} ₽</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                            <>
                              <button
                                onClick={(e) => handleCompleteAppointment(apt, e)}
                                className="w-8 h-8 rounded-lg bg-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500/30"
                                title="Завершить"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleCancelAppointment(apt, e)}
                                className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center hover:bg-orange-500/30"
                                title="Отменить"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => handleDeleteClick(apt, e)}
                            className="w-8 h-8 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive/30"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))
          )}
        </div>

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

  // Desktop view: calendar grid
  const days = weekDays;

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
