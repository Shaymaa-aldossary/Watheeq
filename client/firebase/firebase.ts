// firebase/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ بيانات مشروعك من Firebase Console 
const firebaseConfig = {
  apiKey: "AIzaSyBy-98A_rSsEe8xX8jcSFBVJgxC4WjeCak",
  authDomain: "wathiq-9761e.firebaseapp.com",
  projectId: "wathiq-9761e",
  storageBucket: "wathiq-9761e.firebasestorage.app",
  messagingSenderId: "159174686365",
  appId: "1:159174686365:web:d65f16e564f5cd344dc674",
};

// ✅ تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// ✅ تهيئة الخدمات المطلوبة
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ التصدير
export { auth, db };
