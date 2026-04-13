import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'blockedSlots';

export async function getBlockedSlots(dateStr, staffId) {
  const q = query(
    collection(db, COLLECTION),
    where('date', '==', dateStr),
    where('staffId', '==', staffId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addBlockedSlot({ date, staffId, time }) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    date,
    staffId,
    time,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function removeBlockedSlot(docId) {
  return deleteDoc(doc(db, COLLECTION, docId));
}

export async function toggleBlockedSlot(date, staffId, time) {
  const existing = await getBlockedSlots(date, staffId);
  const found = existing.find((s) => s.time === time);

  if (found) {
    await removeBlockedSlot(found.id);
    return { action: 'unblocked' };
  }

  const id = await addBlockedSlot({ date, staffId, time });
  return { action: 'blocked', id };
}
