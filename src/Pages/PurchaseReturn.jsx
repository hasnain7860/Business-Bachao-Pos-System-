import React, { useState, useEffect } from 'react';
import { FaPlus, FaUndo, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAppContext } from '../Appfullcontext';
import languageData from "../assets/languageData.json";

const PurchaseReturn = () => {
  const context = useAppContext();
  const purchaseReturnsData = context.purchaseReturnContext?.purchaseReturns || [];
  console.log(purchaseReturnsData)
  console.log(purchaseReturnsData)
  const deletePurchaseReturn = context.purchaseReturnContext?.delete;
  const { language } = context;
  
  // Get currency from settings
  const userAndBusinessDetail = context.settingContext.settings;
  const currency = userAndBusinessDetail?.[0]?.business?.currency ?? 'Rs.';

  // Format date helper function
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle delete
  const handleDelete = (id) => {
    if (window.confirm(languageData[language].areYouSureDelete)) {
      deletePurchaseReturn(id);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Purchase Returns</h2>
        <Link to="/return/purchase_return/add">
          <button className="btn btn-primary">
            <FaPlus className="mr-2" /> Add Return
          </button>
        </Link>
      </div>

      <div className="overflow-x-auto h-[70vh]">
        <table className="table table-zebra w-full">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              <th>Return Ref</th>
              <th>Date</th>
              <th>Purchase Ref</th>
              <th>Items Count</th>
              <th>Total Amount</th>
              <th>Cash Return</th>
              <th>Credit Adjustment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseReturnsData.map((row) => (
              <tr key={row.id}>
                <td>{row.returnRefNo}</td>
                <td>{formatDate(row.returnDate)}</td>
                <td>{row.purchaseRef}</td>
                <td>{row.items.length}</td>
                <td>{currency}{row.totalAmount}</td>
                <td>{currency}{row.paymentDetails.cashReturn}</td>
                <td>{currency}{row.paymentDetails.creditAdjustment}</td>
                <td>
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(row.id)}
                    >
                      <FaTrash className="text-error" />
                    </button>
                    
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

export default PurchaseReturn;