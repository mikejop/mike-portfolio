/**
 * ============================================================
 * tracker.js - Rastreamento de usuários para o Dojo Utilities
 * ============================================================
 *
 * Funcionalidades:
 *   1. Captura de IP e geolocalização via ipapi.co
 *   2. Registro de pageviews e cliques
 *   3. Tempo gasto em cada página
 *   4. Tudo salvo no Firebase Firestore com sessionId único
 *
 * Usage: <script type="module" src="/tracker.js"></script>
 */

// ============================================================
// CONFIGURAÇÃO DO FIREBASE (inserir credenciais aqui)
// ============================================================
const YOUR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAY7bp5HQlnlFZjNYXiDD5ypIsv_Erlqac",
  authDomain: "michael-portfolio-b422a.firebaseapp.com",
  projectId: "michael-portfolio-b422a",
  storageBucket: "michael-portfolio-b422a.firebasestorage.app",
  messagingSenderId: "559642725027",
  appId: "1:559642725027:web:f7916f73449ff214298d16",
  measurementId: "G-F5RWB8BSE1"
};

// ============================================================
// IMPORTS DO FIREBASE (via CDN modular)
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ============================================================
// INICIALIZAÇÃO
// ============================================================
let db;
let sessionId;
let pageEntryTime = Date.now();
// Flag to disable tracker if Firestore permissions fail
let trackerDisabled = false;

(async function init() {
  try {
    const app = initializeApp(YOUR_FIREBASE_CONFIG);
    db = getFirestore(app);

    sessionId = crypto.randomUUID();

    // Busca dados de IP e geolocalização (fire-and-forget)
    captureGeoAndSaveSession();

    // Registra o pageview inicial
    trackPageView();

    // Instala os listeners
    installClickListener();
    installPageTimeTracker();

    console.log("[Tracker] Iniciado. SessionId:", sessionId);
  } catch (_) {
    // Falhas silenciosas — não quebra o site
    trackerDisabled = true;
  }
})();

// ============================================================
// BLOCO 1 — Captura de IP e Geolocalização
// ============================================================
async function captureGeoAndSaveSession() {
  return null; // desativado temporariamente
}

// ============================================================
// BLOCO 2 — Rastreamento de Pageviews
// ============================================================
function trackPageView() {
  if (!db || trackerDisabled) return;
  pageEntryTime = Date.now();

  saveEvent({
    type: "pageview",
    page: window.location.href,
    element: null,
    x: null,
    y: null,
  });
}

// ============================================================
// BLOCO 3 — Rastreamento de Cliques
// ============================================================
function installClickListener() {
  document.addEventListener(
    "click",
    (e) => {
      if (!db || trackerDisabled) return;

      const target = e.target;
      const elementDesc = [
        target.tagName?.toLowerCase(),
        target.id ? `#${target.id}` : "",
        target.className ? `.${String(target.className).split(" ").join(".")}` : "",
        target.textContent?.trim().slice(0, 40) || "",
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      saveEvent({
        type: "click",
        page: window.location.href,
        element: elementDesc || null,
        x: e.clientX,
        y: e.clientY,
      });
    },
    { passive: true }
  );
}

// ============================================================
// BLOCO 4 — Tempo gasto na página
// ============================================================
function installPageTimeTracker() {
  const sendTimeSpent = () => {
    if (!db || trackerDisabled) return;
    const timeSpentMs = Date.now() - pageEntryTime;
    if (timeSpentMs < 500) return;

    saveEvent({
      type: "page_exit",
      page: window.location.href,
      element: null,
      x: null,
      y: null,
      timeSpentMs,
    });
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendTimeSpent();
  });

  window.addEventListener("pagehide", sendTimeSpent);
}

// ============================================================
// BLOCO 5 — Salvar evento no Firestore (100% silent)
// ============================================================
async function saveEvent(data) {
  if (!db || !sessionId || trackerDisabled) return;

  try {
    await addDoc(collection(db, "events"), {
      sessionId,
      type: data.type,
      page: data.page || null,
      element: data.element || null,
      x: data.x ?? null,
      y: data.y ?? null,
      timeSpentMs: data.timeSpentMs ?? null,
      timestamp: serverTimestamp(),
    });
  } catch (_) {
    // If we get a permission denied error, disable tracker entirely
    // so we stop polluting the console with repeated errors
    if (_.code === 'permission-denied' || _.message?.includes('permission')) {
      trackerDisabled = true;
    }
    // All other errors are silently ignored
  }
}
