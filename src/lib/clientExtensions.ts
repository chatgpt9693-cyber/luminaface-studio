// Расширенные поля для клиентов

export interface ClientExtended {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  lastVisit?: string;
  totalVisits: number;
  
  // Расширенные поля
  birthday?: string;
  preferences?: string[];
  allergies?: string;
  tags?: string[];
  discount?: number;
  notes?: string;
  totalSpent?: number;
  averageCheck?: number;
  favoriteService?: string;
}

export const CLIENT_TAGS = [
  { value: 'VIP', label: 'VIP', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' },
  { value: 'REGULAR', label: 'Постоянный', color: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  { value: 'NEW', label: 'Новый', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  { value: 'INACTIVE', label: 'Неактивный', color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400' },
  { value: 'PROBLEM', label: 'Проблемный', color: 'bg-red-500/20 text-red-600 dark:text-red-400' },
] as const;

export const PREFERENCES = [
  'Мягкий массаж',
  'Интенсивный массаж',
  'Без масел',
  'Ароматерапия',
  'Тихая музыка',
  'Без музыки',
  'Теплые полотенца',
  'Холодные компрессы',
] as const;

export function calculateClientStats(appointments: any[]) {
  const completed = appointments.filter(a => a.status === 'COMPLETED');
  const totalSpent = completed.reduce((sum, a) => sum + (a.price || 0), 0);
  const averageCheck = completed.length > 0 ? totalSpent / completed.length : 0;
  
  // Находим самую популярную услугу
  const serviceCounts = completed.reduce((acc, a) => {
    acc[a.serviceName] = (acc[a.serviceName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const favoriteService = Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  
  return {
    totalSpent,
    averageCheck: Math.round(averageCheck),
    favoriteService,
  };
}

export function autoAssignTags(client: ClientExtended, appointments: any[]): string[] {
  const tags: string[] = [];
  const completed = appointments.filter(a => a.status === 'COMPLETED');
  
  // VIP - более 10 визитов или потратил более 50000
  if (completed.length >= 10 || (client.totalSpent && client.totalSpent >= 50000)) {
    tags.push('VIP');
  }
  
  // Постоянный - более 5 визитов
  if (completed.length >= 5 && completed.length < 10) {
    tags.push('REGULAR');
  }
  
  // Новый - менее 3 визитов
  if (completed.length < 3) {
    tags.push('NEW');
  }
  
  // Неактивный - последний визит более 3 месяцев назад
  if (client.lastVisit) {
    const lastVisitDate = new Date(client.lastVisit);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    if (lastVisitDate < threeMonthsAgo && completed.length > 0) {
      tags.push('INACTIVE');
    }
  }
  
  return tags;
}
