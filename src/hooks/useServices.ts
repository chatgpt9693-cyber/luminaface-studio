import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Service } from '@/lib/data';

export function useServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    loadServices();
  }, [user]);

  const loadServices = async () => {
    if (!user || !supabase) return;

    try {
      let query = supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      // Мастер видит только свои услуги
      if (user.role === 'MASTER') {
        query = query.eq('master_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedServices: Service[] = (data || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price,
        description: service.description,
      }));

      setServices(formattedServices);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: Omit<Service, 'id'>) => {
    if (!user || !supabase || user.role !== 'MASTER') return;

    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          master_id: user.id,
          name: serviceData.name,
          duration: serviceData.duration,
          price: serviceData.price,
          description: serviceData.description,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      await loadServices();
      return data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  };

  return {
    services,
    loading,
    createService,
    refresh: loadServices,
  };
}
