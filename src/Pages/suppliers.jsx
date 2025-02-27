
import React, { useState } from "react";
import { useAppContext } from '../Appfullcontext.jsx';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";


const Suppliers = () => {
  const context = useAppContext();

  const {language} = context;
 

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
      addSupplier({ ...form, id: uuidv4() });
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

  const handleVcfUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const confirmed = window.confirm(`Are you sure you want to upload the file: ${file.name}?`);
      if (confirmed) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const vcfData = event.target.result;
          const suppliersData = parseVcfData(vcfData);
          suppliersData.forEach(supplier => addSupplier(supplier));
        };
        reader.readAsText(file);
      } else {
        e.target.value = null; // Reset the file input if the user cancels
      }
    }
  };

  const parseVcfData = (vcfData) => {
    const suppliers = [];
    const entries = vcfData.split("END:VCARD");
    
    entries.forEach(entry => {
      if (entry.includes("BEGIN:VCARD")) {
        const nameMatch = entry.match(/FN:(.*)/);
        const emailMatch = entry.match(/EMAIL:(.*)/); // Assuming EMAIL might be present
        const phoneMatch = entry.match(/TEL;CELL:(.*)/);
        const cityMatch = entry.match(/CITY:(.*)/); // Assuming CITY might be present
        const countryMatch = entry.match(/COUNTRY:(.*)/); // Assuming COUNTRY might be present
        const addressMatch = entry.match(/ADR:(.*)/); // Assuming ADR might be present

        const supplier = {
          id: uuidv4(), // Generate unique ID
          name: nameMatch ? nameMatch[1].trim() : "Unknown",
          email: emailMatch ? emailMatch[1].trim() : "",
          phone: phoneMatch ? phoneMatch[1].trim() : "",
          city: cityMatch ? cityMatch[1].trim() : "",
          country: countryMatch ? countryMatch[1].trim() : "",
          address: addressMatch ? addressMatch[1].trim() : "",
          image: null // Placeholder for image handling
        };

        suppliers.push(supplier);
      }
    });

    return suppliers;
  };

  return (
    <div className="p-4">
      {/* Header */}
      <h1
  className={`text-2xl font-bold mb-2 ${
    language === "ur" ? "text-right" : "text-left"
  }`}
>{languageData[language].suppliers_management}</h1>
<div
    className={`mb-4 flex justify-between items-center ${
      language === "ur" ? "flex-row-reverse" : ""
    }`}
  >  <span className="text-lg font-medium">
    {languageData[language].total_suppliers} : {suppliers.length}
        </span>
        <button
          onClick={openModal}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
{languageData[language].suppliers_management}

          
        </button>
      </div>

      {/* VCF File Upload Section */}
      <div
    className={`mb-4 flex items-center gap-2 ${
      language === "ur" ? "flex-row-reverse text-right" : ""
    }`}
  >
        <label className="inline-flex items-center">
          <input
            type="file"
            accept=".vcf"
            onChange={handleVcfUpload}
            className="hidden"
          />
          <span className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          {languageData[language].upload_contacts}
          </span>
        </label>
        <span className="ml-2 text-gray-500">    {languageData[language].upload_vcf}</span>
      </div>

      {/* Supplier List */}
      <div
  className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${
    language === "ur" ? "text-right" : "text-left"
  }`}
  dir={language === "ur" ? "rtl" : "ltr"} // Change text direction based on language
> {suppliers.map((supplier) => (
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
            <p>{languageData[language].email}: {supplier.email}</p>
            <p>{languageData[language].phone}: {supplier.phone}</p>
            <p>{languageData[language].city}: {supplier.city}</p>
            <p>{languageData[language].country}: {supplier.country}</p>
            <div
        className={`flex space-x-2 mt-4 ${
          language === "ur" ? "flex-row-reverse" : ""
        }`}
      >  <button
                onClick={() => handleEdit(supplier)}
                className="text-sm bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
              >
     {languageData[language].edit}
              </button>
              <button
                onClick={() => handleRemove(supplier.id)}
                className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                   {languageData[language].remove}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Adding and Editing Suppliers */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? edit_supplier : languageData[language].add_supplier}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-bold">{languageData[language].name} *</label>
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
                  <label className="block font-bold">{languageData[language].email} *</label>
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
                  <label className="block font-bold">{languageData[language].phone} *</label>
                  <input
                    type="number"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">{languageData[language].city} *</label>
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
                  <label className="block font-bold">{languageData[language].country} *</label>
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
                  <label className="block font-bold">{languageData[language].address} *</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">{languageData[language].image}</label>
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
                   {languageData[language].cancel}
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {isEditing ? languageData[language].update : languageData[language].add}
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
