import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BUSINESS } from '../config/constants';

const COLLECTION = 'settings';
const DOC_ID = 'business';

// Ayar dokümanı yoksa kullanılacak varsayılanlar (constants'tan)
export const DEFAULT_SETTINGS = {
  weekday: { open: BUSINESS.workingHours.weekdays.open, close: BUSINESS.workingHours.weekdays.close },
  saturday: { open: BUSINESS.workingHours.saturday.open, close: BUSINESS.workingHours.saturday.close },
  sundayClosed: true,
  holidays: [], // ['2026-07-20', ...] tam kapalı günler
};

export async function getBusinessSettings() {
  try {
    const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
    if (!snap.exists()) return DEFAULT_SETTINGS;
    // Varsayılanlarla birleştir — eksik alanlar için güvenli
    return {
      ...DEFAULT_SETTINGS,
      ...snap.data(),
      weekday: { ...DEFAULT_SETTINGS.weekday, ...(snap.data().weekday || {}) },
      saturday: { ...DEFAULT_SETTINGS.saturday, ...(snap.data().saturday || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateBusinessSettings(patch) {
  return setDoc(doc(db, COLLECTION, DOC_ID), patch, { merge: true });
}
