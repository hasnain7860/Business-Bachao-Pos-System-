import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaEllipsisV } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import languageData from "../assets/languageData.json";

const Purchases = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const [isAnyMenuOpen, setIsAnyMenuOpen] = useState(false);
  const peoples = context.peopleContext.people;
  const {language} = context;
  const purchasesData = context.purchaseContext.purchases;
  console.log(purchasesData)
  const handleDelete = context.purchaseContext.delete
  const [menuOpen, setMenuOpen] = useState(null); // Track which menu is open
const userAndBusinessDetail = context.settingContext.settings;
  const handleAddPurchase = () => {
    navigate('/purchases/new');
  };

 // Modify your toggleMenu function
const toggleMenu = (index) => {
  const willOpen = menuOpen === index ? false : true;
  setMenuOpen(menuOpen === index ? null : index);
  setIsAnyMenuOpen(willOpen);
};


  // const handleView = (purchase) => {
  //   // Logic for viewing details
  // };

  // const handleEdit = (purchase) => {
  //   navigate(`/purchases/edit/${purchase.id}`);
  // };

  

//   const handleAddPayment = (purchase) => {
//     // Logic for adding payment
//     navigate(`/purchases/addPayments/${purchase.id}`);
//   };
  
//  const  handleViewPayment = (purchase) => {
//     navigate(`/purchases/viewPayments/${purchase.id}`);
//   }

  return (
    <div className={`p-4 ${language === 'ur' ? 'rtl' : 'ltr'}`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between mb-4">
        <button onClick={handleAddPurchase} className="btn btn-primary">
          {languageData[language].add_purchase}
        </button>
        <button onClick={() => navigate(-1)} className="btn  btn-secondary" style={{ alignSelf: 'flex-start', marginLeft: language === 'ur' ? 'auto' : '8px', marginRight: language === 'ur' ? '8px' : 'auto' }}>
          {languageData[language].back}
        </button>
      </div>
     
      <div className="relative mb-4">
  <div className={`overflow-x-auto shadow-lg rounded-lg ${isAnyMenuOpen ? 'min-h-[500px]' : ''} transition-all duration-300`}>
    <table className="min-w-full bg-white border-collapse">
     <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-400">
                <th className="px-6 py-4 text-white font-semibold tracking-wider text-left">{languageData[language].purchase_no}</th>
                <th className="px-6 py-4 text-white font-semibold tracking-wider text-left">{languageData[language].purchase_ref_no}</th>
                <th className="px-6 py-4 text-white font-semibold tracking-wider text-left">{languageData[language].supplier}</th>
                <th className="px-6 py-4 text-white font-semibold tracking-wider text-left">{languageData[language].total_bill}</th>
                <th className="px-6 py-4 text-white font-semibold tracking-wider text-left">{languageData[language].payment_mode}</th>
                <th className="px-6 py-4 text-white font-semibold tracking-wider text-left">{languageData[language].date}</th>
                {/* <th className="px-6 py-4 text-white font-semibold tracking-wider text-left">{languageData[language].payment_status}</th> */}
                <th className="px-6 py-4 text-white font-semibold tracking-wider text-left">{languageData[language].credit}</th>
                <th className="px-6 py-4 text-white font-semibold tracking-wider text-left">{languageData[language].action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchasesData.map((purchase, index) => (
                <tr key={purchase.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-gray-800">{index + 1}</td>
                  <td className="px-6 py-4 text-gray-800">{purchase.purchaseRefNo}</td>
                  <td className="px-6 py-4 text-gray-800 font-medium">
                    {peoples.find((p) => p.id === purchase.personId)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-gray-800">{purchase.totalBill}</td>
                  <td className="px-6 py-4 text-gray-800">{purchase.paymentMode}</td>
                  <td className="px-6 py-4 text-gray-800">{purchase.date}</td>
                  {/* <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${(purchase.totalBill - purchase.totalPayment) === 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'}`}>
                      {(purchase.totalBill - purchase.totalPayment) === 0 ? languageData[language].full : languageData[language].due}
                    </span>
                  </td> */}
                  <td className="px-6 py-4 text-gray-800">{purchase.totalBill - purchase.totalPayment}</td>
                  <td className="px-6 py-4 relative">
  <button onClick={() => toggleMenu(index)} className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
    <FaEllipsisV className="text-gray-600" />
  </button>
  {menuOpen === index && (
    <div className="absolute right-0 lg:right-auto lg:transform lg:translate-x-[-90%] mt-2 w-48 bg-white border rounded-lg shadow-xl z-50"
         style={{
           top: '100%',
           maxHeight: '300px',
           overflowY: 'auto'
         }}>
      {/* <button onClick={() => handleView(purchase)} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700">
        {languageData[language].view}
      </button>
      <button onClick={() => handleEdit(purchase)} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700">
        {languageData[language].edit}
      </button> */}
      <button onClick={() => handleDelete(purchase.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">
        {languageData[language].delete}
      </button>
      {/* {(purchase.totalBill - purchase.totalPayment) !== 0 && (
        <button onClick={() => handleAddPayment(purchase)} className="w-full text-left px-4 py-2 hover:bg-green-50 text-green-600">
          {languageData[language].add_payment}
        </button>
      )} */}
      {/* <button onClick={() => handleViewPayment(purchase)} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600">
        {languageData[language].view_payment}
      </button> */}
    </div>
  )}
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
  
  
};

export default Purchases;
