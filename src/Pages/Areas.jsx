import React, { useState } from "react";
import { useAppContext } from '../Appfullcontext.jsx';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";
import { useNavigate } from "react-router-dom";

const Areas = () => {
    const context = useAppContext();
    const { areasContext, peopleContext, language } = context;

    // --- CRITICAL FIX: Mapping Universal Store Data ---
    // Universal Hook 'data' return karta hai, 'areas' nahi.
    // 'remove' function hai, 'delete' nahi.
    const { data: areas, add, edit, remove: deleteArea } = areasContext;
    
    // People list bhi 'data' property mein hai
    const { data: people } = peopleContext;

    const navigate = useNavigate();
    
    const [name, setName] = useState('');
    const [isEditing, setIsEditing] = useState(null); 
    const [errorMessage, setErrorMessage] = useState(''); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return;

        if (isEditing) {
            await edit(isEditing, { id: isEditing, name });
        } else {
            await add({ id: uuidv4(), name });
        }
        setName('');
        setIsEditing(null);
        setErrorMessage('');
    };

    const handleEdit = (area) => {
        setIsEditing(area.id);
        setName(area.name);
        setErrorMessage('');
    };

    const handleDelete = async (area) => {
        setErrorMessage('');

        // Safe check in case people data isn't loaded yet
        const currentPeople = people || [];
        const personInUse = currentPeople.find(p => p.areaId === area.id);

        if (personInUse) {
            setErrorMessage(`Cannot delete "${area.name}". It is assigned to: ${personInUse.name}`);
        } else {
            // Thoda sa safety net zaroori hai delete se pehle
            if(window.confirm("Delete this area?")) {
                await deleteArea(area.id);
                if (isEditing === area.id) {
                    setName('');
                    setIsEditing(null);
                }
            }
        }
    };

    return (
        <div className="p-4" dir={language === "ur" ? "rtl" : "ltr"}>
            <div className={`mb-4 flex ${language === "ur" ? "justify-end" : "justify-start"}`}>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-gray-500 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-gray-600 transition duration-200"
                >
                     🔙 <span>{languageData[language].back}</span>
                </button>
            </div>

            <h1 className={`text-2xl font-bold mb-4 ${language === "ur" ? "text-right" : "text-left"}`}>
                {languageData[language].area_management}
            </h1>
            
            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={languageData[language].add_area}
                    className="w-full p-2 border rounded"
                    required
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    {isEditing ? languageData[language].update : languageData[language].add}
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 'areas' array check karna zaroori hai crash prevent karne ke liye */}
                {areas && areas.map(area => (
                    <div key={area.id} className={`p-4 bg-white shadow rounded-lg flex justify-between items-center ${language === "ur" ? "flex-row-reverse" : ""}`}>
                        <h3 className="text-lg font-bold">{area.name}</h3>
                        <div className={`flex space-x-2 ${language === "ur" ? "flex-row-reverse space-x-reverse" : ""}`}>
                            <button onClick={() => handleEdit(area)} className="text-sm bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                                {languageData[language].edit}
                            </button>
                            <button onClick={() => handleDelete(area)} className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                                {languageData[language].remove}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Areas;

