import { useState, useEffect } from 'react';
import { addItem, getItems, deleteItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useAreasContext = () => {
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const storedAreas = await getItems(STORE_NAMES.areas);
      setAreas(storedAreas);
    };
    loadData();
  }, []);
  
  const refreshData = async () => {
    const updatedAreas = await getItems(STORE_NAMES.areas);
    setAreas(updatedAreas);
  };

  const addArea = async (newArea) => {
    await addItem(STORE_NAMES.areas, newArea);
    setAreas((prev) => [...prev, { ...newArea }]);
  };

  const editArea = async (id, updatedArea) => {
    await putItem(STORE_NAMES.areas, { ...updatedArea, id });
    setAreas((prev) => prev.map(area => area.id === id ? { ...updatedArea, id } : area));
  };

  const deleteArea = async (id) => {
    await deleteFromDB(STORE_NAMES.areas, id);
    setAreas((prev) => prev.filter(area => area.id !== id));
  };

  const areasContext = {
    areas,
    setAreas,
    add: addArea,
    edit: editArea,
    delete: deleteArea,
    refreshData,
  };

  return areasContext;
}

export default useAreasContext;
