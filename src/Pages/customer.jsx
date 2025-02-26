
import React, { useState } from "react";
import { useAppContext } from '../Appfullcontext.jsx';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";

const Customers = () => {
  const context = useAppContext();
  const customers = context.supplierCustomerContext.customers;
  console.log(customers)
  const addCustomer = context.supplierCustomerContext.addCustomer;
  const editCustomer = context.supplierCustomerContext.editCustomer;
  const deleteCustomer = context.supplierCustomerContext.deleteCustomer;
  const {language} = context;
  

 

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    address: "",
    image: null,
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageSelection = (e) => {
    setFormData({ ...formData, image: URL.createObjectURL(e.target.files[0]) });
  };
 
  const handleFormSubmission = (e) => {
    e.preventDefault();
    if (isEditingMode) {
      editCustomer(formData.id, formData);
    } else {
        
      addCustomer({ ...formData, id: uuidv4() });
    }
    closeModal();
  };

  const initiateEdit = (customer) => {
    setFormData(customer);
    setIsEditingMode(true);
    setIsModalVisible(true);
  };

  const removeCustomer = (id) => {
    deleteCustomer(id);
  };

  const openCustomerModal = () => {
    setFormData({
      id: null,
      name: "",
      email: "",
      phone: "",
      address: "",
      image: null,
    });
    setIsEditingMode(false);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleVcfFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const confirmed = window.confirm(`Do you want to upload the file: ${file.name}?`);
      if (confirmed) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const vcfContent = event.target.result;
          const customersList = extractCustomersFromVcf(vcfContent);
          customersList.forEach(customer => addCustomer(customer));
        };
        reader.readAsText(file);
      } else {
        e.target.value = null; // Reset the file input if cancelled
      }
    }
  };

  const extractCustomersFromVcf = (vcfContent) => {
    const customers = [];
    const entries = vcfContent.split("END:VCARD");
    
    entries.forEach(entry => {
      if (entry.includes("BEGIN:VCARD")) {
        const nameMatch = entry.match(/FN:(.*)/);
        const phoneMatch = entry.match(/TEL;CELL:(.*)/);
        const emailMatch = entry.match(/EMAIL:(.*)/);
        const addressMatch = entry.match(/ADR:(.*)/);

        const customer = {
          id: uuidv4(), // Create a unique ID
          name: nameMatch ? nameMatch[1].trim() : "Unknown",
          email: emailMatch ? emailMatch[1].trim() : "",
          phone: phoneMatch ? phoneMatch[1].trim() : "",
          address: addressMatch ? addressMatch[1].trim() : "",
          image: null // Placeholder for image handling
        };

        customers.push(customer);
      }
    });

    return customers;
  };

  return (
    <div className="p-4">
       <h1
  className={`text-2xl font-bold mb-2 ${
    language === "ur" ? "text-right" : "text-left"
  }`}
>{languageData[language].customer_management}</h1>
        <div
    className={`mb-4 flex justify-between items-center ${
      language === "ur" ? "flex-row-reverse" : ""
    }`}
  >
        <span className="text-lg font-medium">
        {languageData[language].total} {languageData[language].customers} : {customers.length}
        </span>
        <button
          onClick={openCustomerModal}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
         {languageData[language].add_customer} 
        </button>
      </div>

      {/* VCF File Upload Section */}
      <div
    className={`mb-4 flex items-center gap-2 ${
      language === "ur" ? "flex-row-reverse text-right" : ""
    }`}
  >
        <label className="inline-flex items-center   ">
          <input
            type="file"
            accept=".vcf"
            onChange={handleVcfFileUpload}
            className="hidden"
          />
          <span className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          {languageData[language].upload_customer} 
          </span>
        </label>
        <span className="ml-2 text-gray-500">   {languageData[language].upload_vcf}</span>
      </div>

      {/* Customer List Display */}
      <div
  className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${
    language === "ur" ? "text-right" : "text-left"
  }`}
  dir={language === "ur" ? "rtl" : "ltr"} // Change text direction based on language
>
  {customers.map((customer) => (
    <div
      key={customer.id}
      className="p-4 bg-white shadow rounded-lg flex flex-col items-center"
    >
      {customer.image && (
        <img
          src={customer.image}
          alt={customer.name}
          className="w-20 h-20 rounded-full mb-4 object-cover"
        />
      )}
      <h3 className="text-lg font-bold">{customer.name}</h3>
      <p>
        {languageData[language].phone}: {customer.phone}
      </p>
      <p>
        {languageData[language].address}: {customer.address}
      </p>
      <div
        className={`flex space-x-2 mt-4 ${
          language === "ur" ? "flex-row-reverse" : ""
        }`}
      >
        <button
          onClick={() => initiateEdit(customer)}
          className="text-sm bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
        >
          {languageData[language].edit}
        </button>
        <button
          onClick={() => removeCustomer(customer.id)}
          className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          {languageData[language].remove}
        </button>
      </div>
    </div>
  ))}
</div>


      {/* Modal for Adding and Editing Customers */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className={`bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto ${language === "ur" ? "text-right" : "text-left"}`}>
            <h2 className="text-xl font-bold mb-4">
              {isEditingMode ? languageData[language].edit_customer : languageData[language].add_customer}
            </h2>
            <form onSubmit={handleFormSubmission}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-bold">{languageData[language].name} *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">{languageData[language].email}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">{languageData[language].phone} *</label>
                  <input
                    type="number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">{languageData[language].address} *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold">{languageData[language].image}</label>
                  <input
                    type="file"
                    onChange={handleImageSelection}
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
                  {isEditingMode ? languageData[language].update : languageData[language].add}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
