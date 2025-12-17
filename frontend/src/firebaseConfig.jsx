// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyABd53psd-axTZP0dY910Jrf_eNzotDpNc",
  authDomain: "geoinsightai-7ed33.firebaseapp.com",
  projectId: "geoinsightai-7ed33",
  storageBucket: "geoinsightai-7ed33.firebasestorage.app",
  messagingSenderId: "369535895100",
  appId: "1:369535895100:web:8be03ad85d07398e85e539",
  measurementId: "G-ZBKKYTY16Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);