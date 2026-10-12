import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyChnyFHg2QyqXfPChu8GdBdRGuw7YDWMeU",
  authDomain: "hlongheng-law.firebaseapp.com",
  projectId: "hlongheng-law",
  storageBucket: "hlongheng-law.firebasestorage.app",
  messagingSenderId: "178134966669",
  appId: "1:178134966669:web:e36784a00f165455131dc4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
