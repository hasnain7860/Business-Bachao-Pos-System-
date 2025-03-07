import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addItem, getItems, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useSettingsContext = () => {
  const [settings, setSettings] = useState([]); // All settings
  const [selectedSetting, setSelectedSetting] = useState(null); // Currently selected setting
  
  const refreshData = async () => {
    const updatedData = await getItems(STORE_NAMES.settings);
    setSettings( updatedData );
    setSelectedSetting( updatedData [0] || null);
  };

  // 🟢 Load settings on first render
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



  // 🟢 Edit Setting (Fixing Update Issue)
  const editSetting = useCallback(async (id, updatedSetting) => {
    try {
      await putItem(STORE_NAMES.settings, { ...updatedSetting, id });

      setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedSetting } : s)));

      setSelectedSetting((prev) =>
        prev && prev.id === id ? { ...prev, ...updatedSetting } : prev
      );

    
    } catch (error) {
      console.error("❌ Failed to edit setting:", error);
    }
  }, []);

  // 🟢 Add or Update Setting (with UUID for first-time entry)
  const saveSetting = useCallback(async (newSetting) => {
    console.log("saveSetting called with:", newSetting); // Add this log
    try {
      const existingSettings = await getItems(STORE_NAMES.settings);
      console.log("Existing settings:", existingSettings); // Add this log
  
      if (existingSettings.length > 0) {
        console.log("Updating existing setting"); // Add this log
        const updatedSetting = await editSetting(existingSettings[0].id, newSetting);
        console.log("Setting updated:", updatedSetting); // Add this log
        return { ...existingSettings[0], ...newSetting };
      } else {
        console.log("Adding new setting"); // Add this log
        const settingWithId = { ...newSetting, id: uuidv4() };
        const addedSetting = await addItem(STORE_NAMES.settings, settingWithId);
        console.log("Setting added:", addedSetting); // Add this log
        setSettings([settingWithId]);
        setSelectedSetting(settingWithId);
        return settingWithId;
      }
    } catch (error) {
      console.error("❌ Failed to save setting:", error);
      console.log("saveSetting returning rejected promise"); //add this log
      return Promise.reject(error);
    }
  }, [editSetting]);

  return {
    settings,
    selectedSetting,
    saveSetting,
    editSetting,
    refreshData
  };
};

export default useSettingsContext;
