import { useState, useEffect, useCallback } from 'react';
import { getItems, addItem, putItem, deleteItem as deleteFromDB } from '../Utils/IndexedDb.jsx';
import { v4 as uuidv4 } from 'uuid';
/**
 * Universal Hook for CRUD + Live Sync
 * @param {string} storeName - The name of the IndexedDB store
 */
const useUniversalStore = (storeName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Channel name consistent across tabs
  const channelName = `${storeName}_sync_channel`;

  // 1. Data load function
  const loadData = useCallback(async () => {
    try {
      const storedItems = await getItems(storeName);
      setData(storedItems || []);
    } catch (error) {
      console.error(`Error loading ${storeName}:`, error);
    } finally {
      setLoading(false);
    }
  }, [storeName]);

  // 2. Sync Listener
  useEffect(() => {
    loadData();
    const channel = new BroadcastChannel(channelName);
    channel.onmessage = (event) => {
      if (event.data === 'update') {
        loadData();
      }
    };
    return () => channel.close();
  }, [loadData, channelName]);

  // 3. Sender Helper
  const notifyTabs = () => {
    const channel = new BroadcastChannel(channelName);
    channel.postMessage('update');
    channel.close();
  };

  // --- ACTIONS ---

  const add = async (newItem) => {
    // BRUTAL FIX: Never allow an item without an ID into the state.
    // If the DB generates IDs, Optimistic UI fails because we don't know the ID yet.
    // We generate a client-side ID (timestamp + random) to guarantee uniqueness.
    const id = newItem.id || uuidv4();
    const itemWithId = { ...newItem, id };

    // Optimistic Update: Now safe because we have an ID
    setData((prev) => [...prev, itemWithId]); 
    
    try {
      await addItem(storeName, itemWithId);
      notifyTabs();
    } catch (error) {
      console.error(`Failed to add to ${storeName}`, error);
      // Revert optimistic update on failure if necessary (advanced handling)
      loadData(); 
    }
  };

  const edit = async (id, updatedItem) => {
    if (!id) {
      console.error("Cannot edit item without an ID");
      return;
    }

    const itemWithId = { ...updatedItem, id };
    
    setData((prev) => 
      prev.map((item) => (item.id === id ? itemWithId : item))
    );

    try {
      await putItem(storeName, itemWithId);
      notifyTabs();
    } catch (error) {
       console.error(`Failed to edit ${storeName}`, error);
       loadData();
    }
  };

  const remove = async (id) => {
    if (!id) return;
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

