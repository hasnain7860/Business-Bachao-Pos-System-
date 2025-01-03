
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaEllipsisV } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';

const Purchases = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const purchasesData = context.purchaseContext.purchases;
  console.log(purchasesData)
  const handleDelete = context.purchaseContext.delete
  const [menuOpen, setMenuOpen] = useState(null); // Track which menu is open

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
  };

  return (
    <div className="p-4">
      <button onClick={handleAddPurchase} className="mb-4 btn btn-primary">
        Add Purchase
      </button>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Purchase No</th>
              <th>Supplier</th>
              <th>Total Bill</th>
              <th>Payment Mode</th>
              <th>Date</th>
              <th>Payment Status</th>
              <th>Credit </th>
              <th>Action</th>
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
                <td>{(purchase.totalBill -purchase.totalPayment) == 0 ? 'Full' : 'Due'}</td>
                <td>{purchase.totalBill-purchase.totalPayment}</td>
                <td>
                  <div className="relative">
                    <button
                      onClick={() => toggleMenu(index)}
                      className="btn btn-sm"
                    >
                      <FaEllipsisV />
                    </button>
                    {menuOpen == index && (
                      <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-10">
                        <button onClick={() => handleView(purchase)} className="block px-4 py-2 hover:bg-gray-100">View</button>
                        <button onClick={() => handleEdit(purchase)} className="block px-4 py-2 hover:bg-gray-100">Edit</button>
                        <button onClick={() => handleDelete(purchase.id)} className="block px-4 py-2 hover:bg-gray-100">Delete</button>
                        {(purchase.totalBill -purchase.totalPayment) !== 0 && (
                          <button onClick={() => handleAddPayment(purchase)} className="block px-4 py-2 text-red-600 hover:bg-gray-100">Add Payment</button>
                        )}
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
