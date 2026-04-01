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
  { id: '1', name: 'Классический массаж лица', duration: 80, price: 65, description: 'Традиционная техника массажа для расслабления и улучшения тонуса кожи' },
  { id: '2', name: 'Массаж лица Асахи', duration: 40, price: 50, description: 'Японская техника лимфодренажного массажа для омоложения и подтяжки' },
  { id: '3', name: 'Буккальный массаж лица', duration: 90, price: 75, description: 'Глубокая проработка мышц лица изнутри для максимального лифтинг-эффекта' },
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
