import { ref, onValue } from "firebase/database";
import { setItems ,STORE_NAMES } from "../Utils/IndexedDb.jsx"; // Function to store data in IndexedDB
import { clientDatabase } from "../Utils/ClientFirebaseDb.jsx"; // Firebase initialization

export const syncDataInRealTime = () => {
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
};

