import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useUnitsContext = () => {
  // Unit context
  const [units, setUnits] = useState([]);
  

  // Load units from IndexedDB when the component mounts
  useEffect(() => {
    const loadUnits = async () => {
      const storedUnits = await getItems(STORE_NAMES.units);
      setUnits(storedUnits);
    };
    loadUnits();
  }, []);

  
  const refreshData = async () => {
    const updatedData = await getItems(STORE_NAMES.units);
    setUnits(updatedData);
  };

  const addUnit = async (newUnit) => {
     await addItem(STORE_NAMES.units, newUnit);
      setUnits((prev) => [...prev, { ...newUnit
     }])
  };

  const editUnit = async (id, updatedUnit) => {
    // Use putItem to update the unit in IndexedDB
    await putItem(STORE_NAMES.units, { ...updatedUnit, id });
    setUnits((prev) => updateItem(prev, id, updatedUnit));
  };

  const deleteUnit = async (id) => {
    await deleteFromDB(STORE_NAMES.units, id);
    setUnits((prev) => deleteItem(prev, id));
    
  };

  const unitContext = {
    units,
    
    add: addUnit,
    edit: editUnit,
    delete: deleteUnit,
    refreshData 
    
  };

  return unitContext;
};

export default useUnitsContext