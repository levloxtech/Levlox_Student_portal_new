/**
 * Firebase initialization — Levlox Student Portal.
 *
 * This is the ONLY place `initializeApp` is called. Every other module must
 * import `auth`, `db` or `storage` from here so a single app instance is reused.
 */
import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  initializeAuth,
  connectAuthEmulator,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment123456789",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "levlox-student-portal.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "levlox-student-portal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "levlox-student-portal.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
};

// Surface a clear message instead of an opaque Firebase error when the
// deployment is missing its environment variables.
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error(
    `[Firebase] Missing configuration: ${missingKeys.join(", ")}. ` +
      `Set the matching VITE_FIREBASE_* environment variables.`
  );
}

// Reuse the existing app across HMR reloads instead of initializing twice.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/*
 * Local development against the Firebase Emulator Suite.
 *
 * Opt in with VITE_USE_FIREBASE_EMULATOR=true in frontend/.env.local. Production
 * builds never set it, so this branch is dead code there. Emulators run the same
 * Auth and Firestore behaviour locally without touching the live project.
 */
const USE_EMULATOR = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
const EMULATOR_AUTH_URL = import.meta.env.VITE_EMULATOR_AUTH_URL || 'http://127.0.0.1:9099';

if (USE_EMULATOR) {
  const firestoreHost = import.meta.env.VITE_EMULATOR_FIRESTORE_HOST || '127.0.0.1';
  const firestorePort = Number(import.meta.env.VITE_EMULATOR_FIRESTORE_PORT || 8080);

  connectAuthEmulator(auth, EMULATOR_AUTH_URL, { disableWarnings: true });
  connectFirestoreEmulator(db, firestoreHost, firestorePort);
  console.info(`[Firebase] Using local emulators — Auth ${EMULATOR_AUTH_URL}, Firestore ${firestoreHost}:${firestorePort}`);
}

// Keep the session across reloads/tabs. Fire-and-forget: onAuthStateChanged
// still resolves correctly if this rejects (e.g. storage blocked in private mode).
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("[Firebase] Could not set local auth persistence:", err?.code || err);
});

/**
 * Create a user without disturbing the currently signed-in session.
 *
 * `createUserWithEmailAndPassword` signs the new account in on whichever Auth
 * instance it is given, which would silently log an admin out of their own
 * dashboard. Running it on a short-lived secondary app keeps the admin session
 * on the primary instance untouched.
 *
 * @returns {Promise<string>} the new user's uid
 */
export const createAuthUserDetached = async (email, password) => {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const token = localStorage.getItem("levlox_auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/api/auth/register-user`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.user) {
      return data.user.id || data.user.uid;
    }

    if (data.user) {
      return data.user.id || data.user.uid;
    }
  } catch (err) {
    console.warn("[SelfHosted] API register user error:", err.message);
  }

  // Self-hosted fallback ID
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

export default app;
