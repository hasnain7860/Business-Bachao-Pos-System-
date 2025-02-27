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

  const handleCustomerNameViaId = (sale) => {
    const existCustomer = customers.find((customer) => customer.id === sale.customerId);
    return existCustomer ? existCustomer.name : "Name not found";
  };

  const handleMenuAction = (action, id) => {
    switch (action) {
      case 'edit':
        navigate(`/sales/edit/${id}`);
        break;
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
    setOpenMenu((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  // ** Filtered Sales List Based on Search Query **
  const filteredSales = sales.filter((sale) => {
    const customerName = handleCustomerNameViaId(sale).toLowerCase();
    return customerName.includes(searchQuery.toLowerCase()) || sale.totalBill.toString().includes(searchQuery) || sale.salesRefNo.toString().includes(searchQuery);
  });

  return (
    <div className={`container mx-auto p-6 bg-white shadow-md rounded-lg ${language === 'ur' ? 'rtl' : 'ltr'}`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
    <h1 className="text-2xl font-bold text-center mb-6">{languageData[language].sales_records}</h1>
  
    {/* Search Input */}
    <input
      type="text"
      placeholder={languageData[language].search_placeholder}
      className="border p-2 w-full mb-4"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  
    {/* New Sale Button */}
    <button className="btn btn-primary mb-4" onClick={handleNewSale}>
      {languageData[language].new_sale}
    </button>
  
    {/* Sales Table */}
    <div className="overflow-x-auto mb-4">
      {filteredSales.length > 0 ? (
        <table className="table-auto w-full mb-4">
          <thead>
            <tr>
              <th className="px-4 py-2">{languageData[language].no}</th>
              <th className="px-4 py-2">{languageData[language].sales_ref_no}</th>
              <th className="px-4 py-2">{languageData[language].customer_name}</th>
              <th className="px-4 py-2">{languageData[language].date}</th>
              <th className="px-4 py-2">{languageData[language].total_bill}</th>
              <th className="px-4 py-2">{languageData[language].paid_bill}</th>
              <th className="px-4 py-2">{languageData[language].credit}</th>
              <th className="px-4 py-2">{languageData[language].payment_mode}</th>
              <th className="px-4 py-2">{languageData[language].status}</th>
              <th className="px-4 py-2">{languageData[language].actions}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale, index) => {
              const totalPaidFromPayments = Array.isArray(sale?.addPayment)
                ? sale.addPayment.reduce((sum, payment) => {
                    const amount = Number(payment?.amount);
                    return !isNaN(amount) && amount >= 0 ? sum + amount : sum;
                  }, 0)
                : 0;
  
              const updatedAmountPaid = Number(sale.amountPaid) + totalPaidFromPayments;
              const updatedCredit = sale.credit - totalPaidFromPayments;
  
              return (
                <tr key={index}>
                  <td className="border px-4 py-2">{index + 1}</td>
                  <td className="border px-4 py-2">{sale.salesRefNo}</td>
                  <td className="border px-4 py-2">{handleCustomerNameViaId(sale)}</td>
                  <td className="border px-4 py-2">{sale.dateTime}</td>
                  <td className="border px-4 py-2">{currency} {sale.totalBill}</td>
                  <td className="border px-4 py-2">{currency} {updatedAmountPaid}</td>
                  <td className="border px-4 py-2">{currency} {updatedCredit}</td>
                  <td className="border px-4 py-2">{sale.paymentMode}</td>
                  <td className="border px-4 py-2">{updatedCredit === 0 ? languageData[language].paid : languageData[language].pending}</td>
                  <td className="border px-4 py-2 relative">
                    {/* Three-dot menu */}
                    <button className="btn btn-secondary" onClick={() => toggleMenu(sale.id)}>
                      ⋮
                    </button>
                    {openMenu[sale.id] && (
                      <div className={`absolute ${language === 'ur' ? 'left-1.5' : 'right-1.5'} mt-2 w-28 text-center bg-white border border-gray-300 rounded-lg shadow-lg z-20 block`}>
                        <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('edit', sale.id)}>
                          {languageData[language].edit}
                        </button>
                        <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('view', sale.id)}>
                          {languageData[language].view}
                        </button>
                        {updatedCredit > 0 && (
                          <>
                            <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('addPayment', sale.id)}>
                              {languageData[language].add_payment}
                            </button>
                            <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('viewPayment', sale.id)}>
                              {languageData[language].view_payment}
                            </button>
                          </>
                        )}
                        <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('saleReturn', sale.id)}>
                          {languageData[language].sale_return}
                        </button>
                        <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('print', sale.id)}>
                          {languageData[language].print}
                        </button>
                        <button className="text-red-600 block px-4 py-2 hover:bg-red-100" onClick={() => handleMenuAction('delete', sale.id)}>
                          {languageData[language].delete}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-500">{languageData[language].no_sales_records}</p>
      )}
    </div>
  </div>
  
  );
};

export default Sales;