import React, { useState } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { 
  FaUsers, 
  FaShoppingCart, 
  FaFileInvoice, 
  FaMoneyBillWave, 
  FaRegChartBar, 
} from "react-icons/fa";
import { MdInventory, MdReport } from "react-icons/md";
import { Link } from "react-router-dom";


const POSDashboard = () => {
  const context = useAppContext(); 
  const customers = context.supplierCustomerContext.customers;
  const suppliers = context.supplierCustomerContext.suppliers;
  const products = context.productContext.products;
  const userAndBusinessDetail = context.settingContext.settings;
  const [filter, setFilter] = useState("daily");
  const sales = context.SaleContext.Sales;
const currency = userAndBusinessDetail?.[0]?.business?.currency ?? '$'
  // Mock data for sales and profit/loss (Replace with real API data)
  const salesData = {
    daily: { sales: 2000, profit: 500, loss: 100 },
    weekly: { sales: 14000, profit: 3500, loss: 700 },
    monthly: { sales: 60000, profit: 15000, loss: 3000 },
  };
 
  return (
    <div className="flex">
      <div className="flex-1 bg-gray-100 min-h-screen p-6">
        {/* Filter Buttons */}
        <div className="flex justify-end mb-4">
          <button className={`px-4 py-2 mx-2 rounded ${filter === "daily" ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setFilter("daily")}>Daily</button>
          <button className={`px-4 py-2 mx-2 rounded ${filter === "weekly" ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setFilter("weekly")}>Weekly</button>
          <button className={`px-4 py-2 mx-2 rounded ${filter === "monthly" ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setFilter("monthly")}>Monthly</button>
        </div>

        {/* Sales and Profit/Loss Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="card bg-blue-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaShoppingCart />
              <span>{filter.charAt(0).toUpperCase() + filter.slice(1)} Sales</span>
            </h2>
            <p className="text-2xl font-bold mt-2">
              {currency} {salesData[filter].sales}
            </p>
          </div>
          <div className="card bg-green-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaMoneyBillWave />
              <span>{filter.charAt(0).toUpperCase() + filter.slice(1)} Profit</span>
            </h2>
            <p className="text-2xl font-bold mt-2">
              {currency} {salesData[filter].profit}
            </p>
          </div>
          <div className="card bg-red-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <MdReport />
              <span>{filter.charAt(0).toUpperCase() + filter.slice(1)} Loss</span>
            </h2>
            <p className="text-2xl font-bold mt-2">
              {currency} {salesData[filter].loss}
            </p>
          </div>
        </div>

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
          <div className="card bg-teal-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaFileInvoice />
              <span>Sales </span>
            </h2>
            <p className="text-2xl font-bold mt-2">{sales.length} Issued</p>
            <Link to="/sales" className="btn bg-white text-teal-500 mt-4">View Sales</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSDashboard;