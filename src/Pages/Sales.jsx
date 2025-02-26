
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../Appfullcontext';

const Sales = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const sales = context.SaleContext.Sales;
  console.log(sales)
  const customers = context.supplierCustomerContext.customers;
  const userAndBusinessDetail = context.settingContext.settings;

const currency = userAndBusinessDetail?.[0]?.business?.currency ?? '$'
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
        // Add your print logic here
        break;
        case 'addPayment':
          navigate(`/sales/addPayments/${id}`);
          break;  
          case 'viewPayment':
            navigate(`/sales/viewPayments/${id}`);
            break;  
      case 'delete':
        context.SaleContext.delete(id);
        // Add your delete logic here
        break;
      default:
        break;
    }
  };

  // State to manage which menu is open
  const [openMenu, setOpenMenu] = useState({});

  const toggleMenu = (id) => {
    setOpenMenu((prevState) => ({
      ...prevState,
      [id]: !prevState[id], // Toggle the specific saleId menu
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
            {sales.map((sale, index) => {
  // AddPayments array se total paid amount calculate karna
  const totalPaidFromPayments = Array.isArray(sale?.addPayment)
  ? sale.addPayment.reduce((sum, payment) => {
      const amount = Number(payment?.amount);
      return !isNaN(amount) && amount >= 0 ? sum + amount : sum;
    }, 0)
  : 0;


  // Updated amounts
  const updatedAmountPaid = Number(sale.amountPaid)   + totalPaidFromPayments;
  const updatedCredit = sale.credit - totalPaidFromPayments;

  return (
    <tr key={index}>
      <td className="border px-4 py-2">{index + 1}</td>
      <td className="border px-4 py-2">{handleCustomerNameViaId(sale)}</td>
      <td className="border px-4 py-2">{sale.dateTime}</td>
      <td className="border px-4 py-2">{currency} {sale.totalBill}</td>
      <td className="border px-4 py-2">{currency} {updatedAmountPaid}</td>
      <td className="border px-4 py-2">{currency} {updatedCredit}</td>
      <td className="border px-4 py-2">{sale.paymentMode}</td>
      <td className="border px-4 py-2">{updatedCredit === 0 ? 'Paid' : 'Pending'}</td>
      <td className="border px-4 py-2 relative">
        {/* Three-dot menu */}
        <button className="btn btn-secondary" onClick={() => toggleMenu(sale.id)}>
          ⋮
        </button>
        {openMenu[sale.id] && (
          <div className="absolute right-1.5 mt-2 w-20 text-center bg-white border border-gray-300 rounded-lg shadow-lg z-20 block">
            <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('edit', sale.id)}>Edit</button>
            <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('view', sale.id)}>View</button>
            {updatedCredit > 0 && (
              <>
              <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('addPayment', sale.id)}>Add Payment</button>
              <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('viewPayment', sale.id)}>View Payment</button>
            </>)}
            <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => handleMenuAction('print', sale.id)}>Print</button>
            <button className="text-red-600 block px-4 py-2 hover:bg-red100" onClick={() => handleMenuAction('delete', sale.id)}>Delete</button>
          </div>
        )}
      </td>
    </tr>
  );
})}

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
