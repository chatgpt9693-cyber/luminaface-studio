export type NotificationType = 
  | 'REMINDER_24H' 
  | 'REMINDER_2H' 
  | 'NEW_BOOKING' 
  | 'CANCELLATION' 
  | 'CONFIRMATION' 
  | 'CUSTOM';

export type NotificationChannel = 'TELEGRAM' | 'EMAIL' | 'SMS';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface NotificationSettings {
  id: string;
  userId: string;
  telegramEnabled: boolean;
  telegramChatId: string | null;
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminder24h: boolean;
  reminder2h: boolean;
  newBookingNotify: boolean;
  cancellationNotify: boolean;
  connectionCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  appointmentId: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}
