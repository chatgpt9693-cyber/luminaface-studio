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
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('master_id', user.id)
        .order('full_name', { ascending: true });

      if (error) throw error;

      const formattedClients: Client[] = (data || []).map((client: any) => ({
        id: client.id,
        fullName: client.full_name,
        phone: client.phone,
        email: client.email,
        avatarUrl: client.avatar_url,
        lastVisit: client.last_visit,
        totalVisits: client.total_visits,
      }));

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
      const { data, error } = await supabase
        .from('clients')
        .insert({
          master_id: user.id,
          full_name: clientData.fullName,
          phone: clientData.phone,
          email: clientData.email,
          total_visits: 0,
        })
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

  return {
    clients,
    loading,
    createClient,
    refresh: loadClients,
  };
}
