import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAppContext } from '../Appfullcontext';
import languageData from "../assets/languageData.json";

const SellReturn = () => {
  const context = useAppContext();
  
  // --- CRITICAL FIX: Universal Store Mapping ---
  // 1. 'sellReturns' -> 'data'
  // 2. 'delete' -> 'remove'
  // 3. 'settings' -> 'data'
  const sellReturnsData = context.SellReturnContext.data || [];
  const deleteSellReturn = context.SellReturnContext.remove;
  const settingsData = context.settingContext.data || [];
  
  const { language } = context;
  const currency = settingsData[0]?.business?.currency ?? 'Rs.';

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm(languageData[language].areYouSureDelete || "Are you sure?")) {
      await deleteSellReturn(id);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sales Returns</h2>
        <Link to="/return/sell_return/add">
          <button className="btn btn-primary gap-2">
            <FaPlus /> Add Return
          </button>
        </Link>
      </div>

      <div className="overflow-x-auto h-[70vh] bg-base-100 shadow-md rounded-lg border">
        <table className="table table-zebra w-full header-sticky">
          <thead className="sticky top-0 bg-base-200 z-10">
            <tr>
              <th>Return Ref</th>
              <th>Date</th>
              <th>Sales Ref</th>
              <th>Items Count</th>
              <th>Total Amount</th>
              <th>Cash Return</th>
              <th>Credit Adj.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sellReturnsData.length > 0 ? (
                sellReturnsData.map((row) => (
                <tr key={row.id}>
                    <td className="font-bold">{row.returnRefNo || 'N/A'}</td>
                    <td>{formatDate(row.returnDate)}</td>
                    <td><span className="badge badge-ghost">{row.salesRef || 'N/A'}</span></td>
                    
                    {/* FIX: In AddSellReturn, you save items as 'items', not 'returnedProducts' */}
                    <td className="text-center font-bold">{(row.items || []).length}</td>
                    
                    <td className="font-mono">{currency} {row.totalAmount?.toFixed(2) ?? 0}</td>
                    <td className="text-green-600 font-mono">{currency} {row.paymentDetails?.cashReturn?.toFixed(2) ?? 0}</td>
                    <td className="text-blue-600 font-mono">{currency} {row.paymentDetails?.creditAdjustment?.toFixed(2) ?? 0}</td>
                
                    <td>
                        <button 
                            className="btn btn-ghost btn-sm text-error hover:bg-red-50"
                            onClick={() => handleDelete(row.id)}
                            title="Delete Return"
                        >
                            <FaTrash />
                        </button>
                    </td>
                </tr>
                ))
            ) : (
                <tr>
                    <td colSpan="8" className="text-center py-10 text-gray-500">
                        No sales returns found.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellReturn;

