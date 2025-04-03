import React, { useState } from 'react';
import { FaPlus, FaUndo } from 'react-icons/fa';
import { Link } from 'react-router-dom';
const SellReturn = () => {
  // Sample return data - replace with your actual data
  const [returns, setReturns] = useState([
    {
      id: 1,
      date: '2025-04-03',
      invoiceNo: 'INV-001',
      customerName: 'John Doe',
      items: 'Product A',
      amount: 1500,
      reason: 'Defective product'
    },
    // Add more sample data as needed
  ]);

 

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sales Returns</h2>
         <Link to="/return/sell_return/add">
        <button 
          className="btn btn-primary"
         
        >
          <FaPlus className="mr-2" /> Add Return
        </button>
        </Link>
      </div>

      <div className="overflow-x-auto h-[70vh]">
        <table className="table table-zebra w-full">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              <th>Return ID</th>
              <th>Date</th>
              <th>Invoice No</th>
              <th>Customer Name</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.date}</td>
                <td>{row.invoiceNo}</td>
                <td>{row.customerName}</td>
                <td>{row.items}</td>
                <td>{row.amount}</td>
                <td>{row.reason}</td>
                <td>
                  <button className="btn btn-ghost btn-sm">
                    <FaUndo className="text-primary" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellReturn;