import React, { useState } from "react";
import { useAppContext } from '../Appfullcontext.jsx';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";
// 1. Import useNavigate for the back button
import { useNavigate } from "react-router-dom";

const Areas = () => {
    // 2. Get full context, including people (for checking) and language
    const context = useAppContext();
    // Destructure peopleContext, which contains 'people'
    const { areasContext, peopleContext, language } = context;
    const { areas, add, edit, delete: deleteArea } = areasContext;
    const { people } = peopleContext; // Get the list of all people

    const navigate = useNavigate(); // 3. Initialize navigate
    
    const [name, setName] = useState('');
    const [isEditing, setIsEditing] = useState(null); // id of the area being edited

    // 4. Remove modal state, only need error message state
    const [errorMessage, setErrorMessage] = useState(''); // Area 'in-use' error

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name) return;

        if (isEditing) {
            edit(isEditing, { id: isEditing, name });
        } else {
            add({ id: uuidv4(), name });
        }
        setName('');
        setIsEditing(null);
        setErrorMessage(''); // Clear error on successful add/edit
    };

    const handleEdit = (area) => {
        setIsEditing(area.id);
        setName(area.name);
        setErrorMessage(''); // Clear error on edit
    };

    // 5. Simplified delete function (no modal)
    const handleDelete = (area) => {
        setErrorMessage(''); // Clear old error

        // Check if any person is using this area
        // Note: The original code checked customers/suppliers. I am changing this to 'people'
        // based on your request to fix it "people ka hasab sa" (according to people).
        const personInUse = people.find(p => p.areaId === area.id);

        if (personInUse) {
            // If area is in use, block delete and show error
            setErrorMessage(`Cannot delete "${area.name}". It is already assigned to one or more people.`);
        } else {
            // If area is safe, delete directly
            deleteArea(area.id);
            // If the deleted area was being edited, clear the form
            if (isEditing === area.id) {
                setName('');
                setIsEditing(null);
            }
        }
    };

    return (
        <div className="p-4" dir={language === "ur" ? "rtl" : "ltr"}>
            {/* 6. Add Back Button, same as in People.jsx */}
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

            <h1 className={`text-2xl font-bold mb-4 ${language === "ur" ? "text-right" : "text-left"}`}>
                {languageData[language].area_management}
            </h1>
            
            {/* 7. Error message display */}
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
                {areas.map(area => (
                    <div key={area.id} className={`p-4 bg-white shadow rounded-lg flex justify-between items-center ${language === "ur" ? "flex-row-reverse" : ""}`}>
                        <h3 className="text-lg font-bold">{area.name}</h3>
                        <div className={`flex space-x-2 ${language === "ur" ? "flex-row-reverse space-x-reverse" : ""}`}>
                            {/* 8. Use languageData for button text */}
                            <button onClick={() => handleEdit(area)} className="text-sm bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                                {languageData[language].edit}
                            </button>
                            {/* 9. Call simplified handleDelete function */}
                            <button onClick={() => handleDelete(area)} className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                                {languageData[language].remove}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 10. Delete Confirmation Modal has been removed as requested. */}
        </div>
    );
};
export default Areas;

