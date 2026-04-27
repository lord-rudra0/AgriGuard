// ----------------------------------------------------------
// firebase.js – Central Firebase initialization for AgriGuard
// ----------------------------------------------------------
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDjNm_LqQeOrgvS7VI3UjoDHoD2Uu4XdGk",
  authDomain: "agrigaurd-ff27a.firebaseapp.com",
  projectId: "agrigaurd-ff27a",
  storageBucket: "agrigaurd-ff27a.firebasestorage.app",
  messagingSenderId: "602716850438",
  appId: "1:602716850438:web:a11c64be7abe93e478f687",
  measurementId: "G-C8R6RTSMJT",
};

const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);

// getMessaging() is only available in browser environments
// On Capacitor Android, FCM is handled natively via @capacitor-firebase/messaging
const messaging =
  typeof window !== "undefined" && "serviceWorker" in navigator
    ? getMessaging(firebaseApp)
    : null;

export { firebaseApp, analytics, messaging };
