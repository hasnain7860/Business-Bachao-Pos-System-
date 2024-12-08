
import { ref, set } from "firebase/database"; 
import { getDB, getItems, STORE_NAMES } from "../Utils/IndexedDb.jsx"; // IndexedDB functions and store names
import { clientDatabase } from "../Utils/ClientFirebaseDb.jsx"; // Firebase initialization

const handleDataSync = async () => {
  try {
    const db = await getDB(); // IndexedDB کو حاصل کریں
    console.log("Database:", db);

    // Loop through all store names
    for (const storeName of Object.values(STORE_NAMES)) {
      const items = await getItems(storeName); // ہر اسٹور سے تمام اشیاء حاصل کریں
      console.log(`Items from ${storeName}:`, items);

      // Firebase میں ڈیٹا کی ہم وقت سازی
      const dbRef = ref(clientDatabase, storeName); // Firebase میں راستہ
      console.log(`Database reference for ${storeName}:`, dbRef);

      // تمام اشیاء کو Firebase میں سیٹ کریں
      for (const item of items) {
        console.log("Processing item:", item);

        if (!item.id) {
          console.error("Item is missing an ID:", item);
          continue; // اگر ID نہیں ہے تو اس آئٹم کو اسکپ کریں
        }

        // Validate item properties
        const validatedItem = Object.keys(item).reduce((acc, key) => {
          if (item[key] !== undefined) { // Only include defined properties
            acc[key] = item[key];
          } else {
            console.warn(`Item ${item.id} is missing property ${key}, skipping it.`);
          }
          return acc;
        }, {});

        if (Object.keys(validatedItem).length === 0) {
          console.error(`No valid properties found for item ${item.id}, skipping.`);
          continue;
        }

        const itemRef = ref(clientDatabase, `${storeName}/${item.id.toString()}`);
        console.log("Item reference:", itemRef);

        await set(itemRef, validatedItem); // آئٹم کو Firebase میں سیٹ کریں
      }

      console.log(`All items from ${storeName} synchronized successfully!`);
    }
  } catch (error) {
    console.error("Error syncing data:", error);
  }
};

export default handleDataSync;
