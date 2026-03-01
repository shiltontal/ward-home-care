import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue } from 'firebase/database';

// ============================================================
//  FIREBASE — REPLACE THESE VALUES WITH YOUR PROJECT'S CONFIG
//  See deployment-guide.md for instructions
// ============================================================
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "",
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || "",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "",
};

let db = null;

if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("✅ Firebase connected — real-time sync active");
  } catch (e) {
    console.warn("Firebase init failed, using localStorage", e);
  }
} else {
  console.warn("⚠️ Firebase not configured — using localStorage (data NOT shared)");
}

export async function dbRead(key) {
  if (db) {
    const snap = await get(ref(db, "ward/" + key));
    const val = snap.val();
    return val ? JSON.parse(val) : null;
  }
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : null;
}

export async function dbWrite(key, data) {
  const json = JSON.stringify(data);
  if (db) {
    return set(ref(db, "ward/" + key), json);
  }
  localStorage.setItem(key, json);
}

export function dbListen(key, callback) {
  if (db) {
    onValue(ref(db, "ward/" + key), (snap) => {
      const val = snap.val();
      if (val) callback(JSON.parse(val));
    });
  }
}

export const isFirebaseReady = !!db;
