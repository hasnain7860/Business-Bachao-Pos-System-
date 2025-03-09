import React, { useEffect ,useRef} from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { listenForChanges, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const Syncauto = () => {
  const context = useAppContext();
  const listenersAdded = useRef(false); // Track if listeners are added
  useEffect(() => {
    if (!listenersAdded.current) { // Check if listeners are already added
        Object.values(STORE_NAMES).forEach((store_name) => {
          listenForChanges(store_name, context);
        });
        listenersAdded.current = true; // Set flag to true after adding listeners
      }

    // Clean-up فنکشن (اختیاری):
    // اگر آپ کو لسنرز کو انماؤنٹ کرنے کی ضرورت ہے تو یہاں کوڈ شامل کریں۔
    // مثال کے طور پر، اگر `listenForChanges` کوئی ریٹرن ویلیو دیتا ہے جس سے لسنر کو انماؤنٹ کیا جا سکتا ہے۔
    
  },[]); // context کو ڈیپنڈینسی ایرے میں شامل کریں اگر context تبدیل ہوتا ہے تو آپ دوبارہ لسنر لگانا چاہتے ہیں۔

  return <div>Syncauto</div>;
};

export default Syncauto;