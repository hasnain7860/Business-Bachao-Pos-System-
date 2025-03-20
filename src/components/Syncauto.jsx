import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { listenForChanges, STORE_NAMES, processPendingQueries, syncDeletedItemsForAllStores } from '../Utils/IndexedDb.jsx';

const Syncauto = () => {
  const context = useAppContext();
 
  const listenersAdded = useRef(false); // Track if listeners are added

  useEffect(() => {
 

    if (!listenersAdded.current) {
     
setInterval(() => { 
        processPendingQueries();
      }, 1000)
  
      // Adding IndexedDB event listeners
      Object.values(STORE_NAMES).forEach((store_name) => {
        
        listenForChanges(store_name, context);
setTimeout(syncDeletedItemsForAllStores(store_name,context),5000)
      });
      
      if (!window._hasOnlineEventListener) {
  window.addEventListener("online", ()=>{
   Object.values(STORE_NAMES).forEach((store_name) => {
    syncDeletedItemsForAllStores(store_name,context)
   })
  });
  window._hasOnlineEventListener = true;
}
      

      listenersAdded.current = true;
    }

  
  }, []); // Empty dependency array = Runs only once on mount

  return <div>Syncauto</div>;
};

export default Syncauto;
