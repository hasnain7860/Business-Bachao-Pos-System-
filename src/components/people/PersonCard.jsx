import React from 'react';

const PersonCard = ({ 
    person, 
    areas, 
    languageData, 
    language, 
    onEdit, 
    onDelete 
}) => {
  
  // Safe extraction of Area Name to prevent crashes
  const getAreaName = (areaId) => {
    if (!areaId || !areas) return "N/A";
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : "Unknown Area";
  };

  return (
    <div className="p-4 bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg flex flex-col items-center border border-gray-100">
      
      {/* Image Handling with Fallback */}
      <div className="w-20 h-20 mb-4 relative">
        {person.image ? (
            <img
            src={person.image}
            alt={person.name}
            className="w-full h-full rounded-full object-cover border-2 border-blue-100"
            />
        ) : (
            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                {person.name.charAt(0).toUpperCase()}
            </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-800 text-center">{person.name}</h3>
      
      {person.code && (
          <span className="inline-block px-2 py-0.5 mt-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
            P-{person.code}
          </span>
      )}

      <div className="mt-3 text-sm text-gray-600 space-y-1 w-full text-center">
        <p className="flex justify-center items-center gap-2">
           <span className="text-gray-400">📞</span> {person.phone || "No Phone"}
        </p>
        <p className="truncate px-2">
            <span className="text-gray-400">📍</span> {person.address || "No Address"}
        </p>
        <p className="font-medium text-gray-700">
            🏙️ {getAreaName(person.areaId)}
        </p>
      </div>
      
      <div className={`flex space-x-2 mt-5 w-full justify-center ${language === "ur" ? "flex-row-reverse space-x-reverse" : ""}`}>
        <button
          onClick={() => onEdit(person)}
          className="flex-1 text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1.5 rounded hover:bg-yellow-100 transition"
        >
          {languageData[language].edit}
        </button>
        <button
          onClick={() => onDelete(person.id)}
          className="flex-1 text-sm bg-red-50 text-red-700 border border-red-200 px-2 py-1.5 rounded hover:bg-red-100 transition"
        >
          {languageData[language].remove}
        </button>
      </div>
    </div>
  );
};

export default PersonCard;

