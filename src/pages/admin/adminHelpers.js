import { addDays, startOfDay, getDay } from 'date-fns';
import { BUSINESS, APPOINTMENT } from '../../config/constants';

// O günün tüm çalışma slotlarını üretir (ör. 10:00, 10:15, ...)
export function generateAllTimeSlots() {
  const hours = BUSINESS.workingHours.weekdays;
  if (!hours) return [];

  const [startH, startM] = hours.open.split(':').map(Number);
  const [endH, endM] = hours.close.split(':').map(Number);

  const slots = [];
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + APPOINTMENT.slotDuration <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += APPOINTMENT.slotDuration;
  }

  return slots;
}

// Pazar hariç önümüzdeki `count` günü döndürür
export function generateNextDays(count) {
  const dates = [];
  const today = startOfDay(new Date());
  for (let i = 0; i < count; i++) {
    const date = addDays(today, i);
    if (getDay(date) !== 0) {
      dates.push(date);
    }
  }
  return dates;
}

// Yeni randevu geldiğinde kısa bir zil sesi çalar
export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const notes = [
      { freq: 784, start: 0, dur: 0.15 },
      { freq: 988, start: 0.18, dur: 0.15 },
      { freq: 1175, start: 0.36, dur: 0.25 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });

    setTimeout(() => ctx.close(), 1500);
  } catch {
    // Ses çalınamazsa sessizce devam et
  }
}

export function buildAppointmentNotification(appointments) {
  const [latestAppointment] = appointments;

  if (!latestAppointment) {
    return {
      title: 'Yeni Randevu',
      message: `${appointments.length} yeni randevu geldi.`,
    };
  }

  const customerName = latestAppointment.customerName || 'Yeni musteri';
  const serviceName = latestAppointment.serviceName || 'Randevu';
  const dateLabel = latestAppointment.date || '';
  const timeLabel = latestAppointment.time || '';

  return {
    title: appointments.length > 1 ? `${appointments.length} Yeni Randevu` : 'Yeni Randevu',
    message: `${customerName} - ${serviceName} (${dateLabel} ${timeLabel})`.trim(),
  };
}
