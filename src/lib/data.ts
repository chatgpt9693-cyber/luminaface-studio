export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  lastVisit?: string;
  totalVisits: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  dateTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  price: number;
  duration: number;
}

export const defaultServices: Service[] = [
  { id: '1', name: 'Лимфодренажный массаж лица', duration: 30, price: 3500, description: 'Мягкий лимфодренаж для снятия отёчности и улучшения тона кожи' },
  { id: '2', name: 'Лимфодренажный массаж лица', duration: 45, price: 4500, description: 'Расширенный лимфодренаж с проработкой шейно-воротниковой зоны' },
  { id: '3', name: 'Лимфодренажный массаж лица', duration: 60, price: 5500, description: 'Полный лимфодренажный комплекс с моделированием овала' },
  { id: '4', name: 'Скульптурный массаж лица', duration: 60, price: 6000, description: 'Глубокая проработка мышечного каркаса для лифтинг-эффекта' },
  { id: '5', name: 'Буки-массаж лица', duration: 45, price: 4800, description: 'Буккальная техника для тонуса щёчных мышц и чёткого контура' },
  { id: '6', name: 'Лимфодренаж + скульптура комбо', duration: 90, price: 8500, description: 'Комплексная процедура: лимфодренаж + скульптурное моделирование' },
];

export const mockClients: Client[] = [];

export const mockAppointments: Appointment[] = [];

export const monthlyIncome = [
  { month: 'Окт', income: 0 },
  { month: 'Ноя', income: 0 },
  { month: 'Дек', income: 0 },
  { month: 'Янв', income: 0 },
  { month: 'Фев', income: 0 },
  { month: 'Мар', income: 0 },
];
