import { getDB, STORE_NAMES, LOCAL_STORE } from '../Utils/IndexedDb.jsx'; // Adjust the import path as needed
// Function to clear multiple stores in IndexedDB
export const clearAllStores = async () => {
  const db = await getDB(); // Get the IndexedDB instance
  const storeNames = Object.values(STORE_NAMES); // Get all store names

  for (const storeName of storeNames) {
    const tx = db.transaction(storeName, 'readwrite'); // Start a transaction for the store
    await tx.store.clear(); // Clear all items from the store
    await tx.done; // Wait for the transaction to complete
    console.log(`Cleared all items from ${storeName} store.`);
  }
  const storeNames1 = Object.values(LOCAL_STORE)
  for (const storeName1 of storeNames1) {
    
    const tx = db.transaction(storeName1, 'readwrite'); // Start a transaction for the store
    await tx.store.clear(); // Clear all items from the store
    await tx.done;
    
    console.log(`Cleared all items from ${storeName1} store.`);
    
  }
  
  
  
};