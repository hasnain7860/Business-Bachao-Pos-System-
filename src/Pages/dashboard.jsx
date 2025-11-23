import React, { useMemo } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { FaFileInvoice, FaUsers, FaMoneyBillWave, FaArrowDown, FaArrowUp } from "react-icons/fa";
import StatisticsDasboard from "../components/element/StatisticsDasboard.jsx"; // Ensure filename matches
import { MdInventory } from "react-icons/md";
import { Link } from "react-router-dom";
import languageData from "../assets/languageData.json";

const POSDashboard = () => {
  const context = useAppContext();
  const { language } = context;

  // --- Data Sources ---
  const allSales = context.SaleContext.Sales || [];
  const allPurchases = context.purchaseContext.purchases || [];
  const allPeoples = context.peopleContext.people || [];
  const products = context.productContext.products;
  const submittedRecords = context.creditManagementContext.submittedRecords || [];
  const sellReturns = context.SellReturnContext.sellReturns || [];
  const purchaseReturns = context.purchaseReturnContext.purchaseReturns || [];
  
  const userAndBusinessDetail = context.settingContext.settings;
  const currency = userAndBusinessDetail?.[0]?.business?.currency ?? '$';

  // --- NET BALANCE CALCULATION LOGIC (Matches CreditManagement.js) ---
  const balanceSummary = useMemo(() => {
    const balancesData = allPeoples.map(person => {
        
        // 1. SALES (Receivable +)
        const sales = allSales.filter(s => s.personId === person.id);
        const salesCredit = sales.reduce((acc, s) => acc + (parseFloat(s.credit) || 0), 0);

        // 2. MANUAL RECORDS
        const records = submittedRecords.filter(r => r.personId === person.id);
        // Manual Credit (Loan Given / Old Balance) -> Receivable +
        const manualCredit = records.filter(r => r.type === 'credit').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
        // Manual Payment (Cash Received) -> Payable - (Reduces Balance)
        const manualPayment = records.filter(r => r.type === 'payment').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);

        // 3. RETURNS
        // Sales Return (Reduces Customer Debt) -> Payable -
        const sReturns = sellReturns.filter(r => r.peopleId === person.id);
        const salesReturnAdj = sReturns.reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);

        // Purchase Return (Reduces Our Liability) -> Receivable +
        const pReturns = purchaseReturns.filter(r => r.people === person.id || r.peopleId === person.id);
        const purchReturnAdj = pReturns.reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);

        // 4. PURCHASES (Payable -)
        const purchases = allPurchases.filter(p => p.personId === person.id);
        const purchaseCredit = purchases.reduce((acc, p) => acc + (parseFloat(p.credit) || 0), 0);

        // --- FORMULA ---
        const totalReceivablePlus = salesCredit + manualCredit + purchReturnAdj;
        const totalPayableMinus = purchaseCredit + manualPayment + salesReturnAdj;
        
        const netBalance = totalReceivablePlus - totalPayableMinus;
        
        return { balance: netBalance };
    }).filter(p => Math.abs(p.balance) > 0.01); // Ignore zero balances

    // Summary Accumulation
    return balancesData.reduce((acc, item) => {
        if (item.balance > 0) {
            // Positive Balance = Receivable (Lene Hain)
            acc.totalReceivable += item.balance;
            acc.debtorsCount += 1;
        } else {
            // Negative Balance = Payable (Dene Hain)
            acc.totalPayable += Math.abs(item.balance);
            acc.creditorsCount += 1;
        }
        return acc;
    }, { totalReceivable: 0, totalPayable: 0, debtorsCount: 0, creditorsCount: 0 });
  }, [allPeoples, allSales, allPurchases, submittedRecords, sellReturns, purchaseReturns]);


  // --- Total Stock Value Calculation ---
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
        
        {/* Statistics Section (Includes Damage & Profit/Loss) */}
        <StatisticsDasboard />

        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. TOTAL RECEIVABLE */}
          <div className="card bg-teal-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaArrowDown />
              <span>Total Receivable</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{currency} {balanceSummary.totalReceivable.toFixed(2)}</p>
            <Link to="/report" className="btn bg-white text-teal-500 mt-4 border-0 hover:bg-gray-100">View Reports</Link>
          </div>
          
          {/* 2. TOTAL PAYABLE */}
          <div className="card bg-rose-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaArrowUp />
              <span>Total Payable</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{currency} {balanceSummary.totalPayable.toFixed(2)}</p>
            <Link to="/report" className="btn bg-white text-rose-500 mt-4 border-0 hover:bg-gray-100">View Reports</Link>
          </div>

          {/* 3. DEBTORS */}
           <div className="card bg-sky-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>Debtors (Lene Hain)</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{balanceSummary.debtorsCount}</p>
            <Link to="/report" className="btn bg-white text-sky-500 mt-4 border-0 hover:bg-gray-100">View List</Link>
          </div>

          {/* 4. CREDITORS */}
          <div className="card bg-orange-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>Creditors (Dene Hain)</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{balanceSummary.creditorsCount}</p>
            <Link to="/report" className="btn bg-white text-orange-500 mt-4 border-0 hover:bg-gray-100">View List</Link>
          </div>

          {/* 5. PEOPLE */}
          <div className="card bg-green-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>{languageData[language].people}</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{allPeoples.length}</p>
            <Link to="/people" className="btn bg-white text-green-500 mt-4 border-0 hover:bg-gray-100">
            {languageData[language].view} {languageData[language].people}</Link>
          </div>

          {/* 6. PRODUCTS */}
          <div className="card bg-purple-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <MdInventory />
              <span>{languageData[language].products}</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{products.length}</p>
            <Link to="/inventory/Products" className="btn bg-white text-purple-500 mt-4 border-0 hover:bg-gray-100">View Products</Link>
          </div>
          
          {/* 7. SALES COUNT */}
          <div className="card bg-blue-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaMoneyBillWave />
              <span>{languageData[language].sales}</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{allSales.length}</p>
            <Link to="/sales" className="btn bg-white text-blue-500 mt-4 border-0 hover:bg-gray-100">View Sales</Link>
          </div>
          
          {/* 8. STOCK VALUE */}
          <div className="card bg-red-500 text-white p-4 shadow-lg rounded-lg">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaFileInvoice />
              <span>Total Stock Value</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{currency} {totalPurchaseValue.toFixed(2)}</p>
            <Link to="/inventory/Products" className="btn bg-white text-red-500 mt-4 border-0 hover:bg-gray-100">View Inventory</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSDashboard;


