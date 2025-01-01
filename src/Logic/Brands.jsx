import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteAndTrackItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useBrandsContext = () => {
  // Brand context
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);

  // Load brands from IndexedDB when the component mounts
  useEffect(() => {
    const loadBrands = async () => {
      const storedBrands = await getItems(STORE_NAMES.brands);
      setBrands(storedBrands);
    };
    loadBrands();
  }, []);

  const addBrand = async (newBrand) => {
    const id = await addItem(STORE_NAMES.brands, newBrand);
    setBrands((prev) => [...prev, { ...newBrand, id }]);
  };

  const editBrand = async (id, updatedBrand) => {
    setBrands((prev) => updateItem(prev, id, updatedBrand));

    // Use putItem to update the brand in IndexedDB
    await putItem(STORE_NAMES.brands, { ...updatedBrand, id });
    if (selectedBrand?.id === id) setSelectedBrand(null);
  };

  const deleteBrand = async (id) => {
    await deleteFromDB(STORE_NAMES.brands, id);
    setBrands((prev) => deleteItem(prev, id));
    if (selectedBrand?.id === id) setSelectedBrand(null);
  };

  const brandContext = {
    brands,
    selectedBrand,
    add: addBrand,
    edit: editBrand,
    delete: deleteBrand,
    select: (id) => setSelectedBrand(brands.find((b) => b.id === id) || null),
  };

  return brandContext;
};

export default useBrandsContext;