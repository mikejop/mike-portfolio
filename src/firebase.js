// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };

