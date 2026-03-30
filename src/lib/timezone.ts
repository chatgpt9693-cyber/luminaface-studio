// Утилиты для работы с временной зоной Минска (UTC+3)

const MINSK_OFFSET = 3 * 60; // +3 часа в минутах

/**
 * Конвертирует дату из UTC в локальное время Минска
 */
export function utcToMinsk(utcDate: Date | string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Date(date.getTime() + MINSK_OFFSET * 60 * 1000);
}

/**
 * Конвертирует локальное время Минска в UTC для сохранения в БД
 */
export function minskToUtc(minskDate: Date | string): Date {
  const date = typeof minskDate === 'string' ? new Date(minskDate) : minskDate;
  return new Date(date.getTime() - MINSK_OFFSET * 60 * 1000);
}

/**
 * Форматирует дату в строку YYYY-MM-DD в локальном времени Минска
 */
export function formatDateMinsk(date: Date | string): string {
  const minskDate = typeof date === 'string' ? utcToMinsk(date) : date;
  const year = minskDate.getFullYear();
  const month = String(minskDate.getMonth() + 1).padStart(2, '0');
  const day = String(minskDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Форматирует время в строку HH:MM в локальном времени Минска
 */
export function formatTimeMinsk(date: Date | string): string {
  const minskDate = typeof date === 'string' ? utcToMinsk(date) : date;
  const hours = String(minskDate.getHours()).padStart(2, '0');
  const minutes = String(minskDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Создает дату из строк date и time в локальном времени Минска
 * и конвертирует в UTC для сохранения в БД
 */
export function createDateTimeUtc(dateStr: string, timeStr: string): string {
  // Создаем дату в локальном времени Минска
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Создаем дату как UTC, но с локальными значениями
  const localDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  
  // Конвертируем в UTC (вычитаем смещение)
  const utcDate = minskToUtc(localDate);
  
  return utcDate.toISOString();
}

/**
 * Получает текущую дату в формате YYYY-MM-DD в локальном времени Минска
 */
export function getTodayMinsk(): string {
  const now = new Date();
  const minskNow = utcToMinsk(now);
  return formatDateMinsk(minskNow);
}

/**
 * Проверяет, является ли дата сегодняшней в локальном времени Минска
 */
export function isTodayMinsk(dateStr: string): boolean {
  return dateStr === getTodayMinsk();
}
