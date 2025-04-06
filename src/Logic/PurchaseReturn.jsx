import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils';
import { addItem, getItems, deleteItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb';

const usePurchaseReturnContext = () => {
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  
  useEffect(() => {
    const loadPurchaseReturns = async () => {
      const storedPurchaseReturns = await getItems(STORE_NAMES.purchaseReturns);
      setPurchaseReturns(storedPurchaseReturns);
    };
    loadPurchaseReturns();
  }, []);

  const refreshData = async () => {
    const updatedData = await getItems(STORE_NAMES.purchaseReturns);
    setPurchaseReturns(updatedData);
  };

  const addPurchaseReturn = async (newPurchaseReturn) => {
    await addItem(STORE_NAMES.purchaseReturns, newPurchaseReturn);
    setPurchaseReturns((prev) => [...prev, { ...newPurchaseReturn }]);
  };

  const editPurchaseReturn = async (id, updatedPurchaseReturn) => {
    await putItem(STORE_NAMES.purchaseReturns, { ...updatedPurchaseReturn, id });
    setPurchaseReturns((prev) => updateItem(prev, id, updatedPurchaseReturn));
  };

  const deletePurchaseReturn = async (id) => {
    await deleteFromDB(STORE_NAMES.purchaseReturns, id);
    setPurchaseReturns((prev) => deleteItem(prev, id));
  };

  const purchaseReturnContext = {
    purchaseReturns,
    add: addPurchaseReturn,
    edit: editPurchaseReturn,
    delete: deletePurchaseReturn,
    refreshData
  };

  return purchaseReturnContext;
};

export default usePurchaseReturnContext;