import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'appointments';

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

export async function createAppointment(data) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    status: 'confirmed',
    createdAt: Timestamp.now(),
  });
  return docRef.id;
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

export async function updateAppointmentStatus(appointmentId, status, { cancelledBy } = {}) {
  const data = { status };
  if (cancelledBy) data.cancelledBy = cancelledBy;
  return updateDoc(doc(db, COLLECTION, appointmentId), data);
}

export async function getAppointmentsByDate(dateStr) {
  const q = query(
    collection(db, COLLECTION),
    where('date', '==', dateStr),
    where('status', 'in', ['pending', 'confirmed'])
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
    .filter((a) => a.status === 'pending' || a.status === 'confirmed');
}
