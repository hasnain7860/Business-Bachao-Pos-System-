import React, { useState } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";
import { useNavigate } from "react-router-dom";

const Unit = () => {
  const navigate = useNavigate();
  const context = useAppContext(); 
  const { language } = context;

  // --- CRITICAL FIX: Mapping Universal Store Data ---
  // 1. 'units' exist nahi karta, 'data' hai.
  // 2. 'delete' exist nahi karta, 'remove' hai.
  const { 
    data: units, 
    add: addUnit, 
    edit: editUnit, 
    remove: deleteUnit 
  } = context.unitContext;

  const [unitName, setUnitName] = useState("");
  const [editingUnitId, setEditingUnitId] = useState(null);

  const handleAddOrEditUnit = async (e) => {
    e.preventDefault();

    if (!unitName.trim()) return;

    if (editingUnitId) {
      // Edit mode
      await editUnit(editingUnitId, { id: editingUnitId, name: unitName });
      setEditingUnitId(null); 
    } else {
      // Add mode
      const newUnit = {
        id: uuidv4(), 
        name: unitName,
      };
      await addUnit(newUnit);
    }

    setUnitName(""); 
  };

  const handleEditClick = (unit) => {
    setEditingUnitId(unit.id);
    setUnitName(unit.name);
  };

  const handleCancelEdit = () => {
    setEditingUnitId(null);
    setUnitName("");
  };

  // Safe check to avoid crash if data is loading
  const unitList = units || [];
  const isRtl = language === "ur";

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg" dir={isRtl ? "rtl" : "ltr"}>
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
        {languageData[language].manage_units}
      </h2>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="w-full mb-4 py-3 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-2"
      >
        {isRtl ? null : "⬅"} {languageData[language].back} {isRtl ? "➡" : null}
      </button>

      {/* Add/Edit Unit Form */}
      <form onSubmit={handleAddOrEditUnit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">
            {languageData[language].unit_name}
          </label>
          <input
            type="text"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            required
            placeholder={languageData[language].enter_unit_name}
            className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex space-x-4 gap-4">
          <button
            type="submit"
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {editingUnitId ? languageData[language].update_unit : languageData[language].add_unit}
          </button>
          {editingUnitId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-1 py-3 px-4 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              {languageData[language].cancel}
            </button>
          )}
        </div>
      </form>

      {/* Unit List */}
      {unitList.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            {languageData[language].unit_list}
          </h3>
          <ul className="space-y-3">
            {unitList.map((unit) => (
              <li
                key={unit.id}
                className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-md shadow-sm"
              >
                <span className="font-medium">{unit.name}</span>
                <div className={`flex space-x-2 gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <button
                    onClick={() => handleEditClick(unit)}
                    className="py-1 px-3 bg-yellow-500 text-white text-sm font-semibold rounded hover:bg-yellow-600 transition-colors"
                  >
                    {languageData[language].edit}
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (window.confirm(languageData[language].areYouSureDelete)) {
                        await deleteUnit(unit.id);
                      }
                    }}
                    className="py-1 px-3 bg-red-500 text-white text-sm font-semibold rounded hover:bg-red-600 transition-colors"
                  >
                    {languageData[language].delete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-6 py-4 bg-gray-50 rounded">
          {languageData[language].no_units_available}
        </p>
      )}
    </div>
  );
};

export default Unit;

