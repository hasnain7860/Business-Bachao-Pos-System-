import React, { useEffect, } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { FaFileInvoice, FaUsers } from "react-icons/fa";
import StatisticsDasboard from "../components/element/StatisticsDasboard.jsx";
import { MdInventory } from "react-icons/md";
import { Link } from "react-router-dom";
import languageData from "../assets/languageData.json";
import checkExpiringProducts from "../Utils/checkExpiringProducts.jsx";

const POSDashboard = () => {
  const context = useAppContext();
  const customers = context.supplierCustomerContext.customers;
  const suppliers = context.supplierCustomerContext.suppliers;
  const products = context.productContext.products;
  const { language } = context;
  const userAndBusinessDetail = context.settingContext.settings;
const currency = userAndBusinessDetail?.[0]?.business?.currency ?? '$'
  const sales = context.SaleContext.Sales;

  // Calculate total purchase value with validation
  const totalPurchaseValue = products.reduce((total, product) => {
    if (!product.batchCode || !Array.isArray(product.batchCode)) {
      return total;
    }

    const productTotal = product.batchCode.reduce((batchTotal, batch) => {
      if (!batch.purchasePrice || !batch.quantity) {
        return batchTotal;
      }
      return batchTotal + (parseFloat(batch.purchasePrice) * parseInt(batch.quantity));
    }, 0);

    return total + productTotal;
  }, 0);

  // useEffect(() => {
  //   // checkExpiringProducts(context)
  // }, []);

  return (
    <div className="flex">
      <div className="flex-1 bg-gray-100 min-h-screen p-6">
        <StatisticsDasboard />

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-green-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>{languageData[language].customers}</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{customers.length}</p>
            <Link to="/people/customers" className="btn bg-white text-green-500 mt-4">View Customers</Link>
          </div>
          <div className="card bg-yellow-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>{languageData[language].suppliers}</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{suppliers.length}</p>
            <Link to="/people/suppliers" className="btn bg-white text-yellow-500 mt-4">View Suppliers</Link>
          </div>
          <div className="card bg-purple-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <MdInventory />
              <span>{languageData[language].products}</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{products.length}</p>
            <Link to="/inventory/Products" className="btn bg-white text-purple-500 mt-4">View Products</Link>
          </div>
          <div className="card bg-blue-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex itemsCenter space-x-2">
              <MdInventory />
              <span>{languageData[language].sales}</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{sales.length}</p>
            <Link to="/sales" className="btn bg-white text-blue-500 mt-4">View Sales</Link>
          </div>
          <div className="card bg-red-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaFileInvoice />
              <span>Total Purchase Value</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{currency} {totalPurchaseValue.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSDashboard;