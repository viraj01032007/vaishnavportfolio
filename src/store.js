// Storage layer.
// • With Firebase config in .env (VITE_FIREBASE_*): content in Firestore, enquiries in Firestore,
//   uploads in Firebase Storage, admin login via Firebase Auth (email + password).
// • Without it: falls back to this browser's localStorage (handy for local dev).
import {initializeApp} from "firebase/app";
import {getFirestore, doc, setDoc, onSnapshot, collection, addDoc, getDocs, query, orderBy, limit} from "firebase/firestore";
import {getStorage, ref, uploadBytes, getDownloadURL} from "firebase/storage";
import {getAuth, signInWithEmailAndPassword, signOut, updatePassword} from "firebase/auth";

const env = import.meta.env;
// Firebase web config (public by design — security rules protect the data). .env values override these.
const cfg = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyCuvEz0_VGlSgmN5FrLvPS5lg76qnLyMw4",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "portfoliov-6ed60.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "portfoliov-6ed60",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "portfoliov-6ed60.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "908018303829",
  appId: env.VITE_FIREBASE_APP_ID || "1:908018303829:web:5ca13a033d5c37fc8965dc"
};
export const usingFirebase = Boolean(cfg.apiKey && cfg.projectId);
const ADMIN_EMAIL = env.VITE_ADMIN_EMAIL;

let fs, st, au;
if (usingFirebase) { const app = initializeApp(cfg); fs = getFirestore(app); st = getStorage(app); au = getAuth(app) }
else console.info("[store] Firebase not configured — using localStorage.");

// ---------- localStorage fallback ----------
const KEY = "vd:";
const listeners = new Set();
const lread = p => { try { const v = localStorage.getItem(KEY + p); return v ? JSON.parse(v) : null } catch { return null } };
const lwrite = (p, v) => { localStorage.setItem(KEY + p, JSON.stringify(v)); listeners.forEach(f => f(p)) };

// ---------- public API ----------
export const db = {
  // Live updates for a single document path like "content/site".
  subscribe: (p, fn) => {
    if (usingFirebase) return onSnapshot(doc(fs, p), s => fn(s.exists() ? s.data() : null), e => { console.error(e); fn(null) });
    const f = q => q === p && fn(lread(p)); listeners.add(f); fn(lread(p)); return () => listeners.delete(f);
  },
  set: async (p, v) => usingFirebase ? setDoc(doc(fs, p), v) : lwrite(p, v)
};

export const enquiries = {
  add: async item => {
    if (usingFirebase) return addDoc(collection(fs, "enquiries"), item);
    const all = lread("enquiries") || []; lwrite("enquiries", [...all, item].slice(-200));
  },
  list: async () => {
    if (usingFirebase) { const s = await getDocs(query(collection(fs, "enquiries"), orderBy("at", "desc"), limit(200))); return s.docs.map(d => d.data()) }
    return (lread("enquiries") || []).slice().sort((a, b) => b.at.localeCompare(a.at));
  }
};

export const assets = {
  upload: async file => {
    if (usingFirebase) {
      const r = ref(st, `uploads/${Date.now()}_${file.name.replace(/[^\w.-]/g, "_")}`);
      await uploadBytes(r, file, {contentType: file.type});
      const url = await getDownloadURL(r); return {id: r.fullPath, url};
    }
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res({id: r.result, url: r.result}); r.onerror = rej; r.readAsDataURL(file) });
  },
  maxBytes: usingFirebase ? 50 * 1024 * 1024 : 4 * 1024 * 1024
};

// Admin auth. Firebase mode: real sign-in (required by security rules for writes).
// Fallback mode: compare against the password hash stored in content.
export const adminAuth = {
  signIn: async (password, checkHash) => {
    if (!usingFirebase) return checkHash();
    if (!ADMIN_EMAIL) throw new Error("VITE_ADMIN_EMAIL is not set");
    try { await signInWithEmailAndPassword(au, ADMIN_EMAIL, password); return true } catch { return false }
  },
  signOut: () => usingFirebase && signOut(au),
  changePassword: async pw => { if (usingFirebase && au.currentUser) await updatePassword(au.currentUser, pw) }
};
