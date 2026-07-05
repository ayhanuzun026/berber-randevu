import { APPOINTMENT } from '../config/constants';

// "10:00" -> 600 (dakika)
export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// 600 -> "10:00"
export function minutesToTime(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Bir hizmetin kapladığı tüm 15dk slotları döndürür.
// coveredSlotTimes("10:00", 45) -> ["10:00", "10:15", "10:30"]
export function coveredSlotTimes(startTime, durationMin, slotDuration = APPOINTMENT.slotDuration) {
  const start = timeToMinutes(startTime);
  const count = Math.ceil(durationMin / slotDuration);
  const times = [];
  for (let i = 0; i < count; i++) {
    times.push(minutesToTime(start + i * slotDuration));
  }
  return times;
}

// Rezervasyon dokümanı için deterministik kimlik (çift rezervasyonu engeller).
// "2026-07-10", "abc123", "10:00" -> "2026-07-10_abc123_1000"
export function reservationId(date, staffId, time) {
  return `${date}_${staffId}_${time.replace(':', '')}`;
}

// Bir slotun, verilen hizmet süresi için müsait olup olmadığını hesaplar.
// reservedTimes / blockedTimes: ["10:00", ...] biçiminde dolu/kapalı slotlar.
// workingTimes: o günün tüm çalışma slotları (çalışma saati sınırı için).
export function isSlotAvailable(slot, serviceDuration, reservedTimes, blockedTimes, workingTimes) {
  const needed = coveredSlotTimes(slot, serviceDuration);

  for (const t of needed) {
    if (!workingTimes.includes(t)) return false; // çalışma saati dışına taşıyor
    if (reservedTimes.includes(t)) return false;
    if (blockedTimes.includes(t)) return false;
  }

  return true;
}
