import React, { useState, useEffect } from "react";
import { useAppContext } from '../../Appfullcontext.jsx';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../../assets/languageData.json";

const PEOPLE_CODE_KEY = "nextPeopleCode"; 

const PeopleFormModal = ({ 
  isVisible, 
  onClose, 
  onSuccess, 
  initialData 
}) => {
  
  const context = useAppContext();
  const { peopleContext, areasContext, language, settingContext } = context;
  
  // --- CRITICAL FIX: Universal Store Mapping ---
  // Pehle ye direct functions thay, ab ye store object hain
  const { add: addPerson, edit: editPerson } = peopleContext;
  
  // Area Context ab { data: [...] } hai, direct array nahi
  const { data: areas } = areasContext; 

  // Setting Context ab raw CRUD hai. Hamein logic yahan handle karni padegi.
  const { data: settingsData, add: addSetting, edit: editSetting } = settingContext;
  const selectedSetting = settingsData[0] || {}; // Assume first item is the setting

  // Wrapper helper to handle settings update
  const saveSetting = async (newSettings) => {
    if (selectedSetting.id) {
      await editSetting(selectedSetting.id, newSettings);
    } else {
      await addSetting(newSettings);
    }
  };

  const isCodeSystemActive = selectedSetting.peopleAllcode === true;
  const nextCode = Number(selectedSetting[PEOPLE_CODE_KEY]) || 1000;

  // Initial State
  const defaultState = {
    id: null,
    name: "",
    email: "",
    phone: "",
    address: "",
    image: null,
    areaId: "", 
    code: null, 
  };

  const [formData, setFormData] = useState(defaultState);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setFormData({
            ...initialData,
            areaId: initialData.areaId || "",
            code: initialData.code || null
        });
      } else {
        setFormData(defaultState);
      }
      setError(""); 
    }
  }, [isVisible, initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelection = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        setError("Image size is too large. Max 2MB allowed.");
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) { setError("Name is required."); return; }
    if (!formData.phone.trim()) { setError("Phone is required."); return; }

    try {
        let finalData = { ...formData };
        const isEditMode = !!initialData;

        if (isEditMode) {
            await editPerson(formData.id, formData);
        } else {
            // New Entry Logic
            finalData.id = uuidv4();

            if (isCodeSystemActive) {
                const currentNextCode = nextCode; 
                finalData.code = currentNextCode; 

                // Optimistic UI update for settings
                const updatedCodeSetting = {
                    ...selectedSetting,
                    [PEOPLE_CODE_KEY]: currentNextCode + 1,
                };
                await saveSetting(updatedCodeSetting);
            } else {
                finalData.code = null; 
            }

            await addPerson(finalData);
        }

        if (onSuccess) onSuccess(finalData);
        onClose(); 
    } catch (err) {
        console.error("Error saving person", err);
        setError("Failed to save. Check console.");
    }
  };

  if (!isVisible) return null;

  const isEditingMode = !!initialData;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className={`bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto ${language === "ur" ? "text-right" : "text-left"}`} dir={language === "ur" ? "rtl" : "ltr"}>
        
        <h2 className="text-xl font-bold mb-4">
          {isEditingMode ? languageData[language].edit_person : languageData[language].add_person}
        </h2>

        {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm font-bold">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            
            {/* System Code Display */}
            {isEditingMode && formData.code && (
                <div className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                    <label className="block font-bold text-xs text-gray-500">System Code</label>
                    <div className="font-mono text-lg font-bold text-blue-600">P-{formData.code}</div>
                </div>
            )}
            
            {!isEditingMode && isCodeSystemActive && (
                 <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    New Code will be: <strong>P-{nextCode}</strong>
                 </div>
            )}

            <div>
              <label className="block font-bold text-sm mb-1">{languageData[language].name} <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Enter full name" />
            </div>

            <div>
              <label className="block font-bold text-sm mb-1">{languageData[language].email}</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" />
            </div>

            <div>
              <label className="block font-bold text-sm mb-1">{languageData[language].phone} <span className="text-red-500">*</span></label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" />
            </div>

            <div>
              <label className="block font-bold text-sm mb-1">{languageData[language].address} </label>
              <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" className="w-full p-2 border border-gray-300 rounded" />
            </div>
            
            <div>
              <label className="block font-bold text-sm mb-1">{languageData[language].area}</label>
              <select name="areaId" value={formData.areaId} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" >
                <option value="">{languageData[language].select_area || "Select Area"}</option>
                {areas && areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-sm mb-1">{languageData[language].image}</label>
              <input type="file" accept="image/*" onChange={handleImageSelection} className="w-full text-sm text-gray-500" />
            </div>
          </div>

          <div className={`flex justify-end space-x-4 mt-6 ${language === "ur" ? "flex-row-reverse space-x-reverse" : ""}`}>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
              {languageData[language].cancel}
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700">
              {isEditingMode ? languageData[language].update : languageData[language].add}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PeopleFormModal;

