import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/types/notifications';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    loadNotifications();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedNotifications: Notification[] = (data || []).map((notif: any) => ({
        id: notif.id,
        userId: notif.user_id,
        appointmentId: notif.appointment_id,
        type: notif.type,
        channel: notif.channel,
        status: notif.status,
        title: notif.title,
        message: notif.message,
        sentAt: notif.sent_at,
        errorMessage: notif.error_message,
        createdAt: notif.created_at,
      }));

      setNotifications(formattedNotifications);
      
      // Подсчет непрочитанных (отправленных за последние 24 часа)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const unread = formattedNotifications.filter(
        n => n.status === 'SENT' && new Date(n.createdAt) > oneDayAgo
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    refresh: loadNotifications,
  };
}
