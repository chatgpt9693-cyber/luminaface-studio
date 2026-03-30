import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { utcToMinsk, formatDateMinsk, formatTimeMinsk } from '@/lib/timezone';
import type { Appointment } from '@/lib/data';

export function useAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    loadAppointments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('appointments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          // Мастер подписывается только на свои записи
          ...(user.role === 'MASTER' ? { filter: `master_id=eq.${user.id}` } : {}),
        },
        () => {
          loadAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadAppointments = async () => {
    if (!user || !supabase) return;

    try {
      console.log('Loading appointments for user:', user.email, 'role:', user.role);
      
      // Загружаем записи БЕЗ join'ов
      let query = supabase
        .from('appointments')
        .select('*')
        .order('date_time', { ascending: true });

      // Мастер видит все свои записи
      if (user.role === 'MASTER') {
        query = query.eq('master_id', user.id);
      }

      const { data: appointmentsData, error: appointmentsError } = await query;

      if (appointmentsError) throw appointmentsError;

      console.log('Appointments loaded:', appointmentsData?.length || 0);

      // Загружаем клиентов отдельно
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, full_name');

      // Загружаем услуги отдельно
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name');

      // Создаем мапы для быстрого поиска
      const clientsMap = new Map(clientsData?.map(c => [c.id, c.full_name]) || []);
      const servicesMap = new Map(servicesData?.map(s => [s.id, s.name]) || []);

      const formattedAppointments: Appointment[] = (appointmentsData || []).map((apt: any) => {
        const minskDate = utcToMinsk(apt.date_time);
        console.log('Loading appointment:', {
          raw: apt.date_time,
          converted: minskDate.toISOString(),
          display: `${formatDateMinsk(minskDate)} ${formatTimeMinsk(minskDate)}`
        });
        
        return {
          id: apt.id,
          clientId: apt.client_id,
          clientName: clientsMap.get(apt.client_id) || 'Неизвестный клиент',
          serviceId: apt.service_id || '',
          serviceName: servicesMap.get(apt.service_id) || 'Услуга не указана',
          dateTime: apt.date_time,
          status: apt.status,
          notes: apt.notes,
          price: apt.price,
          duration: apt.duration,
        };
      });

      console.log('Formatted appointments:', formattedAppointments);
      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData: Omit<Appointment, 'id'>) => {
    if (!user || !supabase) return;

    try {
      // Для клиента нужно найти master_id через таблицу clients
      let masterId = user.id;
      
      if (user.role === 'CLIENT') {
        const { data: clientData } = await supabase
          .from('clients')
          .select('master_id')
          .eq('email', user.email)
          .single();
        
        if (!clientData) throw new Error('Клиент не найден');
        masterId = clientData.master_id;
      }

      const insertData = {
        master_id: masterId,
        client_id: appointmentData.clientId,
        service_id: appointmentData.serviceId || null,
        date_time: appointmentData.dateTime,
        status: appointmentData.status,
        duration: appointmentData.duration,
        price: appointmentData.price,
        notes: appointmentData.notes,
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      await loadAppointments();
      return data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  };

  const updateAppointment = async (id: string, appointmentData: Partial<Appointment>) => {
    if (!supabase || !user) return;

    try {
      // Создаем объект обновления только с теми полями, которые переданы
      const updateData: any = {};
      
      if (appointmentData.clientId !== undefined) updateData.client_id = appointmentData.clientId;
      if (appointmentData.serviceId !== undefined) updateData.service_id = appointmentData.serviceId || null;
      if (appointmentData.dateTime !== undefined) updateData.date_time = appointmentData.dateTime;
      if (appointmentData.status !== undefined) updateData.status = appointmentData.status;
      if (appointmentData.duration !== undefined) updateData.duration = appointmentData.duration;
      if (appointmentData.price !== undefined) updateData.price = appointmentData.price;
      if (appointmentData.notes !== undefined) updateData.notes = appointmentData.notes;

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .eq('master_id', user.id); // Явно указываем что обновляем только свои записи

      if (error) throw error;
      await loadAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!supabase || !user) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('master_id', user.id); // Явно указываем что удаляем только свои записи

      if (error) throw error;
      await loadAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  };

  return {
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refresh: loadAppointments,
  };
}
