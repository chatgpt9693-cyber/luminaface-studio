import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { NotificationSettings } from '@/types/notifications';

export function useNotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Если настроек нет, создаем их
        if (error.code === 'PGRST116') {
          await createDefaultSettings();
          return;
        }
        throw error;
      }

      setSettings({
        id: data.id,
        userId: data.user_id,
        telegramEnabled: data.telegram_enabled,
        telegramChatId: data.telegram_chat_id,
        emailEnabled: data.email_enabled,
        smsEnabled: data.sms_enabled,
        reminder24h: data.reminder_24h,
        reminder2h: data.reminder_2h,
        newBookingNotify: data.new_booking_notify,
        cancellationNotify: data.cancellation_notify,
        connectionCode: data.connection_code,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .insert({
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSettings({
        id: data.id,
        userId: data.user_id,
        telegramEnabled: data.telegram_enabled,
        telegramChatId: data.telegram_chat_id,
        emailEnabled: data.email_enabled,
        smsEnabled: data.sms_enabled,
        reminder24h: data.reminder_24h,
        reminder2h: data.reminder_2h,
        newBookingNotify: data.new_booking_notify,
        cancellationNotify: data.cancellation_notify,
        connectionCode: data.connection_code,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
    } catch (error) {
      console.error('Error creating notification settings:', error);
    }
  };

  const updateSettings = async (updates: Partial<Omit<NotificationSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    if (!user || !supabase || !settings) return;

    try {
      const updateData: any = {};
      
      if (updates.telegramEnabled !== undefined) updateData.telegram_enabled = updates.telegramEnabled;
      if (updates.telegramChatId !== undefined) updateData.telegram_chat_id = updates.telegramChatId;
      if (updates.emailEnabled !== undefined) updateData.email_enabled = updates.emailEnabled;
      if (updates.smsEnabled !== undefined) updateData.sms_enabled = updates.smsEnabled;
      if (updates.reminder24h !== undefined) updateData.reminder_24h = updates.reminder24h;
      if (updates.reminder2h !== undefined) updateData.reminder_2h = updates.reminder2h;
      if (updates.newBookingNotify !== undefined) updateData.new_booking_notify = updates.newBookingNotify;
      if (updates.cancellationNotify !== undefined) updateData.cancellation_notify = updates.cancellationNotify;

      const { error } = await supabase
        .from('notification_settings')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadSettings();
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  };

  const connectTelegram = async (chatId: string) => {
    await updateSettings({
      telegramChatId: chatId,
      telegramEnabled: true,
    });
  };

  const disconnectTelegram = async () => {
    await updateSettings({
      telegramChatId: null,
      telegramEnabled: false,
    });
  };

  return {
    settings,
    loading,
    updateSettings,
    connectTelegram,
    disconnectTelegram,
    refresh: loadSettings,
  };
}
