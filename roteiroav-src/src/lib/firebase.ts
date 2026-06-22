import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

console.log("[Firebase] Verificando configuração...");
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn("[Firebase] AVISO: NEXT_PUBLIC_FIREBASE_API_KEY não encontrada! Reinicie o servidor 'npm run dev'.");
} else {
    console.log("[Firebase] API Key carregada (inicia com):", process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 5));
}

const firebaseConfig = {
  apiKey: "AIzaSyAY7bp5HQlnlFZjNYXiDD5ypIsv_Erlqac",
  authDomain: "michael-portfolio-b422a.firebaseapp.com",
  projectId: "michael-portfolio-b422a",
  storageBucket: "michael-portfolio-b422a.firebasestorage.app",
  messagingSenderId: "559642725027",
  appId: "1:559642725027:web:f7916f73449ff214298d16",
  measurementId: "G-F5RWB8BSE1"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Services
let db: ReturnType<typeof getFirestore>;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
} catch (e) {
    db = getFirestore(app);
}
const auth = getAuth(app);
const storage = getStorage(app);

// Analytics is disabled to prevent Installations suspended API key error
const analytics = Promise.resolve(null);

export { app, db, auth, storage, analytics };
