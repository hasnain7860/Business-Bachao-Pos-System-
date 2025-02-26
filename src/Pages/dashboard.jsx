import React, { useState } from "react";
import { useAppContext } from "../Appfullcontext.jsx";import { FaShoppingCart, FaMoneyBillWave, FaCreditCard, FaMoneyCheckAlt,FaFileInvoice, FaUsers } from "react-icons/fa";
import { MdReport } from "react-icons/md";

import { MdInventory } from "react-icons/md";
import { Link } from "react-router-dom";


const POSDashboard = () => {
  const context = useAppContext(); 
  const customers = context.supplierCustomerContext.customers;
  const suppliers = context.supplierCustomerContext.suppliers;
  const products = context.productContext.products;
  const userAndBusinessDetail = context.settingContext.settings;
  const [filter, setFilter] = useState("daily");
  const sales = context.SaleContext.Sales;
  const creditRecord = context.creditManagementContext.submittedRecords;
  const costData = context.costContext.costData;
const currency = userAndBusinessDetail?.[0]?.business?.currency ?? '$'

function generateSalesData(sales, costData, creditRecord) {
  const salesData = {
    daily: { sales: 0, profit: 0, loss: 0, credit: 0, payment: 0 },
    weekly: { sales: 0, profit: 0, loss: 0, credit: 0, payment: 0 },
    monthly: { sales: 0, profit: 0, loss: 0, credit: 0, payment: 0 },
  };

  const today = new Date().toISOString().split("T")[0];
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  sales.forEach((sale) => {
    const saleDate = sale.dateTime.split("T")[0];
    const saleMonth = new Date(saleDate).getMonth();
    const saleYear = new Date(saleDate).getFullYear();
    const totalBill = parseFloat(sale.totalBill) || 0;

    // **Purchase Cost Calculation**
    const purchaseCost = sale.products.reduce(
      (acc, product) => acc + (parseFloat(product.purchasePrice) || 0) * (parseInt(product.SellQuantity) || 0),
      0
    );

    let profit = totalBill - purchaseCost;

    // **Daily Cost (Only Today's Cost)**
    let dailyCost = costData.reduce((acc, cost) => {
      return cost.date === today ? acc + parseFloat(cost.cost || 0) : acc;
    }, 0);

    // **Weekly Cost (Only Last 7 Days Cost)**
    let weeklyCost = costData.reduce((acc, cost) => {
      const costDate = new Date(cost.date);
      return costDate >= oneWeekAgo ? acc + parseFloat(cost.cost || 0) : acc;
    }, 0);

    // **Monthly Cost (Only Current Month Cost)**
    let monthlyCost = costData.reduce((acc, cost) => {
      const costDate = new Date(cost.date);
      return costDate.getMonth() === saleMonth && costDate.getFullYear() === saleYear
        ? acc + parseFloat(cost.cost || 0)
        : acc;
    }, 0);

    // Handling credit and payments
    let totalCredit = parseFloat(sale.credit) || 0;
    let totalPayment = parseFloat(sale.amountPaid) || 0;

    // Add extra payments from addPayment array
    if (Array.isArray(sale.addPayment)) {
      totalPayment += sale.addPayment.reduce((acc, payment) => acc + (parseFloat(payment.amount) || 0), 0);
    }

    // Handling separate credit/payment records
    creditRecord.forEach((record) => {
      if (record.date === saleDate) {
        if (record.type === "credit") {
          totalCredit += parseFloat(record.amount) || 0;
        } else if (record.type === "payment") {
          totalPayment += parseFloat(record.amount) || 0;
        }
      }
    });

    // **Deduct Payments from Credit**
    totalCredit -= totalPayment;
    if (totalCredit < 0) totalCredit = 0; // Ensuring credit doesn't go negative

    // **Profit Calculation with Cost**
    let dailyProfit = profit - dailyCost;
    let weeklyProfit = profit - weeklyCost;
    let monthlyProfit = profit - monthlyCost;

    // **If profit is negative, convert it into loss**
    let dailyLoss = 0,
      weeklyLoss = 0,
      monthlyLoss = 0;
    if (dailyProfit < 0) {
      dailyLoss = Math.abs(dailyProfit);
      dailyProfit = 0;
    }
    if (weeklyProfit < 0) {
      weeklyLoss = Math.abs(weeklyProfit);
      weeklyProfit = 0;
    }
    if (monthlyProfit < 0) {
      monthlyLoss = Math.abs(monthlyProfit);
      monthlyProfit = 0;
    }

    // Updating sales data
    if (saleDate === today) {
      salesData.daily.sales += totalBill;
      salesData.daily.profit += dailyProfit;
      salesData.daily.loss += dailyLoss;
      salesData.daily.credit += totalCredit;
      salesData.daily.payment += totalPayment;
    }

    if (new Date(saleDate) >= oneWeekAgo) {
      salesData.weekly.sales += totalBill;
      salesData.weekly.profit += weeklyProfit;
      salesData.weekly.loss += weeklyLoss;
      salesData.weekly.credit += totalCredit;
      salesData.weekly.payment += totalPayment;
    }

    if (new Date(saleDate) >= oneMonthAgo) {
      salesData.monthly.sales += totalBill;
      salesData.monthly.profit += monthlyProfit;
      salesData.monthly.loss += monthlyLoss;
      salesData.monthly.credit += totalCredit;
      salesData.monthly.payment += totalPayment;
    }
  });

  // Round values to 2 decimal places
  Object.keys(salesData).forEach((period) => {
    Object.keys(salesData[period]).forEach((key) => {
      salesData[period][key] = parseFloat(salesData[period][key]).toFixed(2);
    });
  });

  return salesData;
}



const salesData = generateSalesData(sales, costData, creditRecord);
console.log(salesData);





  return (
    <div className="flex">
      <div className="flex-1 bg-gray-100 min-h-screen p-6">
        {/* Filter Buttons */}
        <div className="flex justify-end mb-4">
          <button className={`px-4 py-2 mx-2 rounded ${filter === "daily" ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setFilter("daily")}>Daily</button>
          <button className={`px-4 py-2 mx-2 rounded ${filter === "weekly" ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setFilter("weekly")}>Weekly</button>
          <button className={`px-4 py-2 mx-2 rounded ${filter === "monthly" ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setFilter("monthly")}>Monthly</button>
        </div>

        {/* Sales and Profit/Loss Blocks */}<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
  {/* Sales Card */}
  <div className="card bg-blue-500 text-white p-4 shadow-lg rounded-lg">
    <h2 className="text-lg font-semibold flex items-center space-x-2">
      <FaShoppingCart />
      <span>{filter.charAt(0).toUpperCase() + filter.slice(1)} Sales</span>
    </h2>
    <p className="text-2xl font-bold mt-2">
      {currency} {salesData[filter].sales}
    </p>
  </div>

  {/* Profit Card */}
  <div className="card bg-green-500 text-white p-4 shadow-lg rounded-lg">
    <h2 className="text-lg font-semibold flex items-center space-x-2">
      <FaMoneyBillWave />
      <span>{filter.charAt(0).toUpperCase() + filter.slice(1)} Profit</span>
    </h2>
    <p className="text-2xl font-bold mt-2">
      {currency} {salesData[filter].profit}
    </p>
  </div>

  {/* Loss Card */}
  <div className="card bg-red-500 text-white p-4 shadow-lg rounded-lg">
    <h2 className="text-lg font-semibold flex items-center space-x-2">
      <MdReport />
      <span>{filter.charAt(0).toUpperCase() + filter.slice(1)} Loss</span>
    </h2>
    <p className="text-2xl font-bold mt-2">
      {currency} {salesData[filter].loss}
    </p>
  </div>

  {/* Credit Card */}
  <div className="card bg-yellow-500 text-white p-4 shadow-lg rounded-lg">
    <h2 className="text-lg font-semibold flex items-center space-x-2">
      <FaCreditCard />
      <span>{filter.charAt(0).toUpperCase() + filter.slice(1)} Credit</span>
    </h2>
    <p className="text-2xl font-bold mt-2">
      {currency} {salesData[filter].credit}
    </p>
  </div>

  {/* Payment Card */}
  <div className="card bg-purple-500 text-white p-4 shadow-lg rounded-lg">
    <h2 className="text-lg font-semibold flex items-center space-x-2">
      <FaMoneyCheckAlt />
      <span>{filter.charAt(0).toUpperCase() + filter.slice(1)} Payment</span>
    </h2>
    <p className="text-2xl font-bold mt-2">
      {currency} {salesData[filter].payment}
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