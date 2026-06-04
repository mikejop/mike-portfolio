import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { app, db };
