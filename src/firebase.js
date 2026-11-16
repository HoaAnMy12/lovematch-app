import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCD_leW_geL08mJ6tpnoGkutLs23wDBGb8",
  authDomain: "hoaanmy0912.firebaseapp.com",
  projectId: "hoaanmy0912",
  storageBucket: "hoaanmy0912.firebasestorage.app",
  messagingSenderId: "184890685181",
  appId: "1:184890685181:web:666cf7d430d75757f57094",
  measurementId: "G-D71LQG5HPY",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);