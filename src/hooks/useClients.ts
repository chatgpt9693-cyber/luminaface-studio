import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Client } from '@/lib/data';

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase || user.role !== 'MASTER') {
      setLoading(false);
      return;
    }

    loadClients();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('clients_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
          filter: `master_id=eq.${user.id}`,
        },
        () => {
          loadClients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadClients = async () => {
    if (!user || !supabase) return;

    try {
      console.log('Loading clients for master:', user.id, user.email);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('master_id', user.id)
        .order('full_name', { ascending: true });

      console.log('Clients query result:', { data, error, count: data?.length });

      if (error) throw error;

      const formattedClients: Client[] = (data || []).map((client: any) => ({
        id: client.id,
        fullName: client.full_name,
        phone: client.phone,
        email: client.email,
        avatarUrl: client.avatar_url,
        lastVisit: client.last_visit,
        totalVisits: client.total_visits,
        // Расширенные поля
        birthday: client.birthday,
        preferences: client.preferences || [],
        allergies: client.allergies,
        tags: client.tags || [],
        discount: client.discount || 0,
        notes: client.notes,
      } as any));

      console.log('Formatted clients:', formattedClients);
      setClients(formattedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: Omit<Client, 'id' | 'totalVisits'>) => {
    if (!user || !supabase) return;

    try {
      const insertData: any = {
        master_id: user.id,
        full_name: clientData.fullName,
        phone: clientData.phone,
        email: clientData.email,
        total_visits: 0,
      };

      // Добавляем расширенные поля если они есть
      const extended = clientData as any;
      if (extended.birthday && extended.birthday.trim()) insertData.birthday = extended.birthday;
      if (extended.preferences && extended.preferences.length > 0) insertData.preferences = extended.preferences;
      if (extended.allergies && extended.allergies.trim()) insertData.allergies = extended.allergies;
      if (extended.tags && extended.tags.length > 0) insertData.tags = extended.tags;
      if (extended.discount !== undefined && extended.discount > 0) insertData.discount = extended.discount;
      if (extended.notes && extended.notes.trim()) insertData.notes = extended.notes;

      const { data, error } = await supabase
        .from('clients')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      await loadClients();
      return data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  };

  const updateClient = async (id: string, clientData: Partial<Omit<Client, 'id'>>) => {
    if (!user || !supabase) return;

    try {
      const updateData: any = {};
      
      if (clientData.fullName !== undefined) updateData.full_name = clientData.fullName;
      if (clientData.phone !== undefined) updateData.phone = clientData.phone;
      if (clientData.email !== undefined) updateData.email = clientData.email;
      if (clientData.totalVisits !== undefined) updateData.total_visits = clientData.totalVisits;
      if (clientData.lastVisit !== undefined) updateData.last_visit = clientData.lastVisit;

      // Расширенные поля - проверяем на пустые значения
      const extended = clientData as any;
      if (extended.birthday !== undefined) {
        updateData.birthday = extended.birthday && extended.birthday.trim() ? extended.birthday : null;
      }
      if (extended.preferences !== undefined) {
        updateData.preferences = extended.preferences && extended.preferences.length > 0 ? extended.preferences : null;
      }
      if (extended.allergies !== undefined) {
        updateData.allergies = extended.allergies && extended.allergies.trim() ? extended.allergies : null;
      }
      if (extended.tags !== undefined) {
        updateData.tags = extended.tags && extended.tags.length > 0 ? extended.tags : null;
      }
      if (extended.discount !== undefined) {
        updateData.discount = extended.discount || 0;
      }
      if (extended.notes !== undefined) {
        updateData.notes = extended.notes && extended.notes.trim() ? extended.notes : null;
      }

      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .eq('master_id', user.id);

      if (error) throw error;
      await loadClients();
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    if (!user || !supabase) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('master_id', user.id);

      if (error) throw error;
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  };

  return {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
    refresh: loadClients,
  };
}
