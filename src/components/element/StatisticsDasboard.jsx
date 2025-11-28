import React, { useState, useMemo } from "react";
import { useAppContext } from "../../Appfullcontext";
import { 
    FaShoppingCart, FaMoneyBillWave, FaCreditCard, 
    FaFileInvoice, FaTag, FaExclamationTriangle 
} from "react-icons/fa";
import { MdReport } from "react-icons/md";
import languageData from "../../assets/languageData.json";

const StatisticsDasboard = () => {
    const context = useAppContext();

    // --- SAFETY LEVEL 1: Context & Settings ---
    // Fallback to 'english' and default settings if context is not ready
    const language = context?.language || "english";
    const settings = context?.settingContext?.settings || [];
    const currency = settings?.[0]?.business?.currency ?? '$';

    // --- SAFETY LEVEL 2: Data Sources ---
    // Ensure these are always arrays. If context is null, these become [].
    const products = context?.productContext?.products || [];
    const sales = context?.SaleContext?.Sales || [];
    const sellReturns = context?.SellReturnContext?.sellReturns || [];
    const creditRecord = context?.creditManagementContext?.submittedRecords || [];
    const costData = context?.costContext?.costData || [];
    const damages = context?.damageContext?.damages || []; 

    // Safe Language Access
    const currentLangData = languageData[language] || languageData["english"];
    
    // Default Filter State
    const [filter, setFilter] = useState(currentLangData.daily);

    // --- CORE LOGIC (Wrapped in useMemo for performance) ---
    const salesData = useMemo(() => {
        // 1. Initialize Dates INSIDE useMemo
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        oneMonthAgo.setHours(0, 0, 0, 0);

        // 2. Initialize Data Structure
        const initialData = {
            sales: 0, profit: 0, loss: 0, credit: 0, 
            payment: 0, issuedSales: 0, cost: 0, discount: 0, damage: 0 
        };

        const stats = {
            [currentLangData.daily]: { ...initialData },
            [currentLangData.weekly]: { ...initialData },
            [currentLangData.monthly]: { ...initialData },
        };

        // 3. Helper Function to assign values to time periods
        const addToStats = (dateStr, key, value) => {
            if (!dateStr) return; 
            const d = new Date(dateStr);
            d.setHours(0,0,0,0);
            
            const val = parseFloat(value) || 0; // Ensure it's a number

            if (d.getTime() === today.getTime()) {
                stats[currentLangData.daily][key] += val;
            }
            if (d >= oneWeekAgo) {
                stats[currentLangData.weekly][key] += val;
            }
            if (d >= oneMonthAgo) {
                stats[currentLangData.monthly][key] += val;
            }
        };

        // 4. PROCESS SALES
        sales.forEach((sale) => {
            if (!sale) return; // Skip null records

            const totalBill = parseFloat(sale.totalBill) || 0;
            const discount = parseFloat(sale.discount) || 0;
            
            // --- CRITICAL FIX 1: Handle undefined products ---
            // If sale.products is undefined, default to empty array [] so .reduce doesn't crash
            const safeProducts = Array.isArray(sale.products) ? sale.products : [];
            
            const purchaseCost = safeProducts.reduce((acc, product) => {
                const costPrice = parseFloat(product?.purchasePrice) || 0;
                const qty = parseFloat(product?.SellQuantity) || 0; 
                return acc + (costPrice * qty);
            }, 0);

            const profit = totalBill - purchaseCost;
            const saleCredit = parseFloat(sale.credit) || 0;
            
            // --- CRITICAL FIX 2: Handle undefined addPayment ---
            let salePayment = parseFloat(sale.amountPaid) || 0;
            const safePayments = Array.isArray(sale.addPayment) ? sale.addPayment : [];
            salePayment += safePayments.reduce((acc, p) => acc + (parseFloat(p?.amount) || 0), 0);

            addToStats(sale.dateTime, 'sales', totalBill);
            addToStats(sale.dateTime, 'profit', profit);
            addToStats(sale.dateTime, 'credit', saleCredit);
            addToStats(sale.dateTime, 'payment', salePayment);
            addToStats(sale.dateTime, 'discount', discount);
            
            if (sale.dateTime) {
                const d = new Date(sale.dateTime);
                d.setHours(0,0,0,0);
                if(d.getTime() === today.getTime()) stats[currentLangData.daily].issuedSales++;
                if(d >= oneWeekAgo) stats[currentLangData.weekly].issuedSales++;
                if(d >= oneMonthAgo) stats[currentLangData.monthly].issuedSales++;
            }
        });

        // 5. PROCESS RETURNS
        sellReturns.forEach((ret) => {
            if (!ret) return;

            const returnTotal = parseFloat(ret.totalAmount) || 0;
            let returnCOGS = 0;
            
            const safeItems = Array.isArray(ret.items) ? ret.items : [];

            safeItems.forEach(item => {
                const product = products.find(p => p.id === item.id);
                let costPrice = 0;
                if(product){
                     // Handle undefined batchCode
                     const safeBatches = Array.isArray(product.batchCode) ? product.batchCode : [];
                     const batch = safeBatches.find(b => b.batchCode === item.batchCode);
                     costPrice = batch ? parseFloat(batch.purchasePrice) : parseFloat(product.purchasePrice || 0);
                }
                returnCOGS += (parseFloat(item.quantity || 0) * costPrice);
            });

            const profitReversal = returnTotal - returnCOGS;
            const cashRefund = parseFloat(ret.paymentDetails?.cashReturn) || 0;
            const creditAdj = parseFloat(ret.paymentDetails?.creditAdjustment) || 0;

            addToStats(ret.returnDate, 'sales', -returnTotal);
            addToStats(ret.returnDate, 'profit', -profitReversal);
            addToStats(ret.returnDate, 'payment', -cashRefund);
            addToStats(ret.returnDate, 'credit', -creditAdj);
        });

        // 6. PROCESS EXPENSES
        costData.forEach((cost) => {
            if(cost) addToStats(cost.date, 'cost', cost.cost);
        });

        // 7. PROCESS LEDGER
        creditRecord.forEach((record) => {
            if (!record) return;
            if (record.type === "credit") {
                addToStats(record.date, 'credit', record.amount);
            } else if (record.type === "payment") {
                addToStats(record.date, 'payment', record.amount);
            }
        });

        // 8. PROCESS DAMAGES
        damages.forEach((dmg) => {
            if (!dmg) return;
            if (dmg.resolution === 'refund' || dmg.resolution === 'replace') return;

            const costPrice = parseFloat(dmg.purchasePrice) || 0;
            const qty = parseFloat(dmg.quantity) || 0;
            const dmgCost = costPrice * qty;

            addToStats(dmg.date, 'damage', dmgCost);
        });

        // 9. CALCULATE FINALS
        Object.keys(stats).forEach((period) => {
            const data = stats[period];
            
            // Net Profit Logic
            data.profit = data.profit - data.cost - data.damage;

            if (data.profit < 0) {
                data.loss = Math.abs(data.profit);
                data.profit = 0;
            }

            // Rounding
            Object.keys(data).forEach((key) => {
                if (key !== "issuedSales") {
                    data[key] = parseFloat(data[key]).toFixed(2);
                }
            });
        });

        return stats;
    }, [sales, sellReturns, costData, creditRecord, products, damages, currentLangData]); 
    // ^ Removed 'today' from dependencies to fix ReferenceError

    // --- RENDER SAFEGUARDS ---
    // If filter doesn't match a key (rare), fallback to daily to prevent UI crash
    const currentViewData = salesData[filter] || salesData[currentLangData.daily];

    return ( 
    <>
        { /* Filter Buttons */ }
        <div className = "flex justify-end mb-4 gap-2" >
            {[currentLangData.daily, currentLangData.weekly, currentLangData.monthly].map((period) => (
                <button 
                    key={period}
                    className = { `px-4 py-2 rounded ${filter === period ? "bg-blue-500 text-white" : "bg-gray-200"}` }
                    onClick = {() => setFilter(period) } >
                    { period } 
                </button> 
            ))}
        </div>

        { /* Cards Grid */ }
        <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6" >
            
            {/* SALES */}
            <div className = "card bg-blue-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaShoppingCart />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { currentLangData.sales } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { currentViewData.sales } </p> 
            </div>

            {/* NET PROFIT */}
            <div className = "card bg-green-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaMoneyBillWave />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } Net { currentLangData.profit } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { currentViewData.profit } </p> 
            </div>

            {/* LOSS */}
            <div className = "card bg-red-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <MdReport />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { currentLangData.loss } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { currentViewData.loss } </p> 
            </div>

            {/* DAMAGES */}
            <div className = "card bg-rose-600 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaExclamationTriangle />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } Damaged Value </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { currentViewData.damage } </p> 
            </div>

            {/* DISCOUNT */}
            <div className = "card bg-orange-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaTag />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } Discount </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { currentViewData.discount } </p> 
            </div>

            {/* EXPENSES */}
            <div className = "card bg-gray-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaMoneyBillWave />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } Expenses </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { currentViewData.cost } </p> 
            </div>

            {/* ISSUED SALES COUNT */}
            <div className = "card bg-indigo-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaFileInvoice />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { currentLangData.issue_sales } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currentViewData.issuedSales } Sales </p> 
            </div>
            
            {/* CREDIT / UDHAAR */}
            <div className = "card bg-yellow-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaCreditCard />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { currentLangData.credit } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { currentViewData.credit } </p> 
            </div>

        </div> 
    </>
    );
};

export default StatisticsDasboard;

