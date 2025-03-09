import { ref, onChildRemoved } from 'firebase/database';
import { clientDatabase } from './ClientFirebaseDb';
import { deleteItem } from './IndexedDb'; // Import your deleteItem function

// Function to listen for deleted items
export const listenForDeletedItems = (storeName) => {
  if (clientDatabase) {
    const itemsRef = ref(clientDatabase, storeName);
    onChildRemoved(itemsRef, (snapshot) => {
      const deletedItemId = snapshot.key;
      console.log(`Item with ID ${deletedItemId} deleted from Firebase in store ${storeName}.`);
      deleteItem(storeName, deletedItemId); // Delete item from IndexedDB
    });
  }
};

// Call this function for each store you want to listen to
Object.values(STORE_NAMES).forEach((storeName) => {
  listenForDeletedItems(storeName);
});