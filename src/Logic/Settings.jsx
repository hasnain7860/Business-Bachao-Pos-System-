import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteAndTrackItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useSettingsContext = () => {
  const [settings, setSettings] = useState([]);
  const [selectedSetting, setSelectedSetting] = useState(null);

  // Load Settings from IndexedDB when the component mounts
  useEffect(() => {
    const loadSettings = async () => {
      const storedSettings = await getItems(STORE_NAMES.settings);
      setSettings(storedSettings);
      // If loaded settings are available, set the first one as selected
      if (storedSettings.length > 0) {
        setSelectedSetting(storedSettings[0]);
      }
    };
    loadSettings();
  }, []);

  const addSetting = async (newSetting) => {
    await addItem(STORE_NAMES.settings, newSetting);
    setSettings((prev) => [...prev, { ...newSetting }]);
  };

  const editSetting = async (id, updatedSetting) => {
    await putItem(STORE_NAMES.settings, { ...updatedSetting, id });
    setSettings((prev) => updateItem(prev, id, updatedSetting));
    if (selectedSetting?.id === id) setSelectedSetting({ ...updatedSetting, id });
  };

  const deleteSetting = async (id) => {
    await deleteFromDB(STORE_NAMES.settings, id);
    setSettings((prev) => deleteItem(prev, id));
    if (selectedSetting?.id === id) setSelectedSetting(null);
  };

  const select = (id) => {
    const setting = settings.find((s) => s.id === id);
    setSelectedSetting(setting || null);
  };

  return {
    settings,
    selectedSetting,
    add: addSetting,
    edit: editSetting,
    delete: deleteSetting,
    select,
  };
};

export default useSettingsContext;