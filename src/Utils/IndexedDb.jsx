import { openDB } from 'idb';
import { ref, update, set, get, query, remove, onChildChanged, orderByChild, startAt, onChildRemoved, onChildAdded } from 'firebase/database'; 
import { clientDatabase } from './ClientFirebaseDb';
import { v4 as uuidv4 } from 'uuid';
import debounce from 'lodash.debounce';

const DB_NAME = 'pos-system';
const DB_VERSION = 18;

export const STORE_NAMES = {
  damage:'damage',
  cost: 'cost',
  company: 'company',
  areas:'areas',
  preorders:'preorders',
  products: 'products',
  purchases: 'purchases',
  sales: 'sales',
  units: 'units',
  people: 'people',
  suppliers: 'suppliers',
  customers: 'customers',
  settings: 'settings',
  creditManagement: 'creditManagement',
  sellReturns:'sellReturns',
  purchaseReturns:'purchaseReturns',
  notifications: 'notifications',
  notificationsDb: 'notificationsDb',
  deletedStore:'deletedStore'
};

export const LOCAL_STORE = {
  pendingQuery: 'pendingQuery',
  syncTimes: 'syncTimes',
}

// --- HELPER: DATA SANITIZER (THE FIX) ---
// Recursively removes undefined and null, replacing them with empty strings.
// This prevents Firebase crashes (undefined) and unintended deletions (null).
const cleanPayload = (data) => {
  if (data === undefined || data === null) {
    return "";
  }
  
  if (Array.isArray(data)) {
    return data.map(item => cleanPayload(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const cleaned = {};
    Object.keys(data).forEach(key => {
      cleaned[key] = cleanPayload(data[key]);
    });
    return cleaned;
  }
  
  return data;
};

// --- BROADCAST CHANNEL HELPER ---
const broadcastUpdate = debounce((storeName) => {
  const channelName = `${storeName}_sync_channel`;
  const channel = new BroadcastChannel(channelName);
  channel.postMessage('update');
  channel.close();
  console.log(`📢 Broadcast sent: ${storeName} updated.`);
}, 500);


// --- EXISTING UTILS ---

let isProcessing = false;

export const processPendingQueries = async () => {
  if (isProcessing) {
    console.log('Already processing pending queries. Skipping duplicate call.');
    return;
  }

  isProcessing = true;
  const db = await getDB();
  const allPendingQueries = await db.getAll('pendingQuery');

  if (allPendingQueries.length === 0) {
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
    
    // SAFETY CHECK: Ensure item ID exists, otherwise skip to prevent crash
    const itemId = item?.id || item; 
    if (!itemId) {
      console.error(`Invalid item in pending query ID: ${id}. Removing malformed query.`);
      await db.delete('pendingQuery', id);
      continue;
    }

    const itemRef = ref(clientDatabase, `${storeName}/${action === 'delete' ? itemId : itemId}`);

    try {
      if (action === 'add' || action === 'update') {
        // SANITIZE HERE: Before sending to Firebase to prevent stuck loop
        const validItem = cleanPayload(item);
        await set(itemRef, validItem);
      } else if (action === 'delete') {
        const deleteitem = {
          id: uuidv4(),
          storeName,
          deletedItemId: item,
          deletedAt: Date.now(),
        }
        // Sanitize delete record too, just in case
        const deleteItemRef = ref(clientDatabase, `deletedStore/${deleteitem.id}`);  
        await set(deleteItemRef, cleanPayload(deleteitem));
        await remove(itemRef);
      }

      await db.delete('pendingQuery', id);
      console.log(`Successfully processed ${action} action for store: ${storeName}`);
    } catch (error) {
      console.error(`Error processing ${action} for store: ${storeName}`, error);
      // Optional: If error is strictly about data format, you might want to delete the query
      // so the loop doesn't get stuck forever. But for network errors, keep it.
    }
  }

  isProcessing = false;
};

export const getDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      Object.values(STORE_NAMES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('id', 'id', { unique: true });
        }
      });
      Object.values(LOCAL_STORE).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('id', 'id', { unique: true });
        }
      });
    },
  });
};

export const addItem = async (storeName, item, firebaseEvent = false) => {
  const db = await getDB();
  
  // SANITIZE INPUT: Ensure no undefined/null gets into IndexedDB
  const cleanItem = cleanPayload(item);
  
  const existingItem = await db.get(storeName, cleanItem.id);
  const timestamp = Date.now();

  if (!existingItem) {
    const newItem = { ...cleanItem, updatedAt: timestamp, id: String(cleanItem.id) };
    await db.add(storeName, newItem);
    
    if (!firebaseEvent) {
      await addPendingQuery(storeName, newItem, 'add');
    }
  }
};

