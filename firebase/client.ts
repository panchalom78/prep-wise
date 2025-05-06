import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCH07SWJMaq161a4PM5V_MSZGMiLVGFlHk",
    authDomain: "prepwise-de3a4.firebaseapp.com",
    projectId: "prepwise-de3a4",
    storageBucket: "prepwise-de3a4.firebasestorage.app",
    messagingSenderId: "861227683258",
    appId: "1:861227683258:web:bb4b8dffb627a7b687a183",
    measurementId: "G-05J8J3163Q",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
