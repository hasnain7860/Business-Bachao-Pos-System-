import { openDB } from 'idb';

const DB_NAME = 'pos-system';
const DB_VERSION = 1;

// Define object store names
export const STORE_NAMES = {
  company: 'company',
  brands: 'brands',
  products: 'products',
  purchases: 'purchases',
  units: 'units',
  suppliers: 'suppliers',
  customers: 'customers',
};

// Initialize and upgrade the database
export const getDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      Object.values(STORE_NAMES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      });
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