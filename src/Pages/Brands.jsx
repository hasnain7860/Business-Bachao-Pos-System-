import React, { useState } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';

const Brand = () => {
  
  const context = useAppContext(); 
  const companies = context.companyContext.companies
  const brands = context.brandContext.brands
  const addBrand = context.brandContext.add
  const editBrand = context.brandContext.edit
  const deleteBrand = context.brandContext.delete
  
  

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [editingBrandId, setEditingBrandId] = useState(null);

  const handleAddOrEditBrand = (e) => {
    e.preventDefault();

    if (!selectedCompanyId) {
      alert('Please select a company first.');
      return;
    }

    if (editingBrandId) {
      // Edit mode
      editBrand(editingBrandId, {
        id: editingBrandId,
        name: brandName,
        companyId: parseInt(selectedCompanyId),
      });
      setEditingBrandId(null); // Reset edit state
    } else {
      // Add mode
      const newBrand = {
        id: brands.length + 1,
        name: brandName,
        companyId: parseInt(selectedCompanyId),
      };
      console.log(newBrand)
      addBrand(newBrand);
    }

    setBrandName(''); // Clear input
    setSelectedCompanyId(''); // Clear selection
  };

  const handleEditClick = (brand) => {
    setEditingBrandId(brand.id);
    setBrandName(brand.name);
    setSelectedCompanyId(brand.companyId.toString());
  };

  const handleCancelEdit = () => {
    setEditingBrandId(null);
    setBrandName('');
    setSelectedCompanyId('');
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">Manage Brands</h2>

      {/* Show message if no companies are available */}
      {companies.length === 0 ? (
        <p className="text-center text-red-500">Please add a company first before adding a brand.</p>
      ) : (
        <form onSubmit={handleAddOrEditBrand} className="space-y-4">
          {/* Company selection dropdown */}
          <div>
            <label className="block text-gray-700 text-sm font-medium">Select Company:</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              required
              className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                Select a company
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand name input */}
          <div>
            <label className="block text-gray-700 text-sm font-medium">Brand Name:</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              required
              placeholder="Enter brand name"
              className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Add/Edit Brand button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {editingBrandId ? 'Update Brand' : 'Add Brand'}
            </button>
            {editingBrandId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 py-3 px-4 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Brand List */}
      {brands.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700">Brand List</h3>
          <ul className="space-y-4">
            {brands.map((brand) => (
              <li
                key={brand.id}
                className="flex justify-between items-center p-3 bg-gray-100 rounded-md shadow-sm"
              >
                <span>
                  {brand.name}{' '}
                  <span className="text-sm text-gray-500">
                    ({companies.find((c) => c.id === brand.companyId)?.name || 'Unknown'})
                  </span>
                </span>
                <div className="flex space-x-2">
                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditClick(brand)}
                    className="py-1 px-3 bg-yellow-500 text-white text-sm font-semibold rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={() => deleteBrand(brand.id)}
                    className="py-1 px-3 bg-red-500 text-white text-sm font-semibold rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Brand;