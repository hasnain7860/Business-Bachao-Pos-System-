import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteAndTrackItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const usePurchaseContext = () => {
    // purchases context
    const [purchases, setPurchases] = useState([]);
  
    // Load units from IndexedDB when the component mounts
  useEffect(() => {
    const loadPurchase = async () => {
      const storedPurchase = await getItems(STORE_NAMES.purchases);
      setPurchases(storedPurchase);
    };
    loadPurchase();
  }, []);



const addPurchase = async (newPurchase) => {
     await addItem(STORE_NAMES.purchases, newPurchase);
    setPurchases((prev) => [...prev, { ...newPurchase
    }]);
  };
  
  const deletePurchase = async (id) => {
    await deleteFromDB(STORE_NAMES.purchases, id);
    setPurchases((prev) => deleteItem(prev, id));
    
  };
  
  
  
  const purchaseContext = {
    purchases,
    add: addPurchase,
    delete: deletePurchase
  };

  return purchaseContext;
};

export default usePurchaseContext


