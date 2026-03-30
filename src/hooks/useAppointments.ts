import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients(full_name),
          service:services(name)
        `)
        .order('date_time', { ascending: true });

      // Мастер видит все свои записи
      if (user.role === 'MASTER') {
        query = query.eq('master_id', user.id);
      }
      // Клиент видит все записи (для выбора свободного времени)
      // но фильтруем на фронте, чтобы показывать только нужные

      const { data, error } = await query;

      if (error) throw error;

      const formattedAppointments: Appointment[] = (data || []).map((apt: any) => ({
        id: apt.id,
        clientId: apt.client_id,
        clientName: apt.client?.full_name || 'Неизвестный клиент',
        serviceId: apt.service_id || '',
        serviceName: apt.service?.name || 'Услуга не указана',
        dateTime: apt.date_time,
        status: apt.status,
        notes: apt.notes,
        price: apt.price,
        duration: apt.duration,
      }));

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
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          master_id: user.id,
          client_id: appointmentData.clientId,
          service_id: appointmentData.serviceId || null,
          date_time: appointmentData.dateTime,
          status: appointmentData.status,
          duration: appointmentData.duration,
          price: appointmentData.price,
          notes: appointmentData.notes,
        })
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
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          client_id: appointmentData.clientId,
          service_id: appointmentData.serviceId || null,
          date_time: appointmentData.dateTime,
          status: appointmentData.status,
          duration: appointmentData.duration,
          price: appointmentData.price,
          notes: appointmentData.notes,
        })
        .eq('id', id);

      if (error) throw error;
      await loadAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

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
