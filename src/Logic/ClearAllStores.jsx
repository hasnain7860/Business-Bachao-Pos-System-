import { getDB, STORE_NAMES,  } from '../Utils/IndexedDb.jsx'; // Adjust the import path as needed


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
};