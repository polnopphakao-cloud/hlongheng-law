import { initializeApp } from "firebase/app";import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyChnyFHg2QyqXfPChu8GdBdRGuw7YDWMeU",
  authDomain: "hlongheng-law.firebaseapp.com",
  projectId: "hlongheng-law",
  storageBucket: "hlongheng-law.firebasestorage.app",
  messagingSenderId: "178134966669",
  appId: "1:178134966669:web:e36784a00f165455131dc4"
};

const app = initializeApp(firebaseConfig);
let appCheck;
if (typeof window !== "undefined") {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider('6Le_ex0uAAAAAG9lXHzweGWL35dMeO3vPc-_VGVX'),
    isTokenAutoRefreshEnabled: true
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
