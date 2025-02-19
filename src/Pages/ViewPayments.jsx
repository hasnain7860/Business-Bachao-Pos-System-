import React from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { useParams, useNavigate } from 'react-router-dom';

const ViewPayments = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const sales = context.SaleContext.Sales;
  const { id } = useParams();

  const sale = sales.find(sale => sale.id === id);
  const payments = sale?.addPayment || [];

  const closeModal = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">View Payments</h2>
        {payments.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Ref No</th>
                <th className="border border-gray-300 p-2">Amount</th>
                <th className="border border-gray-300 p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={index} className="text-center">
                  <td className="border border-gray-300 p-2">{payment.refNo}</td>
                  <td className="border border-gray-300 p-2">{payment.amount}</td>
                  <td className="border border-gray-300 p-2">{payment.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center">No payments added yet.</p>
        )}
        <div className="flex justify-end mt-4">
          <button
            onClick={closeModal}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPayments;
