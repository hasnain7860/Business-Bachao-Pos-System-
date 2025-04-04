import React, { useState, useEffect } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Import icons for edit and delete
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";

import {  useNavigate } from "react-router-dom";
const Company = () => {
  

     
  const navigate = useNavigate();
  
  const context = useAppContext(); 
  
  const companies = context.companyContext.companies
  const {language} = context;
  
  const selectedCompany = context.companyContext.selectedCompany
  const addCompany = context.companyContext.add
  const editCompany = context.companyContext.edit
  const deleteCompany = context.companyContext.delete
  const selectCompany = context.companyContext.select
  

  const [companyName, setCompanyName] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (selectedCompany) {
      setCompanyName(selectedCompany.name);
      setEditing(true); // Enable edit mode if a company is selected
    } else {
      setCompanyName('');
      setEditing(false); // Disable edit mode if no company is selected
    }
  }, [selectedCompany]);
const uniqueId = uuidv4();
  const handleSubmit = (e) => {
    e.preventDefault();
   
    const companyData = { name: companyName };
     console.log(companyData)
    if (editing) {
      // Edit existing company
      editCompany(selectedCompany.id, companyData);
    } else {
      // Add new company
      console.log(uniqueId)
      const newCompany = { ...companyData, id:uniqueId}; // Generate new ID
   console.log(newCompany)
      addCompany(newCompany);
    }

    // Reset form after submit
    setCompanyName('');
    setEditing(false);
  };

  const handleDelete = (id) => {
  if (window.confirm(languageData[language].areYouSureDelete)) {
    // Delete company by ID
    deleteCompany(id);
  }
};

  const handleEdit = (company) => {
    // Select the company for editing
    selectCompany(company.id);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      {/* Back Button Full Width */}
      <button
         onClick={() => navigate(-1)}
        className="w-full mb-4 py-3 bg-gray-500 text-white font-semibold rounded-md flex items-center justify-center hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        ⬅ {languageData[language].back}
      </button>
  
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
        {editing ? <span>{languageData[language].edit_company}</span> : <span>{languageData[language].add_company}</span>}
      </h2>
  
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium">{languageData[language].company_name}:</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {editing ? <FaEdit className="mr-2" /> : null}
          {editing ? languageData[language].save_changes : languageData[language].add_company}
        </button>
      </form>
  
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700">{languageData[language].company_list}</h3>
        {companies.length === 0 ? (
          <p className="text-center text-gray-500">{languageData[language].no_companies}</p>
        ) : (
          <ul className="space-y-4">
            {companies.map((company) => (
              <li key={company.id} className="flex justify-between items-center p-3 bg-gray-100 rounded-md shadow-sm">
                <span>{company.name}</span>
                <div className="flex space-x-3">
                  <button onClick={() => handleEdit(company)} className="text-blue-600 hover:text-blue-800">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(company.id)} className="text-red-600 hover:text-red-800">
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