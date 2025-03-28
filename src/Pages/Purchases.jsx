
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaEllipsisV } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import languageData from "../assets/languageData.json";

const Purchases = () => {
  const navigate = useNavigate();
  const context = useAppContext();

  const {language} = context;
  const purchasesData = context.purchaseContext.purchases;
  console.log(purchasesData)
  const handleDelete = context.purchaseContext.delete
  const [menuOpen, setMenuOpen] = useState(null); // Track which menu is open
const userAndBusinessDetail = context.settingContext.settings;
  const handleAddPurchase = () => {
    navigate('/purchases/new');
  };

  const toggleMenu = (index) => {
    setMenuOpen(menuOpen === index ? null : index);
  };

  const handleView = (purchase) => {
    // Logic for viewing details
  };

  const handleEdit = (purchase) => {
    navigate(`/purchases/edit/${purchase.id}`);
  };

  

  const handleAddPayment = (purchase) => {
    // Logic for adding payment
    navigate(`/purchases/addPayments/${purchase.id}`);
  };
  
 const  handleViewPayment = (purchase) => {
    navigate(`/purchases/viewPayments/${purchase.id}`);
  }

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
  
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>{languageData[language].purchase_no}</th>
              <th>{languageData[language].supplier}</th>
              <th>{languageData[language].total_bill}</th>
              <th>{languageData[language].payment_mode}</th>
              <th>{languageData[language].date}</th>
              <th>{languageData[language].payment_status}</th>
              <th>{languageData[language].credit}</th>
              <th>{languageData[language].action}</th>
            </tr>
          </thead>
          <tbody>
            {purchasesData.map((purchase, index) => (
              <tr key={purchase.id}>
                <td>{index + 1}</td>
                <td>{purchase.supplierName}</td>
                <td>{purchase.totalBill}</td>
                <td>{purchase.paymentMode}</td>
                <td>{purchase.date}</td>
                <td>{(purchase.totalBill - purchase.totalPayment) == 0 ? languageData[language].full : languageData[language].due}</td>
                <td>{purchase.totalBill - purchase.totalPayment}</td>
                <td>
                  <div className="relative">
                    <button onClick={() => toggleMenu(index)} className="btn btn-sm">
                      <FaEllipsisV />
                    </button>
                    {menuOpen == index && (
                      <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-10">
                        <button onClick={() => handleView(purchase)} className="block px-4 py-2 hover:bg-gray-100">
                          {languageData[language].view}
                        </button>
                        <button onClick={() => handleEdit(purchase)} className="block px-4 py-2 hover:bg-gray-100">
                          {languageData[language].edit}
                        </button>
                        <button onClick={() => handleDelete(purchase.id)} className="block px-4 py-2 hover:bg-gray-100">
                          {languageData[language].delete}
                        </button>
                        {(purchase.totalBill - purchase.totalPayment) !== 0 && (
                          <button onClick={() => handleAddPayment(purchase)} className="block px-4 py-2 text-red-600 hover:bg-gray-100">
                            {languageData[language].add_payment}
                          </button>
                        )}
                        <button onClick={() => handleViewPayment(purchase)} className="block px-4 py-2 text-red-600 hover:bg-gray-100">
                          {languageData[language].view_payment}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  
};

export default Purchases;
