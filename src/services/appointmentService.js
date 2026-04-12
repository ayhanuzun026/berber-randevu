import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'appointments';

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
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

export async function getAllAppointments() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

export async function updateAppointmentStatus(appointmentId, status) {
  return updateDoc(doc(db, COLLECTION, appointmentId), { status });
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
