import { openDB } from 'idb';
import { ref, update, set, get,query , push, remove,onChildChanged, onChildRemoved, onChildAdded  } from 'firebase/database'; 
import { clientDatabase } from './ClientFirebaseDb';
import refreshData from "./refreshData"
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash.debounce';

const DB_NAME = 'pos-system';
const DB_VERSION = 5;

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

const PENDING_QUEREY_STORE ='pendingQuery'

let isProcessing = false; // Flag to prevent duplicate calls

export const processPendingQueries = async () => {
  if (isProcessing) {
    console.log('Already processing pending queries. Skipping duplicate call.');
    return;
  }

  isProcessing = true; // Set flag to prevent duplicate calls

  const db = await getDB();
  const allPendingQueries = await db.getAll('pendingQuery');
 console.log(allPendingQueries)
  if (allPendingQueries.length === 0) {
    console.log('No pending queries to process.');
    isProcessing = false;
    return;
  }

  if (!navigator.onLine) {
    console.log('No internet connection. Pending queries will be processed later.');
    isProcessing = false;
    return;
  }

  console.log(`Processing ${allPendingQueries.length} pending queries...`);

  for (const query of allPendingQueries) {
    const { id, storeName, item, action } = query;
    const itemRef = ref(clientDatabase, `${storeName}/${action === 'delete' ? item : item.id}`);

    try {
      if (action === 'add' || action === 'update') {
        await set(itemRef, item); // Add or update item in Firebase
      } else if (action === 'delete') {
        await remove(itemRef); // Delete item from Firebase
      }

      await db.delete('pendingQuery', id); // Remove from IndexedDB after successful upload
      console.log(`Successfully processed ${action} action for store: ${storeName}, ID: ${action === 'delete' ? item : item.id}`);
    } catch (error) {
      console.error(`Error processing ${action} for store: ${storeName}, ID: ${action === 'delete' ? item : item.id}`, error);
    }
  }

  isProcessing = false; // Reset flag after processing
};
export const getDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      Object.values(STORE_NAMES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
      if (!db.objectStoreNames.contains(PENDING_QUEREY_STORE)) {
          db.createObjectStore(PENDING_QUEREY_STORE, { keyPath: 'id' });
      }
    },
  });
};

export const addItem = async (storeName, item , firebaseEvent = false) => {
  const db = await getDB();
  const existingItem = await db.get(storeName, item.id);

  if (!existingItem) {
    await db.add(storeName, item);
    console.log(`Item with ID ${item.id} add in IndexedDB for store ${storeName}.`);
    if(!firebaseEvent){
   await addPendingQuery(storeName,item,'add')
  }
  } else {
    console.log(`Item with ID ${item.id} already exists in IndexedDB for store ${storeName}.`);
  }
};


export const addPendingQuery = async (storeName, item, action) => {
  const db = await getDB();
  const pendingQuery = {
    id: uuidv4(),
    storeName: storeName,
    item: item,
    action: action,
  };
  await db.add(PENDING_QUEREY_STORE, pendingQuery);
  console.log(`Pending query for ${action} item to pending query store.`);
};

export const putItem = async (storeName, item , firebaseEvent = false ) => {
  const db = await getDB();
  await db.put(storeName, item);
  if(!firebaseEvent){
    await addPendingQuery(storeName,item,'update')
  }
  
};

export const getItems = async (storeName) => {
  const db = await getDB();
  return db.getAll(storeName);
};

export const deleteItem = async (storeName, id, firebaseEvent = false ) => { 
  try {
    const db = await getDB();
    await db.delete(storeName, id);
      if(!firebaseEvent){
    await addPendingQuery(storeName,id,'delete')
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


const storeDebounceMap = {};

const getDebouncedRefresh = (storeName) => {
  if (!storeDebounceMap[storeName]) {
    storeDebounceMap[storeName] = debounce((context, storeName) => {
      refreshData(context, storeName);
    }, 500);
  }
  return storeDebounceMap[storeName];
};

export const listenForChanges = (storeName, context) => {
  if (clientDatabase) {
    const itemsRef = ref(clientDatabase, storeName);

    onChildAdded(itemsRef, (snapshot) => {
      const addedItem = { id: snapshot.key, ...snapshot.val() };
      console.log(`Item with ID ${snapshot.key} added to Firebase in store ${storeName}.`);
      addItem(storeName, addedItem, true).then(() => {
        getDebouncedRefresh(storeName)(context, storeName);
      });
    });

    onChildChanged(itemsRef, (snapshot) => {
      const updatedItem = { id: snapshot.key, ...snapshot.val() };
      console.log(`Item with ID ${snapshot.key} updated in Firebase in store ${storeName}.`);
      putItem(storeName, updatedItem, true).then(() => {
        getDebouncedRefresh(storeName)(context, storeName);
      });
    });

    onChildRemoved(itemsRef, (snapshot) => {
      const deletedItemId = snapshot.key;
      console.log(`Item with ID ${deletedItemId} deleted from Firebase in store ${storeName}.`);
      deleteItem(storeName, deletedItemId, true).then(() => {
        getDebouncedRefresh(storeName)(context, storeName);
      });
    });
  }
};