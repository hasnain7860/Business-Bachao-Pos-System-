// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration



const clientFirebaseConfig = {
  apiKey: "AIzaSyCVuIf8XI7ZybWsOYPLUQ6XZbtF5b8Bn8g",
  authDomain: "my-business-bachao.firebaseapp.com",
  projectId: "my-business-bachao",
  storageBucket: "my-business-bachao.firebasestorage.app",
  messagingSenderId: "176854397063",
  appId: "1:176854397063:web:153cbbec419db7c555c822",
databaseURL: "https://my-business-bachao-default-rtdb.firebaseio.com"
  
};

// Initialize Firebase
const clientApp = initializeApp(clientFirebaseConfig);

// Initialize Realtime Database and get a reference to the service
const clientDatabase = getDatabase(clientApp);

export { clientDatabase , clientApp }