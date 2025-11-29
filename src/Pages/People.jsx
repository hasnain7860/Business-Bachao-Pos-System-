import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from '../Appfullcontext.jsx';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";
import { useNavigate } from "react-router-dom";
import { FaBroom, FaFileImport, FaAddressBook, FaDownload } from "react-icons/fa"; 

// --- Imported Components & Utils ---
import PeopleFormModal from "../components/people/PeopleFormModal";
import PersonCard from "../components/people/PersonCard";
import { parseVcfFile, getPhoneContacts } from "../components/people/peopleImportUtils"; 

const PEOPLE_CODE_KEY = "nextPeopleCode"; 

const People = () => {
  const context = useAppContext();
  const { peopleContext, areasContext, language, settingContext, creditManagementContext } = context;
  
  // --- CRITICAL FIXES FOR UNIVERSAL STORE MAPPING ---
  
  // 1. People: 'data' ko 'people' aur 'remove' ko 'delete' map kiya
  const { data: people, add: addPerson, remove: deletePerson, edit: editPerson } = peopleContext;
  
  // 2. Credit: 'data' ko 'submittedRecords' map kiya
  const { data: submittedRecords, remove: deleteCreditRecord } = creditManagementContext;
  
  // 3. Areas: 'data' ko 'areas' map kiya
  const { data: areas } = areasContext;
  
  // 4. Settings: Universal Store raw data deta hai, hamein logic yahan handle karna padega
  //    Assuming settings array ka pehla item hi main setting object hai.
  const { data: settingsData, edit: editSetting, add: addSetting } = settingContext;
  const selectedSetting = settingsData[0] || {}; 
  
  // Wrapper function to mimic old saveSetting behavior
  const saveSetting = async (updatedSettings) => {
    if (selectedSetting.id) {
      await editSetting(selectedSetting.id, updatedSettings);
    } else {
      await addSetting(updatedSettings);
    }
  };

  const navigate = useNavigate();

  // --- UI State ---
  const [columns, setColumns] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [codeMessage, setCodeMessage] = useState(""); 
  const [isContactPickerSupported, setIsContactPickerSupported] = useState(false);

  // --- Modal State ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  const isCodeSystemActive = selectedSetting.peopleAllcode === true;
  const nextCode = Number(selectedSetting[PEOPLE_CODE_KEY]) || 1000;

  // --- 1. Setup ---
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      setColumns(width < 640 ? 1 : width < 1024 ? 2 : 3);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    if ('contacts' in navigator && 'select' in navigator.contacts) setIsContactPickerSupported(true);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // --- 2. Action Handlers ---
  const handleEdit = (person) => {
    setEditingPerson(person);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure? This deletes the person AND all manual records.")) return;
    try {
        const associated = submittedRecords.filter(r => r.personId === id);
        if (associated.length > 0) await Promise.all(associated.map(r => deleteCreditRecord(r.id)));
        await deletePerson(id);
        alert("Deleted successfully.");
    } catch (e) { console.error(e); }
  };

  const handleModalSuccess = () => {
      setIsModalVisible(false);
      setEditingPerson(null);
      setCodeMessage("Saved Successfully!");
      setTimeout(() => setCodeMessage(""), 2000);
  };

  // --- 3. Clean Import Handlers ---
  
  const processAndAddPeople = async (rawPeopleList, sourceName) => {
    if (!rawPeopleList || rawPeopleList.length === 0) return;

    let currentNextCode = nextCode; 
    let addedCount = 0;

    for (const rawPerson of rawPeopleList) {
        let personData = { ...rawPerson, id: uuidv4(), areaId: "" };
        
        if (isCodeSystemActive) {
            personData.code = currentNextCode;
            currentNextCode++;
        } else {
            personData.code = null;
        }
        await addPerson(personData);
        addedCount++;
    }

    if (isCodeSystemActive && addedCount > 0) {
        await saveSetting({ ...selectedSetting, [PEOPLE_CODE_KEY]: currentNextCode });
    }

    setCodeMessage(`Imported ${addedCount} contacts from ${sourceName}.`);
    setTimeout(() => setCodeMessage(""), 3000);
  };

  const handleVcfUpload = async (e) => {
    try {
        const file = e.target.files[0];
        const peopleList = await parseVcfFile(file); 
        await processAndAddPeople(peopleList, "VCF");
    } catch (error) {
        console.error(error);
        alert("Failed to parse file.");
    }
  };

  const handlePhoneImport = async () => {
    try {
        const contacts = await getPhoneContacts(); 
        await processAndAddPeople(contacts, "Phone");
    } catch (error) {
        console.error(error);
    }
  };

  // --- 4. Bulk Operations ---
  const handleCleanupGhosts = async () => {
      const validIds = new Set(people.map(p => p.id));
      const ghosts = submittedRecords.filter(r => !validIds.has(r.personId));
      if (ghosts.length === 0) { setCodeMessage("Database is clean."); setTimeout(() => setCodeMessage(""), 2000); return; }

      if (window.confirm(`Found ${ghosts.length} ghost records. Delete?`)) {
          for (const r of ghosts) await deleteCreditRecord(r.id);
          setCodeMessage(`Cleaned ${ghosts.length} records.`);
      }
  };

  const handleGenerateCodes = async () => {
    setCodeMessage("Generating codes...");
    let code = Number(selectedSetting[PEOPLE_CODE_KEY]) || 1000;
    let count = 0;
    for (const p of people) {
      if (!p.code) { await editPerson(p.id, { ...p, code }); code++; count++; }
    }
    await saveSetting({ ...selectedSetting, peopleAllcode: true, [PEOPLE_CODE_KEY]: code });
    setCodeMessage(`Assigned codes to ${count} people.`);
  };

  // --- 5. Filtering ---
  const filteredPeople = useMemo(() => {
    if (!searchQuery) return people;
    const q = searchQuery.toLowerCase();
    return people.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.phone && p.phone.includes(q)) || 
        (p.code && `P-${p.code}`.toLowerCase().includes(q))
    );
  }, [people, searchQuery]);

  const currentPeople = useMemo(() => {
    const last = currentPage * 10;
    return filteredPeople.slice(last - 10, last);
  }, [filteredPeople, currentPage]);

  const totalPages = Math.ceil(filteredPeople.length / 10);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      
      <div className={`mb-4 flex ${language === "ur" ? "justify-end" : "justify-start"}`}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg shadow">
           🔙 <span>{languageData[language].back}</span>
        </button>
      </div>

      <h1 className={`text-2xl font-bold mb-4 ${language === "ur" ? "text-right" : "text-left"}`}>
        {languageData[language].people_management}
      </h1>
      
      {codeMessage && <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg">{codeMessage}</div>}

      <div className={`mb-4 flex flex-wrap justify-between items-center gap-3 ${language === "ur" ? "flex-row-reverse" : ""}`}>
        <span className="text-lg font-semibold bg-white px-3 py-1 rounded shadow-sm">
          Total: {people.length}
        </span>
        <div className="flex gap-2 flex-wrap">
            <button onClick={handleCleanupGhosts} className="bg-white text-red-600 border border-red-200 px-3 py-2 rounded hover:bg-red-50" title="Cleanup Ghost Records"><FaBroom /></button>
            {selectedSetting.peopleAllcode !== true && (
                <button onClick={handleGenerateCodes} className="bg-yellow-500 text-white px-4 py-2 rounded">Gen Codes</button>
            )}
            <button onClick={() => { setEditingPerson(null); setIsModalVisible(true); }} className="bg-blue-600 text-white px-5 py-2 rounded shadow">+ {languageData[language].add_person}</button>
        </div>
      </div>

      <div className={`mb-6 flex flex-wrap items-center gap-2 p-3 bg-white rounded shadow-sm ${language === "ur" ? "flex-row-reverse text-right" : ""}`}>
        <label className="inline-flex items-center cursor-pointer bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded hover:bg-green-100 transition">
          <FaFileImport className="mr-2"/> VCF Import
          <input type="file" accept=".vcf" onChange={handleVcfUpload} className="hidden" />
        </label>
        <a href="/customer.vcf" download="customer.vcf" className="bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-100 flex items-center">
          <FaDownload className="mr-2"/> Demo VCF
        </a>
        <button onClick={handlePhoneImport} disabled={!isContactPickerSupported} className={`px-3 py-1.5 rounded flex items-center border ${isContactPickerSupported ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
          <FaAddressBook className="mr-2"/> Phone Import
        </button>
      </div>
      
      <div className={`mb-6 flex justify-between ${language === "ur" ? "flex-row-reverse" : ""}`}>
        <input
            type="text"
            placeholder="Search name, phone, code..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 py-2 px-4 rounded-lg w-full md:w-1/3 shadow-sm"
            dir={language === "ur" ? "rtl" : "ltr"}
        />
      </div>

      <div className={`grid gap-5 w-full ${language === "ur" ? "text-right" : "text-left"}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} dir={language === "ur" ? "rtl" : "ltr"}>
        {currentPeople.map(person => (
            <PersonCard 
                key={person.id}
                person={person}
                areas={areas}
                languageData={languageData}
                language={language}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
            <div className="flex gap-2">
                <button disabled={currentPage===1} onClick={() => setCurrentPage(c => c-1)} className="px-3 py-1 bg-white border rounded disabled:opacity-50">Prev</button>
                <span className="px-3 py-1 font-bold">{currentPage} / {totalPages}</span>
                <button disabled={currentPage===totalPages} onClick={() => setCurrentPage(c => c+1)} className="px-3 py-1 bg-white border rounded disabled:opacity-50">Next</button>
            </div>
        </div>
      )}

      <PeopleFormModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} onSuccess={handleModalSuccess} initialData={editingPerson} />
    </div>
  );
};

export default People;

