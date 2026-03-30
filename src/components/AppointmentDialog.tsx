import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import type { Appointment } from '@/lib/data';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  defaultDate?: string;
  defaultTime?: string;
  onSave: (appointment: Omit<Appointment, 'id'> & { id?: string }) => void;
}

export default function AppointmentDialog({ open, onOpenChange, appointment, defaultDate, defaultTime, onSave }: AppointmentDialogProps) {
  const { clients, loading: clientsLoading } = useClients();
  const { services, loading: servicesLoading } = useServices();
  
  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    date: '',
    time: '',
    notes: '',
    status: 'PENDING' as Appointment['status'],
  });

  useEffect(() => {
    if (appointment) {
      const [date, time] = appointment.dateTime.split('T');
      setFormData({
        clientId: appointment.clientId,
        serviceId: appointment.serviceId,
        date,
        time: time.slice(0, 5),
        notes: appointment.notes || '',
        status: appointment.status,
      });
    } else {
      setFormData({
        clientId: '',
        serviceId: '',
        date: defaultDate || new Date().toISOString().split('T')[0],
        time: defaultTime || '10:00',
        notes: '',
        status: 'PENDING',
      });
    }
  }, [appointment, defaultDate, defaultTime, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const client = clients.find(c => c.id === formData.clientId);
    const service = services.find(s => s.id === formData.serviceId);
    
    if (!client || !service) return;

    const appointmentData: Omit<Appointment, 'id'> & { id?: string } = {
      ...(appointment && { id: appointment.id }),
      clientId: formData.clientId,
      clientName: client.fullName,
      serviceId: formData.serviceId,
      serviceName: service.name,
      dateTime: `${formData.date}T${formData.time}:00`,
      status: formData.status,
      notes: formData.notes,
      price: service.price,
      duration: service.duration,
    };

    onSave(appointmentData);
    onOpenChange(false);
  };

  const isLoading = clientsLoading || servicesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{appointment ? 'Редактировать запись' : 'Новая запись'}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client">Клиент</Label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите клиента" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="service">Услуга</Label>
            <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите услугу" />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration} мин, {service.price} ₽)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Дата</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Время</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Статус</Label>
            <Select value={formData.status} onValueChange={(value: Appointment['status']) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Ожидание</SelectItem>
                <SelectItem value="CONFIRMED">Подтверждён</SelectItem>
                <SelectItem value="COMPLETED">Завершён</SelectItem>
                <SelectItem value="CANCELLED">Отменён</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Заметки (опционально)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Дополнительная информация"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={!formData.clientId || !formData.serviceId}>
              {appointment ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
