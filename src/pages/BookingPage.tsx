import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import { useServices } from '@/hooks/useServices';
import { useAppointments } from '@/hooks/useAppointments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { createDateTimeUtc, formatDateMinsk, utcToMinsk, formatTimeMinsk } from '@/lib/timezone';

const generateAllSlots = () => {
  const slots: string[] = [];
  for (let h = 9; h <= 19; h++) {
    for (const m of [0, 30]) {
      const time = `${h.toString().padStart(2, '0')}:${m === 0 ? '00' : '30'}`;
      slots.push(time);
    }
  }
  return slots;
};

const allSlots = generateAllSlots();

// Генерируем даты для следующих 7 дней
const generateDays = () => {
  const days = [];
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  
  const today = new Date();
  const minskToday = utcToMinsk(today);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(minskToday);
    date.setUTCDate(minskToday.getUTCDate() + i);
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    days.push(`${day} ${month}`);
  }
  
  return days;
};

export default function BookingPage() {
  const { user } = useAuth();
  const { services, loading: servicesLoading } = useServices();
  const { appointments, loading: appointmentsLoading } = useAppointments();
  const { createAppointment } = useAppointments();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const DAYS = generateDays();
  const service = services.find(s => s.id === selectedService);

  // Вычисляем доступные слоты для выбранного дня
  const getAvailableSlots = () => {
    const today = new Date();
    const minskToday = utcToMinsk(today);
    const targetDate = new Date(minskToday);
    targetDate.setDate(minskToday.getDate() + selectedDay);
    const dateStr = formatDateMinsk(targetDate);

    // Фильтруем занятые слоты
    const busySlots = appointments
      .filter(apt => {
        const minskDate = utcToMinsk(apt.dateTime);
        const aptDate = formatDateMinsk(minskDate);
        return aptDate === dateStr && apt.status !== 'CANCELLED';
      })
      .map(apt => {
        const minskDate = utcToMinsk(apt.dateTime);
        return formatTimeMinsk(minskDate);
      });

    return allSlots.filter(slot => !busySlots.includes(slot));
  };

  const availableSlots = getAvailableSlots();

  if (servicesLoading || appointmentsLoading) {
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
      console.log('BookingPage handleConfirm:', { selectedDay, selectedSlot });
      
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

      // Формируем дату и время в локальном времени Минска
      const today = new Date();
      const minskToday = utcToMinsk(today);
      const targetDate = new Date(minskToday);
      targetDate.setUTCDate(minskToday.getUTCDate() + selectedDay);
      const dateStr = formatDateMinsk(targetDate);
      
      console.log('Date calculation:', {
        today: today.toISOString(),
        minskToday: minskToday.toISOString(),
        targetDate: targetDate.toISOString(),
        dateStr,
        selectedSlot
      });
      
      // Конвертируем в UTC для сохранения в БД
      const dateTimeUtc = createDateTimeUtc(dateStr, selectedSlot);

      console.log('Creating appointment:', {
        clientId: clientData.id,
        masterId: clientData.master_id,
        serviceId: service.id,
        dateTime: dateTimeUtc,
      });

      // Создаем запись
      await createAppointment({
        clientId: clientData.id,
        clientName: user.name,
        serviceId: service.id,
        serviceName: service.name,
        dateTime: dateTimeUtc,
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
        <div className="p-6 flex items-center justify-center min-h-[70vh]">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="text-center max-w-md"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-lavender/30 border-2 border-primary/40 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20"
            >
              <Check className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Запись подтверждена! ✨
            </h2>
            <div className="glass-card p-5 mb-6">
              <p className="text-base font-semibold text-foreground mb-2">{service?.name}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>📅 {DAYS[selectedDay]}</span>
                <span>•</span>
                <span>🕐 {selectedSlot}</span>
                <span>•</span>
                <span>⏱ {service?.duration} мин</span>
              </div>
            </div>
            <div className="glass-card p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <p className="text-sm text-muted-foreground text-left">
                  Напоминание придёт в Telegram за день до процедуры
                </p>
              </div>
            </div>
            <button
              onClick={() => { setConfirmed(false); setStep(1); setSelectedService(null); setSelectedSlot(null); }}
              className="text-sm text-primary hover:underline font-medium"
            >
              ← Записаться ещё раз
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
        {/* Steps - Enhanced */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                step >= s 
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'bg-secondary/50 text-muted-foreground'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`h-1 w-12 rounded-full transition-all ${step > s ? 'bg-gradient-to-r from-primary to-primary/60' : 'bg-border'}`} />}
            </div>
          ))}
          <div className="ml-3 flex-1">
            <p className="text-xs text-muted-foreground">Шаг {step} из 3</p>
            <p className="text-sm font-semibold text-foreground">
              {step === 1 ? 'Выбор услуги' : step === 2 ? 'Выбор времени' : 'Подтверждение'}
            </p>
          </div>
        </div>

        {/* Step 1: Service - Enhanced */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Выберите процедуру
              </h2>
              <p className="text-sm text-muted-foreground">Каждая процедура разработана для вашей красоты</p>
            </div>
            {services.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💆‍♀️</span>
                </div>
                <p className="text-sm text-muted-foreground">Услуги временно недоступны</p>
              </div>
            ) : (
              services.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s.id); setStep(2); }}
                  className={`w-full text-left p-5 rounded-2xl border transition-all group ${
                    selectedService === s.id
                      ? 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/40 shadow-lg shadow-primary/10'
                      : 'glass-card hover:border-primary/30 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">✨</span>
                        <h3 className="text-base font-semibold text-foreground">{s.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{s.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-lg bg-secondary/60 text-xs text-muted-foreground">
                          ⏱ {s.duration} мин
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-primary/10 text-xs text-primary font-medium">
                          💎 Премиум
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-primary mb-1">{s.price.toLocaleString()} Br</p>
                      <p className="text-xs text-muted-foreground">за процедуру</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </motion.div>
        )}

        {/* Step 2: Time - Enhanced */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setStep(1)} 
                className="w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Выберите время
                </h2>
                <p className="text-sm text-muted-foreground">Найдите удобный слот для визита</p>
              </div>
            </div>

            {/* Day selector - Enhanced */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-3">Выберите дату</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {DAYS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDay(i);
                      setSelectedSlot(null);
                    }}
                    className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedDay === i 
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30' 
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots - Enhanced */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-3">Доступное время</p>
              {availableSlots.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📅</span>
                  </div>
                  <p className="text-sm text-muted-foreground">На этот день все слоты заняты</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Попробуйте выбрать другую дату</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 rounded-xl text-sm font-medium transition-all ${
                        selectedSlot === slot
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground hover:scale-105'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Продолжить →
            </button>
          </motion.div>
        )}

        {/* Step 3: Confirm - Enhanced */}
        {step === 3 && service && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setStep(2)} 
                className="w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Подтверждение
                </h2>
                <p className="text-sm text-muted-foreground">Проверьте детали записи</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-primary/30 p-6 mb-6" style={{
              background: 'linear-gradient(135deg, hsl(340 45% 72% / 0.12), hsl(280 30% 70% / 0.08))',
              backdropFilter: 'blur(20px)'
            }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">✨</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Процедура</p>
                    <h3 className="text-lg font-bold text-foreground">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  </div>
                </div>
                
                <div className="feminine-divider" />
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-secondary/60">
                    <p className="text-xs text-muted-foreground mb-1">Дата</p>
                    <p className="text-sm font-semibold text-foreground">{DAYS[selectedDay]}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/60">
                    <p className="text-xs text-muted-foreground mb-1">Время</p>
                    <p className="text-sm font-semibold text-foreground">{selectedSlot}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/60">
                    <p className="text-xs text-muted-foreground mb-1">Длительность</p>
                    <p className="text-sm font-semibold text-foreground">{service.duration} мин</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                    <p className="text-xs text-primary mb-1">Стоимость</p>
                    <p className="text-lg font-bold text-primary">{service.price.toLocaleString()} Br</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📱</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">Напоминание в Telegram</p>
                  <p className="text-xs text-muted-foreground">Мы отправим уведомление за 24 часа до визита</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-base font-bold hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Оформление...
                </>
              ) : (
                <>
                  Подтвердить запись ✨
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
