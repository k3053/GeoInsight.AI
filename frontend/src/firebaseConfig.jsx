// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7xaACnNx7tVjGx6tP93lfzcnQ5J0fYX8",
  authDomain: "geoinsightai-645e8.firebaseapp.com",
  projectId: "geoinsightai-645e8",
  storageBucket: "geoinsightai-645e8.firebasestorage.app",
  messagingSenderId: "673653936465",
  appId: "1:673653936465:web:003507bad71b95e5b0c370",
  measurementId: "G-EFC5GP81TS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);