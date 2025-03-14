import React, { useEffect ,useRef} from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { listenForChanges, STORE_NAMES , processPendingQueries,updateAllStoresWithTimestamp } from '../Utils/IndexedDb.jsx';

const Syncauto = () => {
  const context = useAppContext();
  const listenersAdded = useRef(false); // Track if listeners are added
  useEffect(() => {
    if (!listenersAdded.current) { // Check if listeners are already added
    setInterval(() => {
      processPendingQueries();
    }, 1000);
        Object.values(STORE_NAMES).forEach((store_name) => {
          listenForChanges(store_name, context);
        });
        
        listenersAdded.current = true;
        }


    
  },[]); 



 

  return <div>Syncauto</div>;
};

export default Syncauto;