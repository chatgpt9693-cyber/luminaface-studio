import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
  appointmentId?: string;
}

export function usePublicSchedule(masterId?: string) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!masterId || !supabase) {
      setLoading(false);
      return;
    }

    loadSchedule();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('schedule_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `master_id=eq.${masterId}`,
        },
        () => {
          loadSchedule();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [masterId]);

  const loadSchedule = async () => {
    if (!masterId || !supabase) return;

    try {
      // Загружаем все записи мастера
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('id, date_time, duration, status')
        .eq('master_id', masterId)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });

      if (error) throw error;

      // Формируем список занятых слотов
      const bookedSlots = new Set(
        (appointments || [])
          .filter(apt => apt.status !== 'CANCELLED')
          .map(apt => apt.date_time)
      );

      // Генерируем все возможные слоты на ближайшие 30 дней
      const allSlots: TimeSlot[] = [];
      const today = new Date();
      
      for (let day = 0; day < 30; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() + day);
        
        // Рабочие часы: 9:00 - 20:00
        for (let hour = 9; hour <= 20; hour++) {
          const slotDate = new Date(date);
          slotDate.setHours(hour, 0, 0, 0);
          
          const dateTimeStr = slotDate.toISOString();
          const isBooked = bookedSlots.has(dateTimeStr);
          
          allSlots.push({
            date: slotDate.toISOString().split('T')[0],
            time: `${hour.toString().padStart(2, '0')}:00`,
            available: !isBooked,
            appointmentId: isBooked ? appointments?.find(a => a.date_time === dateTimeStr)?.id : undefined,
          });
        }
      }

      setSlots(allSlots);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    slots,
    loading,
    refresh: loadSchedule,
  };
}
