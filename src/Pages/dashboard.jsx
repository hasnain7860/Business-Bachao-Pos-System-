import React, { useMemo } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
// Icons ko update kiya gaya hai
import { FaFileInvoice, FaUsers, FaMoneyBillWave, FaArrowDown, FaArrowUp } from "react-icons/fa";
import StatisticsDasboard from "../components/element/StatisticsDasboard.jsx";
import { MdInventory } from "react-icons/md";
import { Link } from "react-router-dom";
import languageData from "../assets/languageData.json";

const POSDashboard = () => {
  const context = useAppContext();
  const { language } = context;

  // --- Naya Data Context se liya gaya ---
  const allSales = context.SaleContext.Sales || [];
  const allPurchases = context.purchaseContext.purchases || [];
  const allPeoples = context.peopleContext.people || [];
  const products = context.productContext.products;
  const submittedRecords = context.creditManagementContext.submittedRecords || [];
  const sellReturns = context.SellReturnContext.sellReturns || [];
  const purchaseReturns = context.purchaseReturnContext.purchaseReturns || [];
  
  const userAndBusinessDetail = context.settingContext.settings;
  const currency = userAndBusinessDetail?.[0]?.business?.currency ?? '$';

  // --- NAYA LOGIC: Receivable aur Payable ki summary calculate karne ke liye ---
  const balanceSummary = useMemo(() => {
    const balancesData = allPeoples.map(person => {
        // Receivable (Hum ne lene hain)
        const totalSalesCredit = allSales.filter(s => s.personId === person.id).reduce((acc, s) => acc + (parseFloat(s.credit) || 0), 0);
        const manualCredit = submittedRecords.filter(r => r.personId === person.id && r.type === 'credit').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
        const totalReceivablePerson = totalSalesCredit + manualCredit;
        
        // Payments/Reductions (Customer ne diye ya adjust hue)
        const manualPayments = submittedRecords.filter(r => r.personId === person.id && r.type === 'payment').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
        const sellReturnAdjustments = sellReturns.filter(r => r.peopleId === person.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
        const totalReductions = manualPayments + sellReturnAdjustments;
        
        const netReceivable = totalReceivablePerson - totalReductions;

        // Payable (Hum ne dene hain)
        const totalPurchaseCredit = allPurchases.filter(p => p.personId === person.id).reduce((acc, p) => acc + (parseFloat(p.credit) || 0), 0);
        const purchaseReturnAdjustments = purchaseReturns.filter(r => r.people === person.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
        const netPayable = totalPurchaseCredit - purchaseReturnAdjustments;

        const finalBalance = netReceivable - netPayable;
        
        return { balance: finalBalance };
    }).filter(p => p.balance !== 0);

    // Summary calculate karna
    return balancesData.reduce((acc, item) => {
        if (item.balance > 0) {
            acc.totalReceivable += item.balance;
            acc.debtorsCount += 1;
        } else {
            acc.totalPayable += Math.abs(item.balance);
            acc.creditorsCount += 1;
        }
        return acc;
    }, { totalReceivable: 0, totalPayable: 0, debtorsCount: 0, creditorsCount: 0 });
  }, [allPeoples, allSales, allPurchases, submittedRecords, sellReturns, purchaseReturns]); // Dependencies


  // Calculate total purchase value with validation
  const totalPurchaseValue = useMemo(() => products.reduce((total, product) => {
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
  }, 0), [products]);

  return (
    <div className="flex">
      <div className="flex-1 bg-gray-100 min-h-screen p-6">
        <StatisticsDasboard />

        {/* Dashboard Content - ab isme 8 cards honge */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* --- NAYA CARD: TOTAL RECEIVABLE --- */}
          <div className="card bg-teal-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaArrowDown />
              <span>Total Receivable</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{currency} {balanceSummary.totalReceivable.toFixed(2)}</p>
            <Link to="/report" className="btn bg-white text-teal-500 mt-4">
              View Reports
            </Link>
          </div>
          
          {/* --- NAYA CARD: TOTAL PAYABLE --- */}
          <div className="card bg-rose-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaArrowUp />
              <span>Total Payable</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{currency} {balanceSummary.totalPayable.toFixed(2)}</p>
            <Link to="/report" className="btn bg-white text-rose-500 mt-4">
              View Reports
            </Link>
          </div>

          {/* --- NAYA CARD: DEBTORS --- */}
           <div className="card bg-sky-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>Debtors (Lene Hain)</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{balanceSummary.debtorsCount}</p>
            <Link to="/report" className="btn bg-white text-sky-500 mt-4">
              View Details
            </Link>
          </div>

          {/* --- NAYA CARD: CREDITORS --- */}
          <div className="card bg-orange-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>Creditors (Dene Hain)</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{balanceSummary.creditorsCount}</p>
            <Link to="/report" className="btn bg-white text-orange-500 mt-4">
              View Details
            </Link>
          </div>

          {/* Purane Cards */}
          <div className="card bg-green-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>{languageData[language].people}</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{allPeoples.length}</p>
            <Link to="/people" className="btn bg-white text-green-500 mt-4">
            {languageData[language].view} {languageData[language].people}</Link>
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
              <FaMoneyBillWave />
              <span>{languageData[language].sales}</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{allSales.length}</p>
            <Link to="/sales" className="btn bg-white text-blue-500 mt-4">View Sales</Link>
          </div>
          
          <div className="card bg-red-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaFileInvoice />
              <span>Total Purchase Value</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{currency} {totalPurchaseValue.toFixed(2)}</p>
            <Link to="/purchases" className="btn bg-white text-red-500 mt-4">View Purchases</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSDashboard;
