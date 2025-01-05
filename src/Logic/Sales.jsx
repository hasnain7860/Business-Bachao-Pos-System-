import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteAndTrackItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useSalesContext = () => {
    // Sales context
    
    const [Sales, setSales] = useState([]);
  
    // Load units from IndexedDB when the component mounts
  useEffect(() => {
    const loadSale = async () => {
      const storedSale = await getItems(STORE_NAMES.sales);
      setSales(storedSale);
    };
    loadSale();
  }, []);



const addSale = async (newSale) => {
    const id = await addItem(STORE_NAMES.sales, newSale);
    setSales((prev) => [...prev, { ...newSale
    }]);
  };
  
  const deleteSale = async (salesRefNo) => {
    await deleteFromDB(STORE_NAMES.sales, salesRefNo);
    setSales((prev) => deleteItem(prev, salesRefNo));
    
  };
  
  
  
  const SaleContext = {
    Sales,
    add: addSale,
    delete: deleteSale
  };

  return SaleContext;
};

export default useSalesContext


