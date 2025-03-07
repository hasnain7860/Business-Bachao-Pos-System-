import React, { useEffect, useState } from 'react';
import { clientDatabase} from '../Utils/ClientFirebaseDb.jsx';
import { ref, onValue, set, off } from 'firebase/database';
import { FaSync, FaTrash, FaUpload } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import { useAppContext } from "../Appfullcontext.jsx";
import refreshData from "../Utils/refreshData.jsx";
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
  const [isFetching, setIsFetching] = useState(false); // State to track fetching


  const checkInternet = async () => {
    try {
      await fetch("https://www.google.com", { method: "HEAD", mode: "no-cors" });
      return true;
    } catch {
      return false;
    }
  };

  const fetchDataFromFirebase = async () => {
    if (isFetching) return; // Agar fetch chal raha hai toh return kar do

    setIsFetching(true); // Disable selection & button
    const selectedStore = currentStore; // Store ko lock karna
    const dataRef = ref(clientDatabase, selectedStore);
    
    const internet = await checkInternet();
    if (internet) {
      onValue(dataRef, async (snapshot) => {
        if (selectedStore !== currentStore) return; // Agar store change ho gaya toh ignore karo
        
        const firebaseData = [];
        snapshot.forEach((childSnapshot) => {
          const item = { id: childSnapshot.key, ...childSnapshot.val() };
          firebaseData.push(item);
        });

        await clearOfflineData(selectedStore);
        await setItems(selectedStore, firebaseData);
        toast.success(`Data synced from Firebase (${selectedStore}) to offline storage!`, {
          className: 'bg-green-500 text-white',
        });

        refreshData(context);
        fetchOfflineData();
        off(dataRef); // Firebase listener stop karna
        setIsFetching(false); // Enable selection & button
      });
    } else {
      toast.error('Internet is Not Working, check and try Again', {
        className: 'bg-orange-500 text-white',
      });
      setIsFetching(false);
    }
  };

  const fetchOfflineData = async () => {
    const items = await getItems(currentStore);
    setOfflineData(items);
  };

  const handleSyncOfflineData = async () => {
    if (isFetching) return; // Agar fetch chal raha hai toh return kar do

    setIsFetching(true); // Disable selection & button
    const internet = await checkInternet();

    if (internet) {   
      for (const item of offlineData) {
        const itemRef = ref(clientDatabase, `${currentStore}/${item.id}`);
        await set(itemRef, item);
      }
      deleteItemsFromFirebase()
      toast.success('All offline items synced to Firebase successfully!', {
        className: 'bg-blue-500 text-white',
      });

      setIsFetching(false);
      refreshData(context);
      fetchOfflineData();
    } else {
      toast.error('Internet is Not Working, check and try Again', {
        className: 'bg-orange-500 text-white',
      });
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchOfflineData();
  }, [currentStore]);

  return (
    <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg">
  
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick />
      
      <h1 className="text-3xl font-bold mb-6 text-center">Data Synchronization</h1>
      
      {/* Store Selection */}
      <div className="mb-4">
        <label className="mr-2">Select Store:</label>
        <select
          value={currentStore}
          onChange={(e) => setCurrentStore(e.target.value)}
          className="border border-gray-300 rounded p-2 w-full md:w-auto"
          disabled={isFetching} // Disabled while fetching
        >
          {Object.values(STORE_NAMES).map((store) => (
            <option key={store} value={store}>
              {store.charAt(0).toUpperCase() + store.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex flex-col md:flex-row justify-around mb-4">
        <button
          className={`btn ${isFetching ? "bg-gray-400 cursor-not-allowed" : "btn-primary"} mb-2 md:mb-0`}
          onClick={fetchDataFromFirebase}
          disabled={isFetching} // Disabled while fetching
        >
          <FaSync className="mr-2" /> {isFetching ? "Fetching..." : "Fetch Data"}
        </button>
        
        <button
          className={`btn ${isFetching ? "bg-gray-400 cursor-not-allowed" : "btn-success"}`}
          onClick={handleSyncOfflineData}
          disabled={isFetching} // Disabled while fetching
        >
          <FaUpload className="mr-2" /> {isFetching ? "Syncing..." : "Sync Offline Data"}
        </button>
      </div>

      {/* Offline Data List */}
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