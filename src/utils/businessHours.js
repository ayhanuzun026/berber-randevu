import { getDay, addDays, startOfDay, format } from 'date-fns';
import { APPOINTMENT } from '../config/constants';

// Verilen güne ait çalışma saatlerini döndürür (kapalıysa null).
export function dayHours(date, settings) {
  const d = getDay(date);
  if (d === 0) return settings.sundayClosed ? null : settings.weekday;
  if (d === 6) return settings.saturday;
  return settings.weekday;
}

// O gün dükkan açık mı? (pazar + tatil günleri dikkate alınır)
export function isDayOpen(date, settings) {
  const dateStr = format(date, 'yyyy-MM-dd');
  if (settings.holidays && settings.holidays.includes(dateStr)) return false;
  return dayHours(date, settings) !== null;
}

// O günün tüm çalışma slotlarını üretir (kapalıysa boş dizi).
export function getWorkingSlots(date, settings, slotDuration = APPOINTMENT.slotDuration) {
  if (!isDayOpen(date, settings)) return [];

  const hours = dayHours(date, settings);
  if (!hours || !hours.open || !hours.close) return [];

  const [startH, startM] = hours.open.split(':').map(Number);
  const [endH, endM] = hours.close.split(':').map(Number);

  const slots = [];
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + slotDuration <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += slotDuration;
  }

  return slots;
}

// Bugünden itibaren açık olan günleri döndürür (kapalı/tatil günler atlanır).
export function getAvailableDates(settings, maxDays = APPOINTMENT.maxAdvanceDays) {
  const dates = [];
  const today = startOfDay(new Date());
  for (let i = 0; i < maxDays; i++) {
    const date = addDays(today, i);
    if (isDayOpen(date, settings)) {
      dates.push(date);
    }
  }
  return dates;
}
