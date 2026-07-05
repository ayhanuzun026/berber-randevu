import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { sendSms } from './sms.js';

initializeApp();
const db = getFirestore();

// --- Ayarlar ---
const BUSINESS_NAME = 'Salih Yilmaz Barber'; // SMS metninde görünecek ad (ASCII önerilir)
const REMINDER_HOURS = 2; // randevudan kaç saat önce hatırlatma
const TIMEZONE = 'Europe/Istanbul';

// --- Gizli kimlik bilgileri (firebase functions:secrets:set ile tanımlanır) ---
const NETGSM_USERCODE = defineSecret('NETGSM_USERCODE');
const NETGSM_PASSWORD = defineSecret('NETGSM_PASSWORD');
const NETGSM_HEADER = defineSecret('NETGSM_HEADER');

function creds() {
  return {
    usercode: NETGSM_USERCODE.value(),
    password: NETGSM_PASSWORD.value(),
    header: NETGSM_HEADER.value(),
  };
}

// "2026-07-10" + "14:30" -> Date (Istanbul saatiyle)
function appointmentStart(dateStr, timeStr) {
  // +03:00 sabit ofset (Türkiye yaz/kış tek saat dilimi kullanır)
  return new Date(`${dateStr}T${timeStr}:00+03:00`);
}

/**
 * Randevu oluşturulunca müşteriye onay SMS'i gönderir.
 */
export const onAppointmentCreated = onDocumentCreated(
  {
    document: 'appointments/{id}',
    secrets: [NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_HEADER],
    region: 'europe-west1',
  },
  async (event) => {
    const appt = event.data?.data();
    if (!appt || !appt.customerPhone) return;

    const message =
      `${BUSINESS_NAME}: Randevunuz olusturuldu. ` +
      `${appt.date} ${appt.time} - ${appt.serviceName}. Bekliyoruz!`;

    await sendSms(appt.customerPhone, message, creds());
  }
);

/**
 * Her 15 dakikada bir çalışır; başlamasına ~REMINDER_HOURS kalan onaylı
 * randevulara hatırlatma SMS'i gönderir (bir kez).
 */
export const sendReminders = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: TIMEZONE,
    secrets: [NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_HEADER],
    region: 'europe-west1',
  },
  async () => {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_HOURS * 60 * 60 * 1000);

    // Bugün ve yarının tarih metinleri (Istanbul)
    const fmt = (d) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(d); // yyyy-mm-dd
    const dates = [...new Set([fmt(now), fmt(windowEnd)])];

    const snap = await db
      .collection('appointments')
      .where('date', 'in', dates)
      .get();

    const jobs = [];
    snap.forEach((doc) => {
      const a = doc.data();
      if (a.status !== 'confirmed') return;
      if (a.reminderSent) return;

      const start = appointmentStart(a.date, a.time);
      // Başlamasına 0 ile REMINDER_HOURS saat kalanlar
      if (start > now && start <= windowEnd) {
        const message =
          `${BUSINESS_NAME}: Bugun saat ${a.time} randevunuz var. ` +
          `${a.serviceName}. Bekliyoruz!`;

        jobs.push(
          sendSms(a.customerPhone, message, creds()).then((r) => {
            if (r && r.ok) {
              return doc.ref.update({ reminderSent: true });
            }
          })
        );
      }
    });

    await Promise.all(jobs);
    logger.info(`Hatırlatma taraması: ${jobs.length} SMS işlendi.`);
  }
);
