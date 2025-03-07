import { openDB } from 'idb';
import { ref, remove } from 'firebase/database';
import { clientDatabase } from './ClientFirebaseDb';

const DB_NAME = 'pos-system';
const DB_VERSION = 4;

export const STORE_NAMES = {
  cost: 'cost',
  company: 'company',
  brands: 'brands',
  products: 'products',
  purchases: 'purchases',
  sales: 'sales',
  units: 'units',
  suppliers: 'suppliers',
  customers: 'customers',
  settings: 'settings',
  creditManagement: 'creditManagement',
  notifications: 'notifications',
  notificationsDb: 'notificationsDb',
};

export const DELETED_ITEMS_STORE = 'deletedItems';

export const getDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      Object.values(STORE_NAMES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
      if (!db.objectStoreNames.contains(DELETED_ITEMS_STORE)) {
        db.createObjectStore(DELETED_ITEMS_STORE, { keyPath: 'id' });
      }
    },
  });
};

export const addItem = async (storeName, item) => {
  const db = await getDB();
  return db.add(storeName, item);
};

export const putItem = async (storeName, item) => {
  const db = await getDB();
  return db.put(storeName, item);
};

export const getItems = async (storeName) => {
  const db = await getDB();
  return db.getAll(storeName);
};

export const deleteItem = async (storeName, id) => {
  const db = await getDB();
  return db.delete(storeName, id);
};

export const setItems = async (storeName, items) => {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');

  try {
    for (const item of items) {
      await tx.store.put(item);
    }
    await tx.done;
    return Promise.resolve(); // Return a resolved promise on success
  } catch (error) {
    console.error('Error setting items:', error);
    return Promise.reject(error); // Return a rejected promise on error
  }
};

export const addDeletedItem = async (storeName, id) => {
  const db = await getDB();
  return db.put(DELETED_ITEMS_STORE, { storeName, id });
};

export const deleteAndTrackItem = async (storeName, id) => {
  try {
    await deleteItem(storeName, id);
    await addDeletedItem(storeName, id);
    console.log(`Item with ID ${id} deleted from IndexedDB and tracked for Firebase deletion.`);
    return Promise.resolve(); // Return a resolved promise on success
  } catch (error) {
    console.error('Error deleting and tracking item:', error);
    return Promise.reject(error); // Return a rejected promise on error
  }
};

export const clearOfflineData = async (storeName) => {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const objectStore = tx.store;
  await objectStore.clear();
  await tx.done;
  return Promise.resolve(); // Return a resolved promise on success
};

export const deleteItemsFromFirebase = async () => {
    try {
        const db = await getDB();
        const deletedItems = await db.getAll(DELETED_ITEMS_STORE);

        for (const { storeName, id } of deletedItems) {
            const itemRef = ref(clientDatabase, `${storeName}/${id}`);
            try {
                await remove(itemRef);
                console.log(`Deleted item with ID ${id} from Firebase in store ${storeName}.`);
                await deleteItem(DELETED_ITEMS_STORE, id);
                console.log(`Removed item with ID ${id} from deletedItems store.`);
            } catch (error) {
                console.error(`Failed to delete item with ID ${id} from Firebase:`, error);
            }
        }
        console.log('All marked items processed for deletion from Firebase.');
        return Promise.resolve();
    } catch (error) {
        console.error("Error in deleteItemsFromFirebase :", error);
        return Promise.reject(error);
    }
};