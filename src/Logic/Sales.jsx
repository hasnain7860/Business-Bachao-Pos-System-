import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useSalesContext = () => {
    // Sales context
    
    const [Sales, setSales] = useState([]);
   
  
    // Load units from IndexedDB when the component mounts
  useEffect(() => {
    const loadSale = async () => {
      
      const storedSale = await getItems(STORE_NAMES.sales);
      
      setSales(storedSale);
    };
    loadSale();
  }, []);


  const refreshData = async () => {
    const updatedData = await getItems(STORE_NAMES.sales);
    setSales(updatedData);
  };

const addSale = async (newSale) => {
    const id = await addItem(STORE_NAMES.sales, newSale);
    setSales((prev) => [...prev, { ...newSale
    }]);
  };
  const editSale = async (id, updatedSales) => {
    await putItem(STORE_NAMES.sales, { ...updatedSales, id });
       setSales((prev) => prev.map(sale => sale.id == id ? { ...updatedSales, id } : sale));
       
     };
  const deleteSale = async (salesRefNo) => {
    console.log(salesRefNo)
    await deleteFromDB(STORE_NAMES.sales, salesRefNo);
    setSales((prev) => deleteItem(prev, salesRefNo));
    console.log("delte sale succesfully")
  };
  
 
  
  const SaleContext = {
   
    Sales,

    add: addSale,
    edit:editSale,
    delete: deleteSale,
    refreshData
  };

  return SaleContext;
};

export default useSalesContext


