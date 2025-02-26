import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useAppContext } from '../Appfullcontext.jsx';

import { v4 as uuidv4 } from 'uuid';
const Cost = () => {
  const [showForm, setShowForm] = useState(false);
  const context = useAppContext(); 
  
  const costData = context.costContext.costData;
  console.log(costData)
  const add = context.costContext.add
  const deleteCostData = context.costContext.delete;
  const edit = context.costContext.edit;
  const userAndBusinessDetail = context.settingContext.settings;
  const currency = userAndBusinessDetail?.[0]?.business?.currency ?? '$'
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
   id : uuidv4(),
    date: new Date().toISOString().slice(0, 10), 
    note: "",
    cost: "",
  });

  const handleAddClick = () => {
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = () => {
    if(isEditing){
      edit(formData.id , formData)
    }else{
    add(formData);
    }
    setFormData({
      id: uuidv4(),
      date: new Date().toISOString().slice(0, 10),
      note: "",
      cost: "",
    });
    setShowForm(false);
    setIsEditing(false)
  };

  const handleDelete = (id) => {
    deleteCostData(id)
  };
const handleEdit = (id) => {
  // Find the cost entry by id
  const costToEdit = costData.find(data => data.id === id);

  if (costToEdit) {
    // Set the form data to the selected cost entry
    setFormData(costToEdit);
    setShowForm(true);
    setIsEditing(true)
  }
};
  

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Add Button */}
      <button
        className="btn btn-primary mb-6 hover:bg-blue-600 transition-all ease-in-out duration-200"
        onClick={handleAddClick}
      >
        <span className="mr-2">+</span> Add New Cost
      </button>

      {/* Form Section */}
      {showForm && (
        <div className="card shadow-xl p-6 bg-gradient-to-r from-teal-100 via-blue-200 to-indigo-200">
          <h2 className="text-2xl text-center text-blue-800 mb-6">Add New Cost</h2>
          <div className="space-y-4">
            {/* Date Input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input input-bordered w-full border-2 border-blue-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Note</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="textarea textarea-bordered w-full border-2 border-blue-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter a note"
              ></textarea>
            </div>

            {/* Cost Input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Cost</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className="input input-bordered w-full border-2 border-blue-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter the cost"
              />
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleSave}
                className="btn btn-success px-6 py-2 rounded-md hover:bg-green-600 transition-all ease-in-out duration-200"
              >
                Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="btn btn-secondary px-6 py-2 rounded-md hover:bg-gray-500 transition-all ease-in-out duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Entries Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Cost Entries</h3>
        {costData.length === 0 ? (
          <p className="text-center text-gray-500">No cost entries available</p>
        ) : (
          <ul className="space-y-6">
            {costData.map((data) => (
              <li key={data.id} className="card p-6 shadow-lg flex justify-between items-center bg-gradient-to-r from-indigo-50 to-teal-100">
                <div className="flex flex-col text-gray-700">
                  <p className="font-semibold">{data.date}</p>
                  <p>{data.note}</p>
                  <p className="font-bold text-xl text-gray-800">{currency} {data.cost}</p>
                </div>

                {/* Edit and Delete Options */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleEdit(data.id)}
                    className="text-blue-500 hover:text-blue-700 transition-all ease-in-out duration-200"
                  >
                    <FaEdit size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(data.id)}
                    className="text-red-500 hover:text-red-700 transition-all ease-in-out duration-200"
                  >
                    <FaTrash size={20} />
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

export default Cost;