// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const adminFirebaseConfig = {
  apiKey: "AIzaSyBf2R7Up3zLEMw2QwgpvfyREfaUgnT-n1o",
  authDomain: "business-bacho.firebaseapp.com",
  projectId: "business-bacho",
  storageBucket: "business-bacho.firebasestorage.app",
  messagingSenderId: "978491846505",
  appId: "1:978491846505:web:da3fabf75626799e1757f8",
  measurementId: "G-SLX0QJ0VLB"
};

// Initialize Firebase
const adminApp = initializeApp(adminFirebaseConfig , "admin");
const analytics = getAnalytics(adminApp);
  const adminDb = getFirestore(adminApp)

export { adminApp, analytics , adminDb}