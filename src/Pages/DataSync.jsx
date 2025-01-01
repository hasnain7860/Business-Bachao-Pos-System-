
import React, { useEffect, useState } from 'react';
import { clientDatabase } from '../Utils/ClientFirebaseDb.jsx';
import { ref, onValue, set } from 'firebase/database';
import { FaSync, FaTrash, FaUpload } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import {
  getItems,
  deleteItemsFromFirebase,
  setItems,
  STORE_NAMES,
} from '../Utils/IndexedDb.jsx';
import 'react-toastify/dist/ReactToastify.css';

const DataSync = () => {
  const [offlineData, setOfflineData] = useState([]);
  const [currentStore, setCurrentStore] = useState(STORE_NAMES.products);

  const fetchDataFromFirebase = async () => {
    const dataRef = ref(clientDatabase, currentStore);
    onValue(dataRef, async (snapshot) => {
      const firebaseData = [];
      snapshot.forEach((childSnapshot) => {
        const item = { id: childSnapshot.key, ...childSnapshot.val() };
        firebaseData.push(item);
      });

      await setItems(currentStore, firebaseData);
      toast.success(`Data synced from Firebase (${currentStore}) to offline storage!`, {
        className: 'bg-green-500 text-white',
      });
      fetchOfflineData();
    });
  };

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
    for (const item of offlineData) {
      const itemRef = ref(clientDatabase, `${currentStore}/${item.id}`);
      await set(itemRef, item);
    }
    toast.success('All offline items synced to Firebase successfully!', {
      className: 'bg-blue-500 text-white',
    });
    fetchOfflineData();
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
          <FaSync className="mr-2" /> Fetch Data from Firebase
        </button>
        <button className="btn btn-red mb-2 md:mb-0" onClick={handleDelete}>
          <FaTrash className="mr-2" /> Delete Items
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
