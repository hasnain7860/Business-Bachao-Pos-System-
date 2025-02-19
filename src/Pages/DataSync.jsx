
import React, { useEffect, useState } from 'react';
import { clientDatabase } from '../Utils/ClientFirebaseDb.jsx';
import { ref, onValue, set } from 'firebase/database';
import { FaSync, FaTrash, FaUpload } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import { useAppContext } from "../Appfullcontext.jsx";
import {
  getItems,
  deleteItemsFromFirebase,
  setItems,
  STORE_NAMES,
  clearOfflineData,
} from '../Utils/IndexedDb.jsx';
import 'react-toastify/dist/ReactToastify.css';

const DataSync = () => {
  const context = useAppContext();
  const [offlineData, setOfflineData] = useState([]);
  const [currentStore, setCurrentStore] = useState(STORE_NAMES.products);



  const refreshData = async () => {
    await context.companyContext.refreshData();
 await context.brandContext.refreshData();
    await context.unitContext.refreshData();
    await context.productContext.refreshData();
    await context.supplierCustomerContext.refreshData();
    await context.settingContext.refreshData();
    await context.creditManagementContext.refreshData();
    await context.purchaseContext.refreshData();
    await context.SaleContext.refreshData();

    console.log("✅ All contexts refreshed successfully!");
  };


  const checkInternet = async () => {
    try {
        await fetch("https://www.google.com", { method: "HEAD", mode: "no-cors" });
        return true;
    } catch {
        return false;
    }
};

  const fetchDataFromFirebase = async () => {
    const dataRef = ref(clientDatabase, currentStore);
    
    const internet = await checkInternet()

   if (internet){
    
    onValue(dataRef, async (snapshot) => {
      const firebaseData = [];
      snapshot.forEach((childSnapshot) => {
      
      
        const item = { id: childSnapshot.id, ...childSnapshot.val() };
        firebaseData.push(item);
      });
      await clearOfflineData(currentStore)
      await setItems(currentStore, firebaseData);
      toast.success(`Data synced from Firebase (${currentStore}) to offline storage!`, {
        className: 'bg-green-500 text-white',
      });
      refreshData();
      fetchOfflineData();
    });
  }else{
    toast.error('Internet is Not Working check Internet And try Again', {
      className: 'bg-orange-500 text-white',
    });
  };
}

  const fetchOfflineData = async () => {
    const items = await getItems(currentStore);
    setOfflineData(items);
  };

  const handleDelete = async () => {
    try {
      await deleteItemsFromFirebase();
      toast.success('Deleted items from Firebase successfully!', {
        className: 'bg-red-500 text-white',
      });
    } catch (error) {
      console.error('Error deleting items from Firebase:', error);
      toast.error('Failed to delete items from Firebase.', {
        className: 'bg-orange-500 text-white',
      });
    }
  };

  
 
  const handleSyncOfflineData = async () => {
   
const internet = await checkInternet()

   if (internet){   
    for (const item of offlineData) {
      const itemRef = ref(clientDatabase, `${currentStore}/${item.id}`);
      await set(itemRef, item);
    }
    
    toast.success('All offline items synced to Firebase successfully!', {
      className: 'bg-blue-500 text-white',
    });
    handleDelete();
    refreshData();
    fetchOfflineData();
  }else{
    toast.error('Internet is Not Working check Internet And try Again', {
      className: 'bg-orange-500 text-white',
    });
  }
};

  useEffect(() => {
    fetchOfflineData();
  }, [currentStore]);

  return (
    <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick />
      <h1 className="text-3xl font-bold mb-6 text-center">Data Synchronization</h1>
      <div className="mb-4">
        <label className="mr-2">Select Store:</label>
        <select
          value={currentStore}
          onChange={(e) => setCurrentStore(e.target.value)}
          className="border border-gray-300 rounded p-2 w-full md:w-auto"
        >
          {Object.values(STORE_NAMES).map((store) => (
            <option key={store} value={store}>
              {store.charAt(0).toUpperCase() + store.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col md:flex-row justify-around mb-4">
        <button className="btn btn-primary mb-2 md:mb-0" onClick={fetchDataFromFirebase}>
          <FaSync className="mr-2" /> Fetch Data 
        </button>
        <button className="btn btn-success" onClick={handleSyncOfflineData}>
          <FaUpload className="mr-2" /> Sync Offline Data
        </button>
      </div>
      <h2 className="text-2xl font-semibold mt-6">Offline Data</h2>
      <ul className="list-disc list-inside mt-2">
        {offlineData.map((item) => (
          <li key={item.id} className="flex justify-between items-center p-2 border-b">
            {item.name} {/* Replace with your item's property */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DataSync;
