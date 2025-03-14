import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { listenForChanges, STORE_NAMES, processPendingQueries } from '../Utils/IndexedDb.jsx';

const Syncauto = () => {
  const context = useAppContext();
 
  const listenersAdded = useRef(false); // Track if listeners are added

  useEffect(() => {
    console.log("🔥 Syncauto component mounted!");

    if (!listenersAdded.current) {
      console.log("✅ Adding event listeners & starting interval...");
setInterval(() => {
        console.log("⏳ Running processPendingQueries...");
        processPendingQueries();
      }, 1000)


    
      // Adding IndexedDB event listeners
      Object.values(STORE_NAMES).forEach((store_name) => {
        console.log(`📌 Listening for changes in ${store_name}`);
        listenForChanges(store_name, context);
      });

      listenersAdded.current = true;
    }

  
  }, []); // Empty dependency array = Runs only once on mount

  return <div>Syncauto</div>;
};

export default Syncauto;
