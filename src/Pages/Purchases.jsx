import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';


const Purchases = () => {
  const navigate = useNavigate();

  const handleAddPurchase = () => {
    navigate('/purchases/new');
  };
  
const context = useAppContext();
const purchasesData = context.purchases
  
  return (
    <div className="p-4">
      <button
        onClick={handleAddPurchase}
        className="mb-4 btn btn-primary"
      >
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {purchasesData.map((purchase , index) => (
              <tr key={purchase.id}>
                <td>{index}</td>
                <td>{purchase.supplierName}</td>
                <td>{purchase.total}</td>
                <td>{purchase.paymentMode}</td>
                <td>{purchase.date}</td>
                <td>
                  <div className="flex space-x-2">
                    <button className="btn btn-sm btn-outline-primary">
                      <FaEdit />
                    </button>
                    <button className="btn btn-sm btn-outline-danger">
                      <FaTrashAlt />
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

export default Purchases;