import React, { useState } from "react";
import { useAppContext } from '../Appfullcontext.jsx';

const Suppliers = () => {
  const context = useAppContext();
  
  const suppliers = context.supplierCustomerContext.suppliers;
  const addSupplier = context.supplierCustomerContext.addSupplier;
  const editSupplier = context.supplierCustomerContext.editSupplier;
  const deleteSupplier = context.supplierCustomerContext.deleteSupplier;

  const [form, setForm] = useState({
    id: null,
    name: "",
    image: null,
    email: "",
    phone: "",
    city: "",
    country: "",
    address: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageUpload = (e) => {
    setForm({ ...form, image: URL.createObjectURL(e.target.files[0]) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      editSupplier(form.id, form);
    } else {
      addSupplier({ ...form, id: Date.now() });
    }
    closeModal();
  };

  const handleEdit = (supplier) => {
    setForm(supplier);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleRemove = (id) => {
    deleteSupplier(id);
  };

  const openModal = () => {
    setForm({
      id: null,
      name: "",
      image: null,
      email: "",
      phone: "",
      city: "",
      country: "",
      address: "",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-2">Suppliers Management</h1>
      <div className="mb-4 flex justify-between items-center">
        <span className="text-lg font-medium">
          Total Suppliers: {suppliers.length}
        </span>
        <button
          onClick={openModal}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Supplier
        </button>
      </div>

      {/* Supplier List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="p-4 bg-white shadow rounded-lg flex flex-col items-center"
          >
            {supplier.image && (
              <img
                src={supplier.image}
                alt={supplier.name}
                className="w-20 h-20 rounded-full mb-4 object-cover"
              />
            )}
            <h3 className="text-lg font-bold">{supplier.name}</h3>
            <p>Email: {supplier.email}</p>
            <p>Phone: {supplier.phone}</p>
            <p>City: {supplier.city}</p>
            <p>Country: {supplier.country}</p>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handleEdit(supplier)}
                className="text-sm bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleRemove(supplier.id)}
                className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Supplier" : "Add Supplier"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-bold">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">Country *</label>
                  <input
                    type="text"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">Address *</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">Image</label>
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {isEditing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;