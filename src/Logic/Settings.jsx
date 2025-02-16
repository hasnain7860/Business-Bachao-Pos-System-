import { useState, useEffect, useCallback } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteAndTrackItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useSettingsContext = () => {
  const [settings, setSettings] = useState([]);
  const [selectedSetting, setSelectedSetting] = useState(null);

  const loadSettings = useCallback(async () => {
    try {
      const storedSettings = await getItems(STORE_NAMES.settings);
      setSettings(storedSettings);
      setSelectedSetting(storedSettings[0] || null);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const refreshData = useCallback(async () => {
    const updatedData = await getItems(STORE_NAMES.settings);
    setSettings(updatedData);
  }, []);

  const addSetting = useCallback(async (newSetting) => {
    try {
      await addItem(STORE_NAMES.settings, newSetting);
      setSettings((prev) => [...prev, newSetting]);
    
    } catch (error) {
      console.error("Failed to add setting:", error);
    }
  }, []);

  const editSetting = useCallback(async (id, updatedSetting) => {
    try {
      await putItem(STORE_NAMES.settings, { ...updatedSetting, id });
      setSettings((prev) => updateItem(prev, id, updatedSetting));
      if (selectedSetting?.id === id) setSelectedSetting({ ...updatedSetting, id });
    } catch (error) {
      console.error("Failed to edit setting:", error);
    }
  }, [selectedSetting]);

  const deleteSetting = useCallback(async (id) => {
    try {
      await deleteFromDB(STORE_NAMES.settings, id);
      setSettings((prev) => deleteItem(prev, id));
      if (selectedSetting?.id === id) setSelectedSetting(null);
    } catch (error) {
      console.error("Failed to delete setting:", error);
    }
  }, [selectedSetting]);

  const select = useCallback((id) => {
    const setting = settings.find((s) => s.id === id);
    setSelectedSetting(setting || null);
  }, [settings]);

  return {
    settings,
    selectedSetting,
    add: addSetting,
    edit: editSetting,
    delete: deleteSetting,
    select,
    refreshData
  };
};

export default useSettingsContext;