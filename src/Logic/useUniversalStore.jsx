import { useState, useEffect, useCallback, useRef } from 'react';
import { addItem, getItems, deleteItem as deleteFromDB, putItem } from '../Utils/IndexedDb.jsx';

/**
 * Universal Hook for CRUD + Live Sync
 * @param {string} storeName - The name of the IndexedDB store
 */
const useUniversalStore = (storeName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Channel name consistent hona chahiye
  const channelName = `${storeName}_sync_channel`;

  // 1. Data load function
  const loadData = useCallback(async () => {
    try {
      // setLoading(true); // Optional: Agar UI flicker kare to isay comment out rakho
      const storedItems = await getItems(storeName);
      // Sirf tab update karo agar data actually change hua ho (Simple check)
      setData(storedItems || []);
    } catch (error) {
      console.error(`Error loading ${storeName}:`, error);
    } finally {
      setLoading(false);
    }
  }, [storeName]);

  // 2. Sync Listener (THE CRITICAL PART)
  useEffect(() => {
    // Initial Load
    loadData();

    // Channel Open Karo
    const channel = new BroadcastChannel(channelName);

    // Message Suno
    channel.onmessage = (event) => {
      if (event.data === 'update') {
        // console.log(`🔄 Sync Triggered for: ${storeName}`); // Debugging ke liye
        loadData();
      }
    };

    // CLEANUP (Ye line hatayi to App Crash karegi long run mein)
    return () => {
      channel.close();
    };
  }, [loadData, channelName]);

  // 3. Sender Helper
  const notifyTabs = () => {
    // Sender instance alag hota hai, isay khol ke message bhej ke band karna safe hai
    const channel = new BroadcastChannel(channelName);
    channel.postMessage('update');
    channel.close();
  };

  // --- ACTIONS ---

  const add = async (newItem) => {
    // Optimistic Update (Foran UI update)
    setData((prev) => [...prev, newItem]); 
    
    await addItem(storeName, newItem);
    notifyTabs(); // Sabko batao
  };

  const edit = async (id, updatedItem) => {
    const itemWithId = { ...updatedItem, id };
    
    setData((prev) => 
      prev.map((item) => (item.id === id ? itemWithId : item))
    );

    await putItem(storeName, itemWithId);
    notifyTabs();
  };

  const remove = async (id) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    await deleteFromDB(storeName, id);
    notifyTabs();
  };

  return {
    data,
    loading,
    add,
    edit,
    remove,
    refreshData: loadData
  };
};

export default useUniversalStore;


