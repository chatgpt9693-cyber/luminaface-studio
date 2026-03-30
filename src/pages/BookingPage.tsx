import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import { useServices } from '@/hooks/useServices';
import { useAppointments } from '@/hooks/useAppointments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const generateSlots = () => {
  const slots: string[] = [];
  const busySlots = ['10:00', '11:30', '16:00'];
  for (let h = 9; h <= 19; h++) {
    for (const m of [0, 30]) {
      const time = `${h.toString().padStart(2, '0')}:${m === 0 ? '00' : '30'}`;
      if (!busySlots.includes(time)) slots.push(time);
    }
  }
  return slots;
};

const availableSlots = generateSlots();
const DAYS = ['31 мар', '1 апр', '2 апр', '3 апр', '4 апр', '5 апр', '6 апр'];

export default function BookingPage() {
  const { user } = useAuth();
  const { services, loading: servicesLoading } = useServices();
  const { createAppointment } = useAppointments();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const service = services.find(s => s.id === selectedService);

  if (servicesLoading) {
    return (
      <div>
        <Topbar title="Запись" />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (!user || !service || !selectedSlot) return;

    setSaving(true);
    try {
      console.log('Creating appointment for user:', user.email);
      
      // Находим запись клиента в таблице clients
      const { data: clientData, error: clientError } = await supabase!
        .from('clients')
        .select('id, master_id')
        .eq('email', user.email)
        .single();

      console.log('Client data:', clientData, 'Error:', clientError);

      if (!clientData) {
        throw new Error('Клиент не найден в базе данных. Обратитесь к администратору.');
      }

      // Формируем дату и время
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + selectedDay);
      const dateStr = targetDate.toISOString().split('T')[0];
      const dateTime = `${dateStr}T${selectedSlot}:00`;

      console.log('Creating appointment:', {
        clientId: clientData.id,
        masterId: clientData.master_id,
        serviceId: service.id,
        dateTime,
      });

      // Создаем запись
      await createAppointment({
        clientId: clientData.id,
        clientName: user.name,
        serviceId: service.id,
        serviceName: service.name,
        dateTime: dateTime,
        status: 'PENDING',
        notes: '',
        price: service.price,
        duration: service.duration,
      });

      console.log('Appointment created successfully');
      setConfirmed(true);
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert(`Ошибка при создании записи: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setSaving(false);
    }
  };

  if (confirmed) {
    return (
      <div>
        <Topbar title="Запись" />
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Запись подтверждена!</h2>
            <p className="text-sm text-muted-foreground mb-1">{service?.name}</p>
            <p className="text-sm text-muted-foreground mb-4">{DAYS[selectedDay]} в {selectedSlot} · {service?.duration} мин</p>
            <p className="text-xs text-muted-foreground bg-secondary/50 rounded-xl p-3">
              📱 Напоминание придёт в Telegram за день до процедуры
            </p>
            <button
              onClick={() => { setConfirmed(false); setStep(1); setSelectedService(null); setSelectedSlot(null); }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Записаться ещё раз
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Запись на процедуру" />
      <div className="p-6 max-w-2xl">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && <div className={`h-px w-8 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {step === 1 ? 'Выбор услуги' : step === 2 ? 'Выбор времени' : 'Подтверждение'}
          </span>
        </div>

        {/* Step 1: Service */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
            <h2 className="text-base font-semibold text-foreground mb-4">Выберите услугу</h2>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Услуги пока не добавлены</p>
            ) : (
              services.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s.id); setStep(2); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedService === s.id
                      ? 'bg-primary/10 border-primary/30'
                      : 'glass-card hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-semibold text-primary">{s.price.toLocaleString()} ₽</p>
                      <p className="text-xs text-muted-foreground">{s.duration} мин</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </motion.div>
        )}

        {/* Step 2: Time */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-semibold text-foreground">Выберите время</h2>
            </div>

            {/* Day selector */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedDay === i ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Time slots */}
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedSlot === slot
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            <button
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className="mt-6 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              Далее
            </button>
          </motion.div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && service && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setStep(2)} className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-semibold text-foreground">Подтвердите запись</h2>
            </div>

            <div className="glass-card p-5 space-y-3 mb-4">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Услуга</span>
                <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Дата</span>
                <span className="text-sm font-medium text-foreground">{DAYS[selectedDay]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Время</span>
                <span className="text-sm font-medium text-foreground">{selectedSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Длительность</span>
                <span className="text-sm font-medium text-foreground">{service.duration} мин</span>
              </div>
              <div className="feminine-divider" />
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-foreground">Стоимость</span>
                <span className="text-sm font-bold text-primary">{service.price.toLocaleString()} ₽</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mb-4">
              📱 Напоминание в Telegram за 24 часа до записи
            </p>

            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Подтвердить запись'
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
