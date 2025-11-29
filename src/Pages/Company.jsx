import React, { useState, useEffect } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";
import { useNavigate } from "react-router-dom";

const Company = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const { language } = context;

  // --- CRITICAL FIXES ---
  // 1. 'companies' exist nahi karta, ab 'data' hai.
  // 2. 'delete' exist nahi karta, ab 'remove' hai.
  const { 
    data: companies, 
    add: addCompany, 
    edit: editCompany, 
    remove: deleteCompany, 
    select: selectCompany,
    selectedCompany 
  } = context.companyContext;

  const [companyName, setCompanyName] = useState('');
  const [editing, setEditing] = useState(false);

  // Sync state when selection changes
  useEffect(() => {
    if (selectedCompany) {
      setCompanyName(selectedCompany.name);
      setEditing(true);
    } else {
      setCompanyName('');
      setEditing(false);
    }
  }, [selectedCompany]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!companyName.trim()) return;

    const companyData = { name: companyName };

    if (editing && selectedCompany) {
      // Edit existing
      await editCompany(selectedCompany.id, companyData);
      selectCompany(null); // Deselect after edit
    } else {
      // Add new
      // FIX: ID yahan generate karo, component body mein nahi
      const newCompany = { ...companyData, id: uuidv4() }; 
      await addCompany(newCompany);
    }

    // Reset UI
    setCompanyName('');
    setEditing(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm(languageData[language].areYouSureDelete)) {
      await deleteCompany(id);
    }
  };

  const handleEdit = (company) => {
    selectCompany(company.id);
  };

  // RTL/LTR Direction helper
  const isRtl = language === "ur";

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg" dir={isRtl ? "rtl" : "ltr"}>
      
      <button
         onClick={() => navigate(-1)}
        className="w-full mb-4 py-3 bg-gray-500 text-white font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        {isRtl ? "واپس" : "⬅ Back"} 
      </button>
  
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
        {editing ? languageData[language].edit_company : languageData[language].add_company}
      </h2>
  
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">{languageData[language].company_name}:</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter company name..."
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {editing && <FaEdit className="mx-2" />}
          {editing ? languageData[language].save_changes : languageData[language].add_company}
        </button>
        
        {editing && (
          <button
            type="button"
            onClick={() => selectCompany(null)}
            className="w-full py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300"
          >
            {languageData[language].cancel}
          </button>
        )}
      </form>
  
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">{languageData[language].company_list}</h3>
        
        {!companies || companies.length === 0 ? (
          <p className="text-center text-gray-500 py-4 bg-gray-50 rounded">{languageData[language].no_companies}</p>
        ) : (
          <ul className="space-y-3">
            {companies.map((company) => (
              <li key={company.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow">
                <span className="font-medium">{company.name}</span>
                <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <button 
                    onClick={() => handleEdit(company)} 
                    className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-100 rounded-full transition"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete(company.id)} 
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-100 rounded-full transition"
                    title="Delete"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Company;

