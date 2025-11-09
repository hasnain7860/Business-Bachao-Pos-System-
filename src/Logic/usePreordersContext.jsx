import { useState, useEffect } from 'react';
import { addItem, getItems, deleteItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const usePreordersContext = () => {
  const [preorders, setPreorders] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const storedPreorders = await getItems(STORE_NAMES.preorders);
      setPreorders(storedPreorders);
    };
    loadData();
  }, []);
  
  const refreshData = async () => {
    const updatedPreorders = await getItems(STORE_NAMES.preorders);
    setPreorders(updatedPreorders);
  };

  const addPreorder = async (newPreorder) => {
    await addItem(STORE_NAMES.preorders, newPreorder);
    setPreorders((prev) => [...prev, { ...newPreorder }]);
  };

  const editPreorder = async (id, updatedPreorder) => {
    await putItem(STORE_NAMES.preorders, { ...updatedPreorder, id });
    setPreorders((prev) => prev.map(p => p.id === id ? { ...updatedPreorder, id } : p));
  };

  const deletePreorder = async (id) => {
    await deleteFromDB(STORE_NAMES.preorders, id);
    setPreorders((prev) => prev.filter(p => p.id !== id));
  };

  const preordersContext = {
    preorders,
    setPreorders,
    add: addPreorder,
    edit: editPreorder,
    delete: deletePreorder,
    refreshData,
  };

  return preordersContext;
}

export default usePreordersContext;

