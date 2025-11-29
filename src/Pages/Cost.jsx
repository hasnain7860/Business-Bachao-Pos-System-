import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAppContext } from '../Appfullcontext.jsx';
import languageData from "../assets/languageData.json";
import { v4 as uuidv4 } from 'uuid';

const Cost = () => {
  const [showForm, setShowForm] = useState(false);
  const context = useAppContext(); 
  const { language } = context;
  
  // --- CRITICAL FIX: Universal Store Mapping ---
  // 1. 'costData' -> 'data'
  // 2. 'delete' -> 'remove'
  // 3. 'settings' -> 'data'
  const costData = context.costContext.data || [];
  const add = context.costContext.add;
  const deleteCostData = context.costContext.remove;
  const edit = context.costContext.edit;
  
  const settingsData = context.settingContext.data || [];
  const userAndBusinessDetail = settingsData[0] || {};
  const currency = userAndBusinessDetail?.business?.currency ?? '$';

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id : uuidv4(),
    date: new Date().toISOString().slice(0, 10), 
    note: "",
    cost: "",
  });

  const handleAddClick = () => {
    setFormData({
      id: uuidv4(),
      date: new Date().toISOString().slice(0, 10),
      note: "",
      cost: "",
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = async () => {
    if(isEditing){
      await edit(formData.id, formData);
    } else {
      await add(formData);
    }
    
    // Reset
    setFormData({
      id: uuidv4(),
      date: new Date().toISOString().slice(0, 10),
      note: "",
      cost: "",
    });
    setShowForm(false);
    setIsEditing(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm(languageData[language].areYouSureDelete || "Are you sure?")) {
      await deleteCostData(id);
    }
  };

  const handleEdit = (id) => {
    const costToEdit = costData.find(data => data.id === id);
    if (costToEdit) {
      setFormData(costToEdit);
      setShowForm(true);
      setIsEditing(true);
    }
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{languageData[language].cost_entries}</h1>
        <button
          className="btn bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-300 shadow-md"
          onClick={handleAddClick}
        >
          <span className="mr-2">+</span> {languageData[language].add_new_cost}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="card shadow-xl p-8 mb-8 bg-white rounded-xl border border-gray-200">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            {isEditing ? languageData[language].edit_cost : languageData[language].add_new_cost}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">{languageData[language].date}</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">{languageData[language].cost}</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder={languageData[language].enter_cost}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700">{languageData[language].note}</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder={languageData[language].enter_note}
                rows="3"
              ></textarea>
            </div>

            <div className="md:col-span-2 flex justify-end space-x-4">
              <button
                onClick={() => setShowForm(false)}
                className="btn px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all duration-300"
              >
                {languageData[language].cancel}
              </button>
              <button
                onClick={handleSave}
                className="btn px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300"
              >
                {languageData[language].save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Entries Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {costData.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500 text-lg">{languageData[language].no_cost_entries}</p>
          </div>
        ) : (
          costData.map((data) => (
            <div
              key={data.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-gray-500">{new Date(data.date).toLocaleDateString()}</span>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleEdit(data.id)}
                      className="text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(data.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-gray-600 text-sm line-clamp-2"><span className="font-semibold text-gray-700">Note: </span>{data.note}</p>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-gray-600 text-sm">Amount:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {currency} {data.cost}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Cost;

