import React, { useState } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { FaFileInvoice, FaUsers } from "react-icons/fa";
import StatisticsDasbord from "../components/element/StatisticsDasbord.jsx";
import { MdInventory } from "react-icons/md";
import { Link } from "react-router-dom";

const POSDashboard = () => {
  const context = useAppContext(); 
  const customers = context.supplierCustomerContext.customers;
  const suppliers = context.supplierCustomerContext.suppliers;
  const products = context.productContext.products;


  return (
    <div className="flex">
      <div className="flex-1 bg-gray-100 min-h-screen p-6">
        
<StatisticsDasbord/>


        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-green-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>Customers</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{customers.length}</p>
            <Link to="/people/customers" className="btn bg-white text-green-500 mt-4">View Customers</Link>
          </div>
          <div className="card bg-yellow-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>Suppliers</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{suppliers.length}</p>
            <Link to="/people/suppliers" className="btn bg-white text-yellow-500 mt-4">View Suppliers</Link>
          </div>
          <div className="card bg-purple-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <MdInventory />
              <span>Products</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{products.length}</p>
            <Link to="/inventory/Products" className="btn bg-white text-purple-500 mt-4">View Products</Link>
          </div>
         
        </div>
      </div>
    </div>
  );
};

export default POSDashboard;