import { useState, useEffect } from 'react';
import { addItem, getItems, deleteItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

// Ensure 'damage' is added to your STORE_NAMES in IndexedDb.jsx before running this!

const useDamageContext = () => {
  const [damages, setDamages] = useState([]);

  useEffect(() => {
    const loadDamages = async () => {
      // Assuming STORE_NAMES.damage exists
      const storedDamages = await getItems(STORE_NAMES.damage || 'damage'); 
      setDamages(storedDamages);
    };
    loadDamages();
  }, []);

  const refreshData = async () => {
    const updatedData = await getItems(STORE_NAMES.damage || 'damage');
    setDamages(updatedData);
  };

  const addDamage = async (newDamage) => {
     // Save to DB
     await addItem(STORE_NAMES.damage || 'damage', newDamage);
     // Update State
     setDamages((prev) => [...prev, newDamage]);
  };

  const updateDamage = async (id, updatedDamage) => {
    await putItem(STORE_NAMES.damage || 'damage', { ...updatedDamage, id });
    setDamages((prev) => prev.map(item => item.id === id ? { ...updatedDamage, id } : item));
  };

  const deleteDamage = async (id) => {
    await deleteFromDB(STORE_NAMES.damage || 'damage', id);
    setDamages((prev) => prev.filter(item => item.id !== id));
  };

  return {
    damages,
    add: addDamage,
    edit: updateDamage,
    delete: deleteDamage,
    refreshData 
  };
};

export default useDamageContext;