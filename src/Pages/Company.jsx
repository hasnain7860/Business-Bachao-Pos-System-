import React, { useState, useEffect } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Import icons for edit and delete

const Company = () => {
  
  
  
  const context = useAppContext(); 
  
  const companies = context.companyContext.companies
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

  const handleSubmit = (e) => {
    e.preventDefault();

    const companyData = { name: companyName };
     console.log(companyData)
    if (editing) {
      // Edit existing company
      editCompany(selectedCompany.id, companyData);
    } else {
      // Add new company
      const newCompany = { ...companyData, id: companies.length + 1 }; // Generate new ID
   console.log(newCompany)
      addCompany(newCompany);
    }

    // Reset form after submit
    setCompanyName('');
    setEditing(false);
  };

  const handleDelete = (id) => {
    // Delete company by ID
    deleteCompany(id);
  };

  const handleEdit = (company) => {
    // Select the company for editing
    selectCompany(company.id);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
        {editing ? <span>Edit Company</span> : <span>Add Company</span>}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium">Company Name:</label>
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
          {editing ? 'Save Changes' : 'Add Company'}
        </button>
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700">Company List</h3>
        {companies.length === 0 ? ( // Check if array is empty
          <p className="text-center text-gray-500">No companies available. Add a new company!</p>
        ) : (
          <ul className="space-y-4">
            {companies.map((company) => (
              <li key={company.id} className="flex justify-between items-center p-3 bg-gray-100 rounded-md shadow-sm">
                <span>{company.name}</span>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEdit(company)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="text-red-600 hover:text-red-800"
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