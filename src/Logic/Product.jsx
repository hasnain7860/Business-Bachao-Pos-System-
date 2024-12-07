import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useProductContext = () => {
    // Product context
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  
    // Load units from IndexedDB when the component mounts
  useEffect(() => {
    const loadProduct = async () => {
      const storedProduct = await getItems(STORE_NAMES.products);
      setProducts(storedProduct);
    };
    loadProduct();
  }, []);



const addUnit = async (newProduct) => {
    const id = await addItem(STORE_NAMES.products, newProduct);
    setProducts((prev) => [...prev, { ...newProduct, id }]);
  };
  
  
  
  
  const editUnit = async (id, updatedProduct) => {
    setProducts((prev) => updateItem(prev, id, updatedProduct));
    // Use putItem to update the unit in IndexedDB
    await putItem(STORE_NAMES.products, { ...updatedProduct, id });
    if (selectedProduct?.id === id) setSelectedProduct(null);
  };
  
  
    
  const deleteUnit = async (id) => {
    await deleteFromDB(STORE_NAMES.products, id);
    setProducts((prev) => deleteItem(prev, id));
    if (selectedProduct?.id === id) setSelectedProduct(null);
  };
  const productContext = {
    products,
    selectedProduct,
    add: addUnit,
    edit: editUnit,
    delete: deleteUnit,
    select: (id) => setSelectedProduct(products.find((p) => p.id === id) || null),
  };

  return productContext;
};

export default useProductContext



