import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteAndTrackItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useUnitsContext = () => {
  // Unit context
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Load units from IndexedDB when the component mounts
  useEffect(() => {
    const loadUnits = async () => {
      const storedUnits = await getItems(STORE_NAMES.units);
      setUnits(storedUnits);
    };
    loadUnits();
  }, []);

  const addUnit = async (newUnit) => {
    const id = await addItem(STORE_NAMES.units, newUnit);
    setUnits((prev) => [...prev, { ...newUnit, id }]);
  };

  const editUnit = async (id, updatedUnit) => {
    setUnits((prev) => updateItem(prev, id, updatedUnit));

    // Use putItem to update the unit in IndexedDB
    await putItem(STORE_NAMES.units, { ...updatedUnit, id });
    if (selectedUnit?.id === id) setSelectedUnit(null);
  };

  const deleteUnit = async (id) => {
    await deleteFromDB(STORE_NAMES.units, id);
    setUnits((prev) => deleteItem(prev, id));
    if (selectedUnit?.id === id) setSelectedUnit(null);
  };

  const unitContext = {
    units,
    selectedUnit,
    add: addUnit,
    edit: editUnit,
    delete: deleteUnit,
    select: (id) => setSelectedUnit(units.find((u) => u.id === id) || null),
  };

  return unitContext;
};

export default useUnitsContext