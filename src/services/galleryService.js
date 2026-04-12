import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

const COLLECTION = 'gallery';

export async function getGalleryImages() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
}

export async function addGalleryImage(file, alt) {
  const fileName = `gallery/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  const docRef = await addDoc(collection(db, COLLECTION), {
    url,
    alt: alt || '',
    storagePath: fileName,
    createdAt: Timestamp.now(),
  });

  return { id: docRef.id, url, alt, storagePath: fileName };
}

export async function deleteGalleryImage(imageId, storagePath) {
  await deleteDoc(doc(db, COLLECTION, imageId));
  if (storagePath) {
    try {
      await deleteObject(ref(storage, storagePath));
    } catch {
      // storage'dan silinemezse devam et
    }
  }
}
