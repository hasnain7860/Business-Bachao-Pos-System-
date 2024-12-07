import React, { useState } from "react";
import { useAppContext } from "../Appfullcontext.jsx";

const Unit = () => {
  const context = useAppContext(); 
  const units = context.unitContext.units
  const addUnit = context.unitContext.add
  const editUnit = context.unitContext.edit
  const deleteUnit = context.unitContext.delete

  const [unitName, setUnitName] = useState("");
  const [editingUnitId, setEditingUnitId] = useState(null);

  const handleAddOrEditUnit = (e) => {
    e.preventDefault();

    if (editingUnitId) {
      // Edit mode
      editUnit(editingUnitId, { id: editingUnitId, name: unitName });
      setEditingUnitId(null); // Reset editing state
    } else {
      // Add mode
      const newUnit = {
        id: units.length + 1, // Generate unique ID
        name: unitName,
      };
      console.log(newUnit)
      addUnit(newUnit);
    }

    setUnitName(""); // Clear input field
  };

  const handleEditClick = (unit) => {
    setEditingUnitId(unit.id);
    setUnitName(unit.name);
  };

  const handleCancelEdit = () => {
    setEditingUnitId(null);
    setUnitName("");
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">Manage Units</h2>

      {/* Add/Edit Unit Form */}
      <form onSubmit={handleAddOrEditUnit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium">Unit Name:</label>
          <input
            type="text"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            required
            placeholder="Enter unit name (e.g., Kg, Pcs, Liter)"
            className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {editingUnitId ? "Update Unit" : "Add Unit"}
          </button>
          {editingUnitId && (
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

      {/* Unit List */}
      {units.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700">Unit List</h3>
          <ul className="space-y-4">
            {units.map((unit) => (
              <li
                key={unit.id}
                className="flex justify-between items-center p-3 bg-gray-100 rounded-md shadow-sm"
              >
                <span>{unit.name}</span>
                <div className="flex space-x-2">
                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditClick(unit)}
                    className="py-1 px-3 bg-yellow-500 text-white text-sm font-semibold rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={() => deleteUnit(unit.id)}
                    className="py-1 px-3 bg-red-500 text-white text-sm font-semibold rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-6">No units available. Add a new unit above.</p>
      )}
    </div>
  );
};

export default Unit;