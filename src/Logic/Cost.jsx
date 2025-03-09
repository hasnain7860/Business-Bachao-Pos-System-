import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';


const useCostContext = () => {
  
  const [costData, setCostData] = useState([]);
  
  useEffect(() => {
    const loadCostData = async () => {
      const storedCostData = await getItems(STORE_NAMES.cost);
      setCostData(storedCostData);
    };
    loadCostData();
  }, []);
  
  const refreshData = async () => {
    const updatedData = await getItems(STORE_NAMES.cost);
    setCostData (updatedData);
  };
  const addCost = async (newCost) => {
    await addItem(STORE_NAMES.cost, newCost);
    setCostData((prev) => [...prev, { ...newCost }]);
  };
  
  const editCost = async (id, updatedCost) => {
    setCostData((prev) => updateItem(prev, id, updatedCost));
  await putItem(STORE_NAMES.cost, { ...updatedCost, id });
}

const deleteCost = async (id) => {
    await deleteFromDB(STORE_NAMES.cost, id);
    setCostData((prev) => deleteItem(prev, id));

}
  
  const costContext = {
    costData,
    add: addCost,
    edit: editCost,
    delete: deleteCost,
    
    refreshData,
  };



return costContext;
}


export default useCostContext;