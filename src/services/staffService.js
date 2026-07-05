import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

const COLLECTION = 'staff';

export async function getActiveStaff() {
  const q = query(
    collection(db, COLLECTION),
    where('active', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllStaff() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function addStaff(data) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    name: data.name,
    title: data.title || 'Berber',
    photoURL: data.photoURL || '',
    active: true,
  });
  return docRef.id;
}

export async function updateStaff(staffId, data) {
  return updateDoc(doc(db, COLLECTION, staffId), data);
}

export async function deleteStaff(staffId) {
  return deleteDoc(doc(db, COLLECTION, staffId));
}

export async function uploadStaffPhoto(file) {
  const fileName = `staff/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
