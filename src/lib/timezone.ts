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
 * Форматирует дату в строку YYYY-MM-DD
 * Принимает уже сконвертированную дату (не конвертирует повторно)
 */
export function formatDateMinsk(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Форматирует время в строку HH:MM
 * Принимает уже сконвертированную дату (не конвертирует повторно)
 */
export function formatTimeMinsk(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
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
  
  console.log('createDateTimeUtc input:', { dateStr, timeStr, parsed: { year, month, day, hours, minutes } });
  
  // Создаем дату в UTC, вычитая смещение Минска (UTC+3)
  // Если в Минске 10:00, то в UTC это 07:00
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours - 3, minutes, 0));
  
  console.log('createDateTimeUtc output:', utcDate.toISOString());
  
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
