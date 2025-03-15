import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useProductContext = () => {
    // Product context
  const [products, setProducts] = useState([]);
  

  
    // Load units from IndexedDB when the component mounts
  useEffect(() => {
    const loadProduct = async () => {
      const storedProduct = await getItems(STORE_NAMES.products);
      setProducts(storedProduct);
    };
    loadProduct();
  }, []);


  const refreshData = async () => {
    const updatedData = await getItems(STORE_NAMES.products);
  setProducts(updatedData);
  };

const addProduct = async (newProduct) => {
  await addItem(STORE_NAMES.products, newProduct);
  // await refreshData()
   await setProducts((prev) => [...prev, { ...newProduct
    }]);

   
    
  };
  
  
  
  
  const editProduct = async (id, updatedProduct) => {
    // Use putItem to update the unit in IndexedDB
    console.log("call edit product" )
    await putItem(STORE_NAMES.products, { ...updatedProduct, id });
    setProducts((prev) => updateItem(prev, id, updatedProduct));

  };
  
  
    
  const deleteProduct = async (id) => {
    await deleteFromDB(STORE_NAMES.products, id);
    setProducts((prev) => deleteItem(prev, id));
    
    
    
  };
  const productContext = {
    products,
    
    add: addProduct,
    edit: editProduct,
    delete: deleteProduct,
    refreshData 
  };

  return productContext;
};

export default useProductContext