export const addPendingQuery = async (storeName, item, action) => {
  const db = await getDB();
  // SANITIZE INPUT: Double check before adding to queue
  const cleanItem = cleanPayload(item);

  const pendingQuery = {
    id: uuidv4(),
    storeName: storeName,
    item: cleanItem,
    action: action,
  };
  await db.add("pendingQuery", pendingQuery);
};

export const putItem = async (storeName, item, firebaseEvent = false) => {
  const db = await getDB();
  
  // SANITIZE INPUT: Ensure no undefined/null gets into IndexedDB during update
  const cleanItem = cleanPayload(item);
  
  const timestamp = Date.now(); 
  const updatedItem = { ...cleanItem, updatedAt: timestamp, id: String(cleanItem.id) };
  
  await db.put(storeName, updatedItem);
  
  if(!firebaseEvent){
    await addPendingQuery(storeName, updatedItem, 'update');
  }
};

export const getItems = async (storeName) => {
  const db = await getDB();
  return db.getAll(storeName);
};

export const deleteItem = async (storeName, id, firebaseEvent = false ) => { 
  try {
    const db = await getDB();
    await db.delete(storeName, String(id));
    if(!firebaseEvent){
      await addPendingQuery(storeName, id, 'delete');
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
      // SANITIZE INPUT: Clean data coming from bulk sets (e.g. initial sync)
      const cleanItem = cleanPayload(item);
      const fixedItem = { ...cleanItem, id: String(cleanItem.id) };
      await tx.store.put(fixedItem);
    }
    await tx.done;
    return Promise.resolve();
  } catch (error) {
    console.error('Error sets items:', error);
    return Promise.reject(error);
  }
};

export const getLastSyncTime = async (storeName) => {
  const db = await getDB();
  const allSyncTimes = await db.getAll("syncTimes");
  const storeSync = allSyncTimes.find(sync => sync.storeName === storeName);
  return storeSync ? storeSync.timestamp : 0;
};

export const setLastSyncTime = async (storeName, timestamp) => {
  const db = await getDB();
  const allSyncTimes = await db.getAll("syncTimes");
  const existingSync = allSyncTimes.find(sync => sync.storeName === storeName);

  if (existingSync) {
    existingSync.timestamp = timestamp;
    await db.put("syncTimes", existingSync);
  } else {
    const addLastSyncTime = {
      id: uuidv4(),
      storeName: storeName,
      timestamp: timestamp,
    };
    await db.put("syncTimes", addLastSyncTime);
  }
};

// --- LISTEN FOR CHANGES ---
export const listenForChanges = async (storeName) => {
  if (!clientDatabase) return;

  const itemsRef = ref(clientDatabase, storeName);
  const lastSyncTime = await getLastSyncTime(storeName);

  // Initial Sync if empty
  if (lastSyncTime === 0) {
    const snapshot = await get(itemsRef);
    if (snapshot.exists()) {
      const allData = snapshot.val();
      const timestamp = Date.now();
      
      const itemsArray = Object.keys(allData).map(key => ({
        id: key,
        ...cleanPayload(allData[key]), // Clean incoming data
        updatedAt: allData[key].updatedAt || timestamp,
      }));

      await setItems(storeName, itemsArray);
      await setLastSyncTime(storeName, timestamp);
      broadcastUpdate(storeName);
    }
  }

  const lastSyncUpdateTime = await getLastSyncTime(storeName);
  const queryRef = query(itemsRef, orderByChild("updatedAt"), startAt(lastSyncUpdateTime || 0));

  onChildAdded(queryRef, async (snapshot) => {
    const val = cleanPayload(snapshot.val()); // Clean incoming data
    const addedItem = { id: snapshot.key, ...val };
    
    if(storeName === 'deletedStore'){
      await deleteItem(addedItem.storeName, addedItem.deletedItemId, true);
      broadcastUpdate(addedItem.storeName);
    } else {
      await addItem(storeName, addedItem, true);
      await setLastSyncTime(storeName, Date.now());
      broadcastUpdate(storeName);
    }
  });

  onChildChanged(queryRef, async (snapshot) => {
    const val = cleanPayload(snapshot.val()); // Clean incoming data
    const updatedItem = { id: snapshot.key, ...val };
    await putItem(storeName, updatedItem, true);
    await setLastSyncTime(storeName, Date.now());
    broadcastUpdate(storeName);
  });

  onChildRemoved(itemsRef, async (snapshot) => {
    const deletedItemId = snapshot.key;
    await deleteItem(storeName, deletedItemId, true);
    broadcastUpdate(storeName);
  });
};