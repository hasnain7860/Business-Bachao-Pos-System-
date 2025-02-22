// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";


import { useAppContext } from '../Appfullcontext.jsx'; // Import your context
import { useEffect, useState } from 'react';


let clientDatabase; // This will hold the initialized database instance
let isInitialized = false; // Flag to check if initialization has occurred

const initializeClientDatabase = (firebaseConfig) => {
  if (!isInitialized) { // Check if already initialized
    const clientApp = initializeApp(firebaseConfig);
    clientDatabase = getDatabase(clientApp);
    isInitialized = true; // Set the flag to true after initialization
  }
};

// This component will handle initialization and act as a hook for external components
const ClientDatabaseInitializer = () => {
  const { settingContext } = useAppContext();
  const { settings } = settingContext; // Assuming settings contains the firebaseStorePass
 let  clientFirebaseConfig
  useEffect(() => {
    if (settings && settings[0].business && settings[0].business.firebaseStorePass) {
      const clientFirebaseConfig = JSON.parse(settings[0].business.firebaseStorePass); // Assuming it's stored as a string
      
      initializeClientDatabase(clientFirebaseConfig);
    }
  }, [settings]);

  return null
  
   // This component does not render anything
};

// Export the database instance and the initializer component
export { clientDatabase, ClientDatabaseInitializer };