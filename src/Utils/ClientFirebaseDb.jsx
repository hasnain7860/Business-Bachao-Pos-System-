// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { listenForChanges, STORE_NAMES } from "./IndexedDb";

let clientDatabase; // This will hold the initialized database instance

const ClientDatabaseInitializer = (firebaseConfig) => {
  const clientApp = initializeApp(firebaseConfig);
  clientDatabase = getDatabase(clientApp);

  console.log("Firebase Realtime Database initialized. Offline persistence is automatically enabled in v9.");
};

// Export the database instance and the initializer component
export { clientDatabase, ClientDatabaseInitializer };