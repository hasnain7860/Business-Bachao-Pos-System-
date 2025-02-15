import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteAndTrackItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';


const useBrandsContext = () => {
  // Brand context
  const [brands, setBrands] = useState([]);
  

  // Load brands from IndexedDB when the component mounts
  useEffect(() => {
    const loadBrands = async () => {
      const storedBrands = await getItems(STORE_NAMES.brands);
      setBrands(storedBrands);
    };
    loadBrands();
  }, []);


  
  const refreshData = async () => {
    const updatedData = await getItems(STORE_NAMES.brands);
    setBrands(updatedData);
  };

  const addBrand = async (newBrand) => {
     await addItem(STORE_NAMES.brands, newBrand);
    setBrands((prev) => [...prev, { ...newBrand }]);
  };

  const editBrand = async (id, updatedBrand) => {
    
    // Use putItem to update the brand in IndexedDB
    await putItem(STORE_NAMES.brands, { ...updatedBrand, id });
setBrands((prev) => updateItem(prev, id, updatedBrand));
  };

  const deleteBrand = async (id) => {
    await deleteFromDB(STORE_NAMES.brands, id);
    setBrands((prev) => deleteItem(prev, id));
    
  };
  const brandContext = {
    brands,
    add: addBrand,
    edit: editBrand,
    delete: deleteBrand,
    refreshData
  };
  return brandContext;
};

export default useBrandsContext;