import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../Appfullcontext';
import languageData from "../assets/languageData.json";
const Sales = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const sales = context.SaleContext.Sales;
  const customers = context.supplierCustomerContext.customers;
  const userAndBusinessDetail = context.settingContext.settings;
  const currency = userAndBusinessDetail?.[0]?.business?.currency ?? '$';
  const {language} = context;
console.log(sales)
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Three-dot menu state
  const [openMenu, setOpenMenu] = useState({});

  const handleNewSale = () => {
    navigate('/sales/new');
  };
  const isAnyMenuOpen = Object.values(openMenu).some(value => value);


  const handleCustomerNameViaId = (sale) => {
    const existCustomer = customers.find((customer) => customer.id === sale.customerId);
    return existCustomer ? existCustomer.name : "Name not found";
  };

  const handleMenuAction = (action, id) => {
    switch (action) {

      case 'view':
        navigate(`/sales/view/${id}`);
        break;
      case 'print':
        navigate(`/sales/view/${id}/print`);
        break;
      case 'addPayment':
        navigate(`/sales/addPayments/${id}`);
        break;
      case 'viewPayment':
        navigate(`/sales/viewPayments/${id}`);
        break;
      case 'saleReturn':  // Sale Return Option
        navigate(`/sales/return/${id}`);
        break;
      case 'delete':
        context.SaleContext.delete(id);
        break;
      default:
        break;
    }
  };

  const toggleMenu = (id) => {
    setOpenMenu((prevState) => {
      const newState = {};
      Object.keys(prevState).forEach((key) => {
        newState[key] = false;
      });
      newState[id] = !prevState[id];
      return newState;
    });
  };

  // ** Filtered Sales List Based on Search Query **
  const filteredSales = sales.filter((sale) => {
    const customerName = handleCustomerNameViaId(sale).toLowerCase();
    return customerName.includes(searchQuery.toLowerCase()) || sale.totalBill.toString().includes(searchQuery) || sale.salesRefNo.toString().includes(searchQuery);
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <button 
            className="flex items-center gap-2 bg-white text-gray-600 px-4 py-2 rounded-lg shadow hover:bg-gray-50 transition duration-200"
            onClick={() => navigate(-1)}
          >
            <span>←</span> {languageData[language].back}
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">{languageData[language].sales_records}</h1>
          <button 
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition duration-200"
            onClick={handleNewSale}
          >
            <span>+</span> {languageData[language].new_sale}
          </button>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder={languageData[language].search_placeholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </span>
            </div>
          </div>
        </div>

        {/* Sales Table Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredSales.length > 0 ? (
  <div 
    className="overflow-x-auto transition-all duration-200" 
    style={{ minHeight: isAnyMenuOpen ? '500px' : 'auto' }}
  >
    <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
                  <tr>
                    {[
                      languageData[language].no,
                      languageData[language].sales_ref_no,
                      languageData[language].customer_name,
                      languageData[language].date,
                      languageData[language].total_bill,
                      languageData[language].paid_bill,
                      languageData[language].credit,
                      languageData[language].payment_mode,
                      languageData[language].status,
                      languageData[language].actions
                    ].map((header, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.map((sale, index) => {
                    const totalPaidFromPayments = Array.isArray(sale?.addPayment)
                      ? sale.addPayment.reduce((sum, payment) => {
                          const amount = Number(payment?.amount);
                          return !isNaN(amount) && amount >= 0 ? sum + amount : sum;
                        }, 0)
                      : 0;
                    const returnTotal = Array.isArray(sale?.returns)
                      ? sale.returns.reduce((sum, product) => {
                          const amount = Number(product?.returnPrice);
                          return !isNaN(amount) && amount >= 0 ? sum + amount : sum;
                        }, 0)
                      : 0;

                    const updatedAmountPaid = Number(sale.amountPaid) + totalPaidFromPayments;
                    const updatedCredit = sale.credit - totalPaidFromPayments - returnTotal;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.salesRefNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{handleCustomerNameViaId(sale)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.dateTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currency} {sale.totalBill - returnTotal}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{currency} {updatedAmountPaid}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{currency} {updatedCredit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.paymentMode}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            updatedCredit === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {updatedCredit === 0 ? languageData[language].paid : languageData[language].pending}
                          </span>
                        </td>
                       
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 relative">
  <div className="relative inline-block text-left">
    <button 
      className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
      onClick={() => toggleMenu(sale.id)}
    >
      <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
      </svg>
    </button>
    
    {openMenu[sale.id] && (
      <div 
        className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 divide-y divide-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-1">
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 group"
            onClick={() => handleMenuAction('view', sale.id)}
          >
            <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {languageData[language].view}
          </button>
          
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 group"
            onClick={() => handleMenuAction('print', sale.id)}
          >
            <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {languageData[language].print}
          </button>
        </div>

        {updatedCredit > 0 && (
          <div className="py-1">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 group"
              onClick={() => handleMenuAction('addPayment', sale.id)}
            >
              <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {languageData[language].add_payment}
            </button>
            
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 group"
              onClick={() => handleMenuAction('viewPayment', sale.id)}
            >
              <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {languageData[language].view_payment}
            </button>
          </div>
        )}

        <div className="py-1">
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 group"
            onClick={() => handleMenuAction('saleReturn', sale.id)}
          >
            <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
            {languageData[language].sale_return}
          </button>
          
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 group"
            onClick={() => handleMenuAction('delete', sale.id)}
          >
            <svg className="w-4 h-4 mr-3 text-red-400 group-hover:text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {languageData[language].delete}
          </button>
        </div>
      </div>
    )}
  </div>
</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ): (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{languageData[language].no_sales_records}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sales;