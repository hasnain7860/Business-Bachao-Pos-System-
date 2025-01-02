import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteAndTrackItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

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



const addProduct = async (newProduct) => {
    const id = await addItem(STORE_NAMES.products, newProduct);
    setProducts((prev) => [...prev, { ...newProduct
    }]);
  };
  
  
  
  
  const editProduct = async (id, updatedProduct) => {
    setProducts((prev) => updateItem(prev, id, updatedProduct));
    // Use putItem to update the unit in IndexedDB
    await putItem(STORE_NAMES.products, { ...updatedProduct, id });
    if (selectedProduct?.id === id) setSelectedProduct(null);
  };
  
  
    
  const deleteProduct = async (id) => {
    await deleteFromDB(STORE_NAMES.products, id);
    setProducts((prev) => deleteItem(prev, id));
    if (selectedProduct?.id === id) setSelectedProduct(null);
    
  };
  const productContext = {
    products,
    selectedProduct,
    add: addProduct,
    edit: editProduct,
    delete: deleteProduct,
    select: (id) => setSelectedProduct(products.find((p) => p.id === id) || null),
  };

  return productContext;
};

export default useProductContext



