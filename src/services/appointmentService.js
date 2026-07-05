import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  runTransaction,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getServicePrice, getServiceDuration, STATUS, APPOINTMENT } from '../config/constants';
import { coveredSlotTimes, reservationId } from '../utils/slots';

const COLLECTION = 'appointments';
const RESERVATIONS = 'slotReservations';

function toComparableTime(value) {
  if (!value) return 0;

  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  return 0;
}

function toAppointmentSortTime(appointment) {
  const createdAtTime = toComparableTime(appointment.createdAt);

  if (createdAtTime) {
    return createdAtTime;
  }

  if (!appointment.date) {
    return 0;
  }

  const time = appointment.time || '00:00';
  const parsed = new Date(`${appointment.date}T${time}:00`);
  const parsedTime = parsed.getTime();

  return Number.isNaN(parsedTime) ? 0 : parsedTime;
}

function sortAppointmentsDesc(appointments) {
  return appointments.sort((a, b) => toAppointmentSortTime(b) - toAppointmentSortTime(a));
}

/**
 * Randevu oluşturur. Çift rezervasyonu önlemek için transaction içinde
 * ilgili 15dk slotlarını rezerve eder — herhangi biri doluysa işlem iptal olur.
 * Fiyat ve süre güvenilir kaynaktan (constants) alınır; istemci değerine güvenilmez.
 */
export async function createAppointment(data) {
  const { userId, serviceId, staffId, date, time } = data;

  const trustedPrice = getServicePrice(serviceId);
  const trustedDuration = getServiceDuration(serviceId);
  if (trustedDuration === undefined) {
    throw new Error('INVALID_SERVICE');
  }

  const slotTimes = coveredSlotTimes(time, trustedDuration);
  const slotRefs = slotTimes.map((t) => doc(db, RESERVATIONS, reservationId(date, staffId, t)));

  const appointmentId = await runTransaction(db, async (tx) => {
    // Tüm okumalar önce yapılmalı (Firestore transaction kuralı)
    const snaps = await Promise.all(slotRefs.map((ref) => tx.get(ref)));
    if (snaps.some((snap) => snap.exists())) {
      throw new Error('SLOT_TAKEN');
    }

    const apptRef = doc(collection(db, COLLECTION));
    tx.set(apptRef, {
      ...data,
      servicePrice: trustedPrice ?? null,
      serviceDuration: trustedDuration,
      status: STATUS.CONFIRMED,
      createdAt: Timestamp.now(),
    });

    slotRefs.forEach((ref, i) => {
      tx.set(ref, {
        date,
        staffId,
        time: slotTimes[i],
        userId,
        appointmentId: apptRef.id,
        createdAt: Timestamp.now(),
      });
    });

    return apptRef.id;
  });

  return appointmentId;
}

export async function getAppointmentsByUser(userId) {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return sortAppointmentsDesc(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function getAllAppointments() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return sortAppointmentsDesc(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
}

/**
 * Randevuları gerçek-zamanlı dinler (30sn polling yerine).
 * onChange(sortedList) her değişiklikte çağrılır. Aboneliği iptal eden fonksiyon döner.
 */
export function subscribeToAppointments(onChange, onError) {
  return onSnapshot(
    collection(db, COLLECTION),
    (snapshot) => {
      const list = sortAppointmentsDesc(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
      onChange(list);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Randevu durumunu günceller. İptal edilirse kim iptal etti bilgisini yazar
 * ve rezerve edilmiş slotları serbest bırakır.
 */
export async function updateAppointmentStatus(appointmentId, status, opts = {}) {
  const patch = { status };
  if (status === STATUS.CANCELLED && opts.cancelledBy) {
    patch.cancelledBy = opts.cancelledBy;
  }

  await updateDoc(doc(db, COLLECTION, appointmentId), patch);

  if (status === STATUS.CANCELLED) {
    await releaseSlotsForAppointment(appointmentId);
  }
}

/**
 * Randevuyu yeni tarih/saate erteler. Transaction içinde yeni slotların boş
 * olduğunu doğrular, eski slotları siler, yeni slotları rezerve eder.
 * Personel ve hizmet aynı kalır.
 */
export async function rescheduleAppointment(appointmentId, appt, newDate, newTime) {
  const { staffId, date: oldDate, time: oldTime, userId } = appt;
  const duration = appt.serviceDuration || APPOINTMENT.slotDuration;

  const oldTimes = coveredSlotTimes(oldTime, duration);
  const newTimes = coveredSlotTimes(newTime, duration);

  const oldRefs = oldTimes.map((t) => doc(db, RESERVATIONS, reservationId(oldDate, staffId, t)));
  const newRefs = newTimes.map((t) => doc(db, RESERVATIONS, reservationId(newDate, staffId, t)));

  await runTransaction(db, async (tx) => {
    const snaps = await Promise.all(newRefs.map((ref) => tx.get(ref)));
    snaps.forEach((snap) => {
      // Başka bir randevuya ait dolu slot varsa ertelenemez
      if (snap.exists() && snap.data().appointmentId !== appointmentId) {
        throw new Error('SLOT_TAKEN');
      }
    });

    oldRefs.forEach((ref) => tx.delete(ref));

    newRefs.forEach((ref, i) => {
      tx.set(ref, {
        date: newDate,
        staffId,
        time: newTimes[i],
        userId,
        appointmentId,
        createdAt: Timestamp.now(),
      });
    });

    tx.update(doc(db, COLLECTION, appointmentId), { date: newDate, time: newTime });
  });
}

/** Bir randevuya ait tüm slot rezervasyonlarını siler (slotları serbest bırakır). */
async function releaseSlotsForAppointment(appointmentId) {
  try {
    const q = query(
      collection(db, RESERVATIONS),
      where('appointmentId', '==', appointmentId)
    );
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(doc(db, RESERVATIONS, d.id))));
  } catch {
    // Slotlar silinemezse randevu yine de iptal edilmiş sayılır; sessizce devam et.
  }
}

export async function getAppointmentsByDate(dateStr) {
  const q = query(
    collection(db, COLLECTION),
    where('date', '==', dateStr),
    where('status', 'in', [STATUS.PENDING, STATUS.CONFIRMED])
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAppointmentsByDateAndStaff(dateStr, staffId) {
  const q = query(
    collection(db, COLLECTION),
    where('date', '==', dateStr),
    where('staffId', '==', staffId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((a) => a.status === STATUS.PENDING || a.status === STATUS.CONFIRMED);
}

/**
 * Müşteri tarafının müsaitlik hesabı için — PII içermeyen rezerve slot saatleri.
 * ["10:00", "10:15", ...]
 */
export async function getReservedSlots(dateStr, staffId) {
  const q = query(
    collection(db, RESERVATIONS),
    where('date', '==', dateStr),
    where('staffId', '==', staffId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data().time);
}
