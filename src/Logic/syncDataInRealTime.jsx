
import { ref, onValue, remove } from "firebase/database";
import { setItems, getItems,STORE_NAMES, DELETED_ITEMS_STORE, getDB } from "../Utils/IndexedDb.jsx";
import { clientDatabase } from "../Utils/ClientFirebaseDb.jsx";

export const syncDataInRealTime = async () => {
  try {


    // Then, synchronize real-time data from Firebase to IndexedDB
    for (const storeName of Object.values(STORE_NAMES)) {
      const dbRef = ref(clientDatabase, storeName);

      onValue(dbRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log(`Real-time data for ${storeName}:`, data);

          // Store data in IndexedDB
          await setItems(storeName, Object.values(data)); // Assuming setItems can take an array of items
        } else {
          console.log(`No data found for ${storeName} in Firebase.`);
        }
      });
    }
  } catch (error) {
    console.error("Error in real-time data synchronization:", error);
  }
};


