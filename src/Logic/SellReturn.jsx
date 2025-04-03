import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useSellReturnContext = () => {
  // SellReturn context
  const [sellReturns, setSellReturns] = useState([]);
  
  // Load sell returns from IndexedDB when the component mounts
  useEffect(() => {
    const loadSellReturns = async () => {
      const storedSellReturns = await getItems(STORE_NAMES.sellReturns);
      setSellReturns(storedSellReturns);
    };
    loadSellReturns();
  }, []);

  const refreshData = async () => {
    const updatedData = await getItems(STORE_NAMES.sellReturns);
    setSellReturns(updatedData);
  };

  const addSellReturn = async (newSellReturn) => {
    await addItem(STORE_NAMES.sellReturns, newSellReturn);
    setSellReturns((prev) => [...prev, { ...newSellReturn }]);
  };

  const editSellReturn = async (id, updatedSellReturn) => {
    // Use putItem to update the sell return in IndexedDB
    await putItem(STORE_NAMES.sellReturns, { ...updatedSellReturn, id });
    setSellReturns((prev) => updateItem(prev, id, updatedSellReturn));
  };

  const deleteSellReturn = async (id) => {
    await deleteFromDB(STORE_NAMES.sellReturns, id);
    setSellReturns((prev) => deleteItem(prev, id));
  };

  const sellReturnContext = {
    sellReturns,
    add: addSellReturn,
    edit: editSellReturn,
    delete: deleteSellReturn,
    refreshData
  };

  return sellReturnContext;
};

export default useSellReturnContext;