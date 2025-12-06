import React from 'react';
import { FaEdit, FaTrash, FaMapMarkerAlt, FaPhoneAlt, FaIdBadge } from 'react-icons/fa';

const PersonCard = ({ 
  person, 
  areas, 
  languageData, 
  language, 
  onEdit, 
  onDelete 
}) => {
  // Safe lookup for area name
  const areaName = areas?.find(a => a.id === person.areaId)?.name || "Unknown Area";
  
  // Handling missing image
  const defaultImage = "https://via.placeholder.com/150?text=User";

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between hover:shadow-lg transition-shadow border border-gray-100 relative overflow-hidden group">
      
      {/* Optional: Show Code Badge if it exists */}
      {person.code && (
        <div className={`absolute top-0 ${language === 'ur' ? 'left-0 rounded-br-lg' : 'right-0 rounded-bl-lg'} bg-blue-600 text-white text-xs font-bold px-2 py-1 shadow-sm z-10`}>
          P-{person.code}
        </div>
      )}

      <div className={`flex items-start gap-4 ${language === "ur" ? "flex-row-reverse" : ""}`}>
        {/* Image Section */}
        <div className="flex-shrink-0">
          <img 
            src={person.image || defaultImage} 
            alt={person.name} 
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => { e.target.src = defaultImage; }} // Fallback
          />
        </div>

        {/* Info Section */}
        <div className={`flex-grow ${language === "ur" ? "text-right" : "text-left"}`}>
          <div className="mb-2">
            <h3 className="font-bold text-lg text-gray-800 leading-tight">{person.name}</h3>
            {/* Show Urdu name if exists */}
            {person.nameUrdu && (
                <div className="text-gray-500 font-serif text-md mt-0.5 leading-tight" dir="rtl">
                    {person.nameUrdu}
                </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500 space-y-1">
            <div className={`flex items-center gap-2 ${language === "ur" ? "flex-row-reverse" : ""}`}>
               <FaPhoneAlt className="text-gray-400 text-xs" />
               <span className="font-mono text-gray-700">{person.phone}</span>
            </div>
            
            {person.address && (
                <div className={`flex items-start gap-2 ${language === "ur" ? "flex-row-reverse" : ""}`}>
                   <span className="truncate max-w-[150px]">{person.address}</span>
                </div>
            )}
            
            <div className={`flex items-center gap-2 ${language === "ur" ? "flex-row-reverse" : ""}`}>
               <FaMapMarkerAlt className="text-gray-400 text-xs" />
               <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                 {areaName}
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`mt-4 pt-3 border-t border-gray-100 flex gap-2 ${language === "ur" ? "flex-row-reverse" : ""}`}>
        <button 
          onClick={() => onEdit(person)} 
          className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-1.5 rounded hover:bg-blue-100 text-sm font-medium transition"
        >
          <FaEdit /> {languageData[language].edit}
        </button>
        
        <button 
          onClick={() => onDelete(person.id)} 
          className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-1.5 rounded hover:bg-red-100 text-sm font-medium transition"
        >
          <FaTrash /> {languageData[language].delete}
        </button>
      </div>
    </div>
  );
};

export default PersonCard;

