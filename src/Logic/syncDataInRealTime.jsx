import { ref, get } from "firebase/database"; // Import 'get' instead of 'onValue'
import { setItems, STORE_NAMES, clearOfflineData } from "../Utils/IndexedDb.jsx";
import { clientDatabase } from "../Utils/ClientFirebaseDb.jsx";
import refreshData from "../Utils/refreshData.jsx";

export const syncDataInRealTime = async (context) => {
  try {
    for (const storeName of Object.values(STORE_NAMES)) {
      const dbRef = ref(clientDatabase, storeName);

      try {
        const snapshot = await get(dbRef); // Use 'get' to fetch data once

        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log(`Data fetched once for ${storeName}:`, data);

          await clearOfflineData(storeName);
          await setItems(storeName, Object.values(data));
          refreshData(context);
        } else {
          console.log(`No data found for ${storeName} in Firebase.`);
        }
      } catch (error) {
        console.error(`Error fetching data for ${storeName}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in one-time data synchronization:", error);
  }
};