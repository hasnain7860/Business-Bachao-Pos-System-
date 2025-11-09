import React, { useState, useEffect } from "react";
import { useAppContext } from '../Appfullcontext.jsx';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";
import { useNavigate } from "react-router-dom";

const People = () => {
  // 1. Get areasContext to populate the dropdown
  const context = useAppContext();
  const { peopleContext, areasContext, language } = context;
  const { people } = peopleContext;
  const { add: addPerson, edit: editPerson, delete: deletePerson } = peopleContext;
  const { areas } = areasContext;

  const navigate = useNavigate();

  const [columns, setColumns] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);
  const [peoplePerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [isContactPickerSupported, setIsContactPickerSupported] = useState(false);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1);
      else if (width < 1024) setColumns(2);
      else setColumns(3);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);

    if ('contacts' in navigator && 'select' in navigator.contacts) {
      setIsContactPickerSupported(true);
    }

    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // 2. Add areaId to the default form state
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    address: "",
    image: null,
    areaId: "", // Added areaId
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageSelection = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
  
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result });
    };
  
    reader.readAsDataURL(file);
  };
  
  const handleFormSubmission = (e) => {
    e.preventDefault();
    if (isEditingMode) {
      editPerson(formData.id, formData);
    } else {
      addPerson({ ...formData, id: uuidv4() });
    }
    closeModal();
  };

  const initiateEdit = (person) => {
    setFormData({
        ...person,
        areaId: person.areaId || "", // Ensure areaId is "" if null/undefined
    });
    setIsEditingMode(true);
    setIsModalVisible(true);
  };

  const removePerson = (id) => {
    // You can add a check here if this person is tied to transactions
    // For now, direct delete as requested for areas
    deletePerson(id);
  };

  const openModal = () => {
    // 3. Reset areaId when opening modal for a new person
    setFormData({
      id: null,
      name: "",
      email: "",
      phone: "",
      address: "",
      image: null,
      areaId: "", // Reset areaId
    });
    setIsEditingMode(false);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  // VCF File Upload Handler
  const handleVcfFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // NOTE: Using a custom modal for confirmation is better than window.confirm
      // but sticking to simple logic for now.
      console.log(`File selected: ${file.name}. Add custom confirmation if needed.`);
      const reader = new FileReader();
      reader.onload = (event) => {
        const vcfContent = event.target.result;
        const peopleList = extractPeopleFromVcf(vcfContent);
        peopleList.forEach(person => addPerson(person));
      };
      reader.readAsText(file);
    }
  };

  const decodeQuotedPrintable = (input) => {
    input = input.replace(/=\r?\n/g, "");
    return input.replace(/=([A-Fa-f0-9]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
  };

  const extractPeopleFromVcf = (vcfContent) => {
    const people = [];
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

        try {
          const utf8Decoder = new TextDecoder("utf-8");
          const encodedName = new Uint8Array([...name].map(c => c.charCodeAt(0)));
          const encodedAddress = new Uint8Array([...address].map(c => c.charCodeAt(0)));
          name = utf8Decoder.decode(encodedName);
          address = utf8Decoder.decode(encodedAddress);
        } catch (e) {
          console.error("Text decoding error:", e);
        }

        // Add with default areaId
        people.push({ id: uuidv4(), name, phone, email, address, areaId: "" });
      }
    });

    return people;
  };

  // Handler for importing from phone contacts
  const handleImportFromPhone = async () => {
    if (!isContactPickerSupported) {
      console.error("Contact Picker API is not supported.");
      return;
    }

    const props = ['name', 'tel'];
    const opts = { multiple: true };

    try {
      const contacts = await navigator.contacts.select(props, opts);
      if (contacts.length === 0) return;

      let importedCount = 0;
      contacts.forEach(contact => {
        const name = contact.name && contact.name.length > 0 ? contact.name[0] : "Unknown";
        const phone = contact.tel && contact.tel.length > 0 ? contact.tel[0] : "";

        if (phone) {
          addPerson({
            id: uuidv4(),
            name: name,
            phone: phone,
            email: "",
            address: "",
            image: null,
            areaId: "", // Add with default areaId
          });
          importedCount++;
        }
      });
      console.log(`Successfully imported ${importedCount} contacts.`);
      
    } catch (ex) {
      console.error("Error importing contacts:", ex);
    }
  };


  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const filteredPeople = people.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (person.email && person.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    person.phone.includes(searchQuery) ||
    (person.address && person.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination Logic
  const indexOfLastPerson = currentPage * peoplePerPage;
  const indexOfFirstPerson = indexOfLastPerson - peoplePerPage;
  const currentPeople = filteredPeople.slice(indexOfFirstPerson, indexOfLastPerson);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(filteredPeople.length / peoplePerPage);
  
  // 4. Helper function to get area name from ID
  const getAreaName = (areaId) => {
    if (!areaId) return "N/A";
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : "Unknown Area";
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

      <h1 className={`text-2xl font-bold mb-2 ${language === "ur" ? "text-right" : "text-left"}`}>
        {languageData[language].people_management}
      </h1>
      <div className={`mb-4 flex justify-between items-center ${language === "ur" ? "flex-row-reverse" : ""}`}>
        <span className="text-lg font-medium">
          {languageData[language].total} {languageData[language].people} : {people.length}
        </span>
       
        <button
          onClick={openModal}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {languageData[language].add_person}
        </button>
      </div>
      <div className={`mb-4 flex justify-between items-center ${language === "ur" ? "flex-row-reverse" : ""}`}>
      <input
          type="text"
          placeholder={languageData[language].search_placeholder}
          value={searchQuery}
          onChange={handleSearchInputChange}
          className="border py-2 px-3 rounded w-full md:w-1/3"
        />
      </div>
      
      {/* Import/Upload Buttons */}
      <div className={`mb-4 flex flex-wrap items-center gap-2 ${language === "ur" ? "flex-row-reverse text-right" : ""}`}>
        <label className="inline-flex items-center">
          <input
            type="file"
            accept=".vcf"
            onChange={handleVcfFileUpload}
            className="hidden"
          />
          <span className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            {languageData[language].upload_person}
          </span>
        </label>
        <span className="text-gray-500 text-sm">{languageData[language].upload_vcf}</span>

        <a
          href="/customer.vcf"
          download="customer.vcf"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {languageData[language].download_demo}
        </a>

        <button
          onClick={handleImportFromPhone}
          disabled={!isContactPickerSupported}
          className={`bg-purple-500 text-white px-4 py-2 rounded ${
            isContactPickerSupported
              ? 'hover:bg-purple-600'
              : 'opacity-50 cursor-not-allowed'
          }`}
          title={isContactPickerSupported ? "Import from phone contacts" : "This feature is only available on supported mobile browsers (HTTPS)"}
        >
          {languageData[language].import_phone || "Import from Phone"}
        </button>
      </div>


      {/* People List Display */}
      <div
        className={`grid gap-4 w-full ${language === "ur" ? "text-right" : "text-left"}`}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
        dir={language === "ur" ? "rtl" : "ltr"}
      >
        {currentPeople.map((person) => (
          <div
            key={person.id}
            className="p-4 bg-white shadow rounded-lg flex flex-col items-center"
          >
            {person.image && (
              <img
                src={person.image}
                alt={person.name}
                className="w-20 h-20 rounded-full mb-4 object-cover"
              />
            )}
            <h3 className="text-lg font-bold">{person.name}</h3>
            <p>{languageData[language].phone}: {person.phone}</p>
            <p>{languageData[language].address}: {person.address}</p>
            {/* 5. Display the Area Name */}
            <p>{languageData[language].area}: {getAreaName(person.areaId)}</p>
            
            <div className={`flex space-x-2 mt-4 ${language === "ur" ? "flex-row-reverse space-x-reverse" : ""}`}>
              <button
                onClick={() => initiateEdit(person)}
                className="text-sm bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
              >
                {languageData[language].edit}
              </button>
              <button
                onClick={() => removePerson(person.id)}
                className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                {languageData[language].remove}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4">
        <nav>
          <ul className={`pagination flex space-x-2 ${language === "ur" ? "flex-row-reverse space-x-reverse" : ""}`}>
            <li className="page-item">
              <button
                onClick={() => paginate(currentPage - 1)}
                className="page-link btn btn-secondary px-3 py-1 rounded"
                disabled={currentPage === 1}
              >
                {languageData[language].previous || "Previous"}
              </button>
            </li>
            {/* Simple page number display */}
            <li className="page-item">
                <span className="page-link px-3 py-1">
                    {currentPage} / {totalPages}
                </span>
            </li>
            <li className="page-item">
              <button
                onClick={() => paginate(currentPage + 1)}
                className="page-link btn btn-secondary px-3 py-1 rounded"
                disabled={currentPage === totalPages}
              >
                {languageData[language].next || "Next"}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Modal for Adding and Editing People */}
      {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className={`bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto ${language === "ur" ? "text-right" : "text-left"}`}>
            <h2 className="text-xl font-bold mb-4">
              {isEditingMode ? languageData[language].edit_person : languageData[language].add_person}
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
                  <label className="block font-bold">{languageData[language].address} </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                {/* 6. Add Area Select Dropdown */}
                <div>
                  <label className="block font-bold">{languageData[language].area}</label>
                  <select
                    name="areaId"
                    value={formData.areaId}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">{languageData[language].select_area || "Select Area"}</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold">{languageData[language].image}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelection}
                    className="w-full"
                  />
                </div>
              </div>
              <div className={`flex justify-end space-x-4 mt-4 ${language === "ur" ? "flex-row-reverse space-x-reverse" : ""}`}>
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

export default People;

