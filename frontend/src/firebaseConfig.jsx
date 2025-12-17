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
  apiKey: "AIzaSyADnoSH6nqpzKJYHC6Th1NPoGBZPNTnmV8",
  authDomain: "project-c671a.firebaseapp.com",
  projectId: "project-c671a",
  storageBucket: "project-c671a.firebasestorage.app",
  messagingSenderId: "970392879404",
  appId: "1:970392879404:web:f34d78616d26d81161ec89",
  measurementId: "G-8K3JG8GVZC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);