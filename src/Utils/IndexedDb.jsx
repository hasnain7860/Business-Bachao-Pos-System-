import { openDB } from 'idb';
import { ref, update, set, get,query , push, remove,onChildChanged, onChildRemoved, onChildAdded  } from 'firebase/database'; 
import { clientDatabase } from './ClientFirebaseDb';
import refreshData from "./refreshData"

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

export const getDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      Object.values(STORE_NAMES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    },
  });
};

export const addItem = async (storeName, item) => {
  const db = await getDB();
  const existingItem = await db.get(storeName, item.id);

  if (!existingItem) {
    await db.add(storeName, item);
    console.log(`Item with ID ${item.id} add in IndexedDB for store ${storeName}.`);
    if (clientDatabase) {
      const itemRef = ref(clientDatabase, `${storeName}/${item.id}`);
      await set(itemRef, item);
      console.log(`Item with ID ${item.id} add in firebase for store ${storeName}.`);
    }
  } else {
    console.log(`Item with ID ${item.id} already exists in IndexedDB for store ${storeName}.`);
  }
};

export const putItem = async (storeName, item) => {
  const db = await getDB();
  await db.put(storeName, item);

  if (clientDatabase) {
    const itemRef = ref(clientDatabase, `${storeName}/${item.id}`);
    await set(itemRef, item);
  }
};

export const getItems = async (storeName) => {
  const db = await getDB();
  return db.getAll(storeName);
};

export const deleteItem = async (storeName, id) => { 
  try {
    const db = await getDB();
    await db.delete(storeName, id);
    if (clientDatabase) {
      const itemRef = ref(clientDatabase, `${storeName}/${id}`);
      await remove(itemRef);
    }
  } catch (error) {
    console.error(`Error deleting item with ID ${id}:`, error);
  }
};

export const setItems = async (storeName, items) => {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');

  try {
    for (const item of items) {
      await tx.store.put(item);
    }
    await tx.done;
    return Promise.resolve();
  } catch (error) {
    console.error('Error setting items:', error);
    return Promise.reject(error);
  }
};

export const clearOfflineData = async (storeName) => {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const objectStore = tx.store;
  await objectStore.clear();
  await tx.done;
  return Promise.resolve();
};

export const listenForChanges = (storeName, context) => {
  if (clientDatabase) {
    const itemsRef = ref(clientDatabase, storeName);

    onChildAdded(itemsRef, (snapshot) => {
      const addedItem = snapshot.val();
      console.log(`Item with ID ${snapshot.key} added to Firebase in store ${storeName}.`);
      addItem(storeName, addedItem).then(() => {
        refreshData(context);
      });
    });

    onChildChanged(itemsRef, (snapshot) => {
      const updatedItem = snapshot.val();
      console.log(`Item with ID ${snapshot.key} updated in Firebase in store ${storeName}.`);
      putItem(storeName, updatedItem).then(() => {
        refreshData(context);
      });
    });

    onChildRemoved(itemsRef, (snapshot) => {
      const deletedItemId = snapshot.key;
      console.log(`Item with ID ${deletedItemId} deleted from Firebase in store ${storeName}.`);
      deleteItem(storeName, deletedItemId, context).then(()=>{
        refreshData(context);
      });
    });
  }
};