// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

let clientDatabase; // This will hold the initialized database instance

const ClientDatabaseInitializer = (firebaseConfig) => {
  const clientApp = initializeApp(firebaseConfig);
  clientDatabase = getDatabase(clientApp);
 
}

// Export the database instance and the initializer component
export { clientDatabase, ClientDatabaseInitializer };