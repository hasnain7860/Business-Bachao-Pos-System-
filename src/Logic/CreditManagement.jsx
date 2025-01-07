
import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteAndTrackItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useCreditManagementContext = () => {


  const [submittedRecords, setSubmittedRecords] = useState([]);
  

  // Load submittedRecords from IndexedDB when the component mounts
  useEffect(() => {
    const loadCreditManagement = async () => {
      const storedCreditManagement = await getItems(STORE_NAMES.creditManagement);
      setSubmittedRecords(storedCreditManagement);
    };
    loadCreditManagement();
  }, []);

  const addCreditManagement = async (newCreditManagement) => {
     await addItem(STORE_NAMES.creditManagement, newCreditManagement);
    setSubmittedRecords((prev) => [...prev, { ...newCreditManagement }]);
  };

  const editCreditManagement = async (id, updatedCreditManagement) => {
    
    // Use putItem to update the brand in IndexedDB
    await putItem(STORE_NAMES.creditManagement, { ...updatedCreditManagement, id });
setSubmittedRecords((prev) => updateItem(prev, id, updatedCreditManagement));
  };

  const deletCreditManagement = async (id) => {
    await deleteFromDB(STORE_NAMES.creditManagement, id);
    setSubmittedRecords((prev) => deleteItem(prev, id));
    
  };
  const creditManagementContext = {
    submittedRecords,
    add: addCreditManagement,
    edit: editCreditManagement,
      delete: deletCreditManagement
  };
  return creditManagementContext;
};

export default useCreditManagementContext;