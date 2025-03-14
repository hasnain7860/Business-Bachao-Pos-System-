import { openDB } from 'idb';
import { ref, update, set, get,query , push, remove,onChildChanged,orderByChild,startAt, onChildRemoved, onChildAdded  } from 'firebase/database'; 
import { clientDatabase } from './ClientFirebaseDb';
import refreshData from "./refreshData"
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash.debounce';

const DB_NAME = 'pos-system';
const DB_VERSION = 6;

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

export const LOCAL_STORE = {
  pendingQuery: 'pendingQuery',
  syncTimes: 'syncTimes',
}

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
      Object.values(LOCAL_STORE).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    },
  });
};

export const addItem = async (storeName, item, firebaseEvent = false) => {
  const db = await getDB();
  const existingItem = await db.get(storeName, item.id);
  const timestamp = Date.now(); // ✅ ٹائم اسٹیمپ حاصل کرو

  if (!existingItem) {
    // ✅ `updatedAt` فیلڈ شامل کرو
    const newItem = { ...item, updatedAt: timestamp };

    await db.add(storeName, newItem);
    console.log(`Item with ID ${item.id} added in IndexedDB for store ${storeName}.`);

    if (!firebaseEvent) {
      await addPendingQuery(storeName, newItem, 'add');
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
  await db.add("pendingQuery", pendingQuery);
  console.log(`Pending query for ${action} item to pending query store.`);
};

export const putItem = async (storeName, item , firebaseEvent = false ) => {
  const db = await getDB();
  const timestamp = Date.now(); 
  const updatedItem = { ...item, updatedAt: timestamp };
  await db.put(storeName, updatedItem);
  if(!firebaseEvent){
    await addPendingQuery(storeName,updatedItem,'update')
  }
  
};

export const updateAllStoresWithTimestamp = async () => {
  const stores = {
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
      creditManagement: 'creditManagement'
  };

  for (const storeName of Object.values(stores)) {
      try {
          const items = await getItems(storeName);
          
          for (const item of items) {
              item.updatedAt = Date.now(); // ٹائم اسٹیمپ شامل کریں
              await putItem(storeName, item);
          }

          console.log(`Updated ${items.length} items in store: ${storeName}`);
      } catch (error) {
          console.error(`Error updating store ${storeName}:`, error);
      }
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
    console.error('Error sets items:', error);
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

export const getLastSyncTime = async (storeName) => {
  const db = await getDB();
  const allSyncTimes = await db.getAll("syncTimes");

  // مطلوبہ اسٹور کے لیے آخری Sync وقت تلاش کرو
  const storeSync = allSyncTimes.find(sync => sync.storeName === storeName);
  
  return storeSync ? storeSync.timestamp : 0;
};

export const setLastSyncTime = async (storeName, timestamp) => {
  const db = await getDB();
  const allSyncTimes = await db.getAll("syncTimes");

  // پہلے سے موجود اسٹور تلاش کرو
  const existingSync = allSyncTimes.find(sync => sync.storeName === storeName);

  if (existingSync) {
    // اگر موجود ہے تو بس timestamp اپڈیٹ کرو
    existingSync.timestamp = timestamp;
    await db.put("syncTimes", existingSync);
   
    console.log(`Sync time updated for existing store ${storeName}: ${timestamp}`);
  } else {
    // اگر موجود نہیں تو نیا ایڈ کرو
    const addLastSyncTime = {
      id: uuidv4(),
      storeName: storeName,
      timestamp: timestamp,
    };
    await db.put("syncTimes", addLastSyncTime);

    console.log(`New sync time added for store ${storeName}: ${timestamp}`);
  }
};

export const listenForChanges = async (storeName, context) => {
  if (!clientDatabase) return;

  const itemsRef = ref(clientDatabase, storeName);

  // IndexedDB سے آخری Sync کا وقت حاصل کرو
  
const lastSyncTime = await getLastSyncTime(storeName);

if(lastSyncTime === 0){
const snapshot = await get(itemsRef);
  if (snapshot.exists()) {
    const allData = snapshot.val();
    const timestamp = Date.now();

    // 🔹 تمام آئٹمز میں updatedAt شامل کریں
    const itemsArray = Object.keys(allData).map(key => ({
      id: key,
      ...allData[key],
      updatedAt: allData[key].updatedAt || timestamp
    }));

    // 🔹 ایک ساتھ IndexedDB میں سیٹ کریں
    await setItems(storeName, itemsArray);

    // 🔹 Sync time اپڈیٹ کریں
    await setLastSyncTime(storeName, timestamp);
    getDebouncedRefresh(storeName)(context, storeName);
  }

}

const lastSyncUpdateTime = await getLastSyncTime(storeName);

console.log('update last sync time and store' + storeName + lastSyncUpdateTime)
  // Firebase سے صرف وہی ڈیٹا لو جو آخری Sync کے بعد اپڈیٹ ہوا ہو
  const queryRef = query(itemsRef, orderByChild("updatedAt"), startAt(lastSyncUpdateTime || 0));

  onChildAdded(queryRef, async (snapshot) => {
    const addedItem = { id: snapshot.id, ...snapshot.val() };
    console.log(`New item added in store ${storeName}:`, addedItem);

    await addItem(storeName, addedItem, true);
    await setLastSyncTime(storeName, Date.now()); // Sync ٹائم اپڈیٹ کرو
    getDebouncedRefresh(storeName)(context, storeName);
  });

  onChildChanged(queryRef, async (snapshot) => {
    const updatedItem = { id: snapshot.key, ...snapshot.val() };
    console.log(`Item updated in store ${storeName}:`, updatedItem);

    await putItem(storeName, updatedItem, true);
    await setLastSyncTime(storeName, Date.now()); // Sync ٹائم اپڈیٹ کرو
    getDebouncedRefresh(storeName)(context, storeName);
  });

  onChildRemoved(itemsRef, async (snapshot) => {
    const deletedItemId = snapshot.key;
    console.log(`Item deleted from store ${storeName}: ${deletedItemId}`);

    await deleteItem(storeName, deletedItemId, true);
    getDebouncedRefresh(storeName)(context, storeName);
  });
};
