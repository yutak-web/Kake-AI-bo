import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDu4zEHQhYlH-uSCQWYb4u3a7bVq_t8kQ4",
  authDomain: "kake-ai-bo.firebaseapp.com",
  projectId: "kake-ai-bo",
  storageBucket: "kake-ai-bo.firebasestorage.app",
  messagingSenderId: "178956886336",
  appId: "1:178956886336:web:9d382bc87afb41d1715aa5",
  measurementId: "G-C4V9M353V2",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
