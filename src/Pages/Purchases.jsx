import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaEllipsisV } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import languageData from "../assets/languageData.json";

const Purchases = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  
  // --- CRITICAL FIX: Universal Store Mapping ---
  // 1. 'purchases' -> 'data'
  // 2. 'people' -> 'data'
  // 3. 'delete' -> 'remove'
  // 4. 'settings' -> 'data'
  const purchasesData = context.purchaseContext.data || [];
  const handleDeletePurchase = context.purchaseContext.remove;
  const peoples = context.peopleContext.data || [];
  const settingsData = context.settingContext.data || [];
  
  const { language } = context;
  const currency = settingsData[0]?.business?.currency ?? 'Rs.';

  const [menuOpen, setMenuOpen] = useState(null); 
  const [isAnyMenuOpen, setIsAnyMenuOpen] = useState(false);

  const handleAddPurchase = () => {
    navigate('/purchases/new');
  };

  const toggleMenu = (index) => {
    if (menuOpen === index) {
      setMenuOpen(null);
      setIsAnyMenuOpen(false);
    } else {
      setMenuOpen(index);
      setIsAnyMenuOpen(true);
    }
  };

  const handlePurchaseReturn = (id) => {
    navigate(`/return/purchase_return/add/${id}`);
  };
  const handlePurchaseEdit = (id) => {
    navigate(`/purchases/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm(languageData[language].areYouSureDelete || "Are you sure?")) {
      await handleDeletePurchase(id);
      setMenuOpen(null);
      setIsAnyMenuOpen(false);
    }
  };

  return (
    <div className={`p-4 ${language === 'ur' ? 'rtl' : 'ltr'}`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between mb-4">
        <button onClick={handleAddPurchase} className="btn btn-primary">
          {languageData[language].add_purchase}
        </button>
        <button onClick={() => navigate(-1)} className="btn btn-secondary flex items-center gap-2">
           {language === 'ur' ? null : "⬅"} {languageData[language].back} {language === 'ur' ? "➡" : null}
        </button>
      </div>
     
      <div className="relative mb-4">
        <div className={`overflow-x-auto shadow-lg rounded-lg ${isAnyMenuOpen ? 'min-h-[500px]' : ''} transition-all duration-300 bg-white`}>
          <table className="min-w-full bg-white border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-400 text-white">
                <th className="px-6 py-4 font-semibold tracking-wider text-left">{languageData[language].purchase_no}</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-left">{languageData[language].purchase_ref_no}</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-left">{languageData[language].supplier}</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-left">{languageData[language].total_bill}</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-left">{languageData[language].payment_mode}</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-left">{languageData[language].date}</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-left">{languageData[language].credit}</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-left">{languageData[language].action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchasesData.length > 0 ? (
                purchasesData.map((purchase, index) => (
                  <tr key={purchase.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 text-gray-800">{index + 1}</td>
                    <td className="px-6 py-4 text-gray-800">{purchase.purchaseRefNo}</td>
                    <td className="px-6 py-4 text-gray-800 font-medium">
                      {peoples.find((p) => p.id === purchase.personId)?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-gray-800">{currency} {purchase.totalBill}</td>
                    <td className="px-6 py-4 text-gray-800 capitalize">{purchase.paymentMode}</td>
                    <td className="px-6 py-4 text-gray-800">{new Date(purchase.date).toLocaleDateString()}</td>
                  
                    <td className="px-6 py-4 text-red-600 font-semibold">
                      {currency} {(Number(purchase.totalBill) - Number(purchase.totalPayment)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 relative">
                      <button onClick={() => toggleMenu(index)} className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
                        <FaEllipsisV className="text-gray-600" />
                      </button>
                      {menuOpen === index && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl z-50 origin-top-right">
                          <button onClick={() => handlePurchaseReturn(purchase.id)} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700 flex items-center gap-2">
                             <FaEdit className="text-blue-500" /> {languageData[language].purchase_return}
                          </button>
                          <button onClick={() => handlePurchaseEdit(purchase.id)} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700 flex items-center gap-2">
                             <FaEdit className="text-blue-500" /> {languageData[language].purchase_edit}
                          </button>
                          <button onClick={() => handleDelete(purchase.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
                             <FaTrashAlt /> {languageData[language].delete}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No purchases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Purchases;

