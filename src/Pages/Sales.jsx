import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Sales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([
    // Example sales data for demonstration
    {
      id: 1,
      customerName: 'John Doe',
      date: '2024-12-01',
      totalBill: 150.00,
      paidAmount: 140.00,
      credit: 10.00,
      paymentMode: 'Cash',
    },
    // Add more sales records as needed
  ]);

  const handleNewSale = () => {
    navigate('/sales/new');
  };

  const getStatus = (sale) => {
    return sale.credit === 0 ? 'Paid' : 'Pending';
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
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="border px-4 py-2">{sale.id}</td>
                  <td className="border px-4 py-2">{sale.customerName}</td>
                  <td className="border px-4 py-2">{sale.date}</td>
                  <td className="border px-4 py-2">${sale.totalBill.toFixed(2)}</td>
                  <td className="border px-4 py-2">${sale.paidAmount.toFixed(2)}</td>
                  <td className="border px-4 py-2">${sale.credit.toFixed(2)}</td>
                  <td className="border px-4 py-2">{sale.paymentMode}</td>
                  <td className="border px-4 py-2">{getStatus(sale)}</td>
                  <td className="border px-4 py-2">
                    <button className="btn btn-warning">View</button>
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