import { openDB } from 'idb';
import { ref, remove } from 'firebase/database'; // Import Firebase remove function
import { clientDatabase} from './ClientFirebaseDb'; // Adjust the import path as needed
const DB_NAME = 'pos-system';
const DB_VERSION = 1;

// Define object store names
export const STORE_NAMES = {
  company: 'company',
  brands: 'brands',
  products: 'products',
  purchases: 'purchases',
  sales: 'sales',
  units: 'units',
  suppliers: 'suppliers',
  customers: 'customers',
};

// Store name for tracking deleted items
export const DELETED_ITEMS_STORE = 'deletedItems';

// Initialize and upgrade the database
export const getDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      Object.values(STORE_NAMES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      });
      if (!db.objectStoreNames.contains(DELETED_ITEMS_STORE)) {
        db.createObjectStore(DELETED_ITEMS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

// Generic function to add an item to a store
export const addItem = async (storeName, item) => {
  const db = await getDB();
  await db.add(storeName, item);
};

// Use put for updating or adding
export const putItem = async (storeName, item) => {
  const db = await getDB();
  await db.put(storeName, item);
};

// Generic function to get all items from a store
export const getItems = async (storeName) => {
  const db = await getDB();
  return db.getAll(storeName);
};

// Generic function to delete an item by ID from a store
export const deleteItem = async (storeName, id) => {
  const db = await getDB();
  await db.delete(storeName, id);
};

// Function to set multiple items in a store
export const setItems = async (storeName, items) => {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');

  for (const item of items) {
    await tx.store.put(item);
  }

  await tx.done;
};

// Function to add a deleted item ID to the deletedItems store
export const addDeletedItem = async (storeName, id) => {
  const db = await getDB();
  await db.put(DELETED_ITEMS_STORE, { storeName, id });
};

// Function to delete an item and track its deletion
export const deleteAndTrackItem = async (storeName, id) => {
  try {
    // Delete from IndexedDB
    await deleteItem(storeName, id);

    // Track deletion
    await addDeletedItem(storeName, id);

    console.log(`Item with ID ${id} deleted from IndexedDB and tracked for Firebase deletion.`);
  } catch (error) {
    console.error("Error deleting and tracking item:", error);
  }
};





export const deleteItemsFromFirebase = async () => {
  const db = await getDB(); // Get the IndexedDB instance
  const deletedItems = await db.getAll(DELETED_ITEMS_STORE); // Retrieve all deleted items
  
  console.log(deletedItems)
await deleteItem(DELETED_ITEMS_STORE, 4);
  for (const { storeName, id } of deletedItems) {
    const itemRef = ref(clientDatabase, `${storeName}/${id}`); // Create reference to the Firebase item
    try {
      await remove(itemRef); // Delete the item from Firebase
      console.log(`Deleted item with ID ${id} from Firebase in store ${storeName}.`);
      
      // After successful deletion from Firebase, remove from the deletedItems store
      await deleteItem(DELETED_ITEMS_STORE, id);
      console.log(`Removed item with ID ${id} from deletedItems store.`);
    } catch (error) {
      console.error(`Failed to delete item with ID ${id} from Firebase:`, error);
    }
  }

  console.log('All marked items processed for deletion from Firebase.');
};