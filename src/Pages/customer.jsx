
import React, { useState , useEffect } from "react";
import { useAppContext } from '../Appfullcontext.jsx';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";
import {  useNavigate } from "react-router-dom";

const Customers = () => {
  const context = useAppContext();
  const customers = context.supplierCustomerContext.customers;
  console.log(customers)
  const addCustomer = context.supplierCustomerContext.addCustomer;
  const editCustomer = context.supplierCustomerContext.editCustomer;
  const deleteCustomer = context.supplierCustomerContext.deleteCustomer;
  const {language} = context;

  const navigate = useNavigate();

  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1);
      else if (width < 1024) setColumns(2);
      else setColumns(3);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

 

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
    console.log(formData)
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





  const decodeQuotedPrintable = (input) => {
    // Soft line breaks remove karna
    input = input.replace(/=\r?\n/g, "");

    return input.replace(/=([A-Fa-f0-9]{2})/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });
};



const extractCustomersFromVcf = (vcfContent) => {
    const customers = [];
    const entries = vcfContent.split("END:VCARD");

    entries.forEach(entry => {
        if (entry.includes("BEGIN:VCARD")) {
            let nameMatch = entry.match(/FN[:;]?(?:CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:)?(.*)/i);
            let phoneMatch = entry.match(/TEL[^:]*:(.*)/);
            let emailMatch = entry.match(/EMAIL[^:]*:(.*)/);
            let addressMatch = entry.match(/ADR[^:]*:(.*)/);

            let name = nameMatch ? decodeQuotedPrintable(nameMatch[1].trim()) : "Unknown";
            let phone = phoneMatch ? phoneMatch[1].trim() : "";
            let email = emailMatch ? emailMatch[1].trim() : "";
            let address = addressMatch ? decodeQuotedPrintable(addressMatch[1].trim()) : "";

            // Convert decoded name and address to proper UTF-8
            try {
                const utf8Decoder = new TextDecoder("utf-8");
                const encodedName = new Uint8Array([...name].map(c => c.charCodeAt(0)));
                const encodedAddress = new Uint8Array([...address].map(c => c.charCodeAt(0)));

                name = utf8Decoder.decode(encodedName);
                address = utf8Decoder.decode(encodedAddress);
            } catch (e) {
                console.error("Text decoding error:", e);
            }

            customers.push({ id: uuidv4(), name, phone, email, address });
        }
    });

    return customers;
};



  return (
    <div className="p-4">
         {/* Back Button */}
         <div className={`mb-4 flex ${language === "ur" ? "justify-end" : "justify-start"}`}>
  <button
    onClick={() => navigate(-1)}
    className="flex items-center gap-2 bg-gray-500 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-gray-600 transition duration-200"
  >
    {language === "ur" ? null : "🔙"}
    <span>{languageData[language].back}</span>
    {language === "ur" ? "🔙" : null}
  </button>
</div>

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
  <label className="inline-flex items-center">
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
  <span className="ml-2 text-gray-500">{languageData[language].upload_vcf}</span>

  {/* Demo File Download Button */}
  <a
    href="/customer.vcf" // یہاں اپنی ڈیمو فائل کا اصل لنک دیں
    download="customer.vcf"
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  >
    {languageData[language].download_demo}
  </a>
</div>
  {/* Customer List Display */}
  <div
      className={`grid gap-4 w-full ${
        language === "ur" ? "text-right" : "text-left"
      }`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, // Dynamically adjust columns
      }}
      dir={language === "ur" ? "rtl" : "ltr"}
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
          <p>{languageData[language].phone}: {customer.phone}</p>
          <p>{languageData[language].address}: {customer.address}</p>
          <div className={`flex space-x-2 mt-4 ${language === "ur" ? "flex-row-reverse" : ""}`}>
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
  type="tel"
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
