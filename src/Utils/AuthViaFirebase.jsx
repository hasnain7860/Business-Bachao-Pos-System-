// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const adminFirebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
// Initialize Firebase
const adminApp = initializeApp(adminFirebaseConfig , "admin");
const analytics = getAnalytics(adminApp);
  const adminDb = getFirestore(adminApp)

export { adminApp, analytics , adminDb}