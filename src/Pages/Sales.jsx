
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../Appfullcontext';

const Sales = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const sales = context.SaleContext.Sales;
  const customers = context.supplierCustomerContext.customers;
  const userAndBusinessDetail = context.settingContext.settings;

  const handleNewSale = () => {
    navigate('/sales/new');
  };

  const handleCustomerNameViaId = (sale) => {
    const existCustomer = customers.filter((customer) => customer.id === sale.customerId);
    return existCustomer.length > 0 ? existCustomer[0].name : "name not found";
  };

  const getStatus = (sale) => {
    return sale.credit === 0 ? 'Paid' : 'Pending';
  };

  const handleMenuAction = (action, salesRefNo) => {
    switch (action) {
      case 'edit':
        navigate(`/sales/edit/${salesRefNo}`);
        break;
      case 'view':
        navigate(`/sales/view/${salesRefNo}`);
        break;
      case 'print':
        navigate(`/sales/view/${salesRefNo}/print`);
        // Add your print logic here
        break;
      case 'delete':
        context.SaleContext.delete(salesRefNo);
        // Add your delete logic here
        break;
      default:
        break;
    }
  };

  // State to manage which menu is open
  const [openMenu, setOpenMenu] = useState({});

  const toggleMenu = (salesRefNo) => {
    setOpenMenu((prevState) => ({
      ...prevState,
      [salesRefNo]: !prevState[salesRefNo], // Toggle the specific saleId menu
    }));
  };

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-6">Sales Records</h1>

      {/* New Sale Button */}
      <button className="btn btn-primary mb-4" onClick={handleNewSale}>
        New Sale
      </button>

      {/* Sales Table */}
      <div className="overflow-x-auto mb-4">
        {sales.length > 0 ? (
          <table className="table-auto w-full mb-4">
            <thead>
              <tr>
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Customer Name</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Total Bill</th>
                <th className="px-4 py-2">Paid Bill</th>
                <th className="px-4 py-2">Credit</th>
                <th className="px-4 py-2">Payment Mode</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale ,index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{index + 1}</td>
                  <td className="border px-4 py-2">{handleCustomerNameViaId(sale)}</td>
                  <td className="border px-4 py-2">{sale.dateTime}</td>
                  <td className="border px-4 py-2">{userAndBusinessDetail[0].business.currency}{sale.totalBill}</td>
                  <td className="border px-4 py-2">{userAndBusinessDetail[0].business.currency}{sale.amountPaid}</td>
                  <td className="border px-4 py-2">{userAndBusinessDetail[0].business.currency}{sale.credit}</td>
                  <td className="border px-4 py-2">{sale.paymentMode}</td>
                  <td className="border px-4 py-2">{getStatus(sale)}</td>
                  <td className="border px-4 py-2 relative">
                    {/* Three-dot menu */}
                    <button className="btn btn-secondary" onClick={() => toggleMenu(sale.salesRefNo)}>
                      ⋮
                    </button>
                    {openMenu[sale.salesRefNo] && (
                      <div className="absolute right-1.5 mt-2 w-20 text-center bg-white border border-gray-300 rounded-lg shadow-lg z-20 block">
                        <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('edit', sale.salesRefNo)}>Edit</button>
                        <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('view', sale.salesRefNo)}>View</button>
                        <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('print', sale.salesRefNo)}>Print</button>
                        <button className="text-red-600 block px-4 py-2 hover:bg-red100" onClick={() => handleMenuAction('delete', sale.salesRefNo)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500">No sales records available.</p>
        )}
      </div>
    </div>
  );
};

export default Sales;
