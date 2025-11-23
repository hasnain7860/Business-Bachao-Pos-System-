import React, { useState, useEffect } from "react";
import { useAppContext } from "../../Appfullcontext";
import { 
    FaShoppingCart, FaMoneyBillWave, FaCreditCard, FaMoneyCheckAlt, 
    FaFileInvoice, FaTag, FaExclamationTriangle 
} from "react-icons/fa";
import { MdReport } from "react-icons/md";
import languageData from "../../assets/languageData.json";

const StatisticsDasboard = () => {
    const context = useAppContext();
    const { language } = context;
    const currency = context.settingContext.settings?.[0]?.business?.currency ?? '$';

    // Data Sources
    const products = context.productContext.products;
    const sales = context.SaleContext.Sales || [];
    const sellReturns = context.SellReturnContext.sellReturns || [];
    const creditRecord = context.creditManagementContext.submittedRecords || [];
    const costData = context.costContext.costData || [];
    
    // --- GET DAMAGES ---
    const damages = context.damageContext?.damages || []; 

    const [filter, setFilter] = useState(languageData[language].daily);

    function generateSalesData(sales, sellReturns, costData, creditRecord, products, damages) {
        const initialData = {
            sales: 0,
            profit: 0,
            loss: 0,
            credit: 0,
            payment: 0,
            issuedSales: 0,
            cost: 0,
            discount: 0,
            damage: 0 // New Field for Damage Loss
        };

        const stats = {
            [languageData[language].daily]: { ...initialData },
            [languageData[language].weekly]: { ...initialData },
            [languageData[language].monthly]: { ...initialData },
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        oneMonthAgo.setHours(0, 0, 0, 0);

        // Helper to add data to correct periods
        const addToStats = (dateStr, key, value) => {
            const d = new Date(dateStr);
            d.setHours(0,0,0,0);
            const val = parseFloat(value) || 0;

            if (d.getTime() === today.getTime()) {
                stats[languageData[language].daily][key] += val;
            }
            if (d >= oneWeekAgo) {
                stats[languageData[language].weekly][key] += val;
            }
            if (d >= oneMonthAgo) {
                stats[languageData[language].monthly][key] += val;
            }
        };

        // 1. SALES PROCESSING
        sales.forEach((sale) => {
            const totalBill = parseFloat(sale.totalBill) || 0;
            const discount = parseFloat(sale.discount) || 0;
            
            // Calculate COGS (Cost of Goods Sold)
            const purchaseCost = sale.products.reduce((acc, product) => {
                const costPrice = parseFloat(product.purchasePrice) || 0;
                const qty = parseFloat(product.SellQuantity) || 0; // Base Unit Qty
                return acc + (costPrice * qty);
            }, 0);

            const profit = totalBill - purchaseCost;
            const saleCredit = parseFloat(sale.credit) || 0;
            let salePayment = parseFloat(sale.amountPaid) || 0;

            if (Array.isArray(sale.addPayment)) {
                salePayment += sale.addPayment.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
            }

            addToStats(sale.dateTime, 'sales', totalBill);
            addToStats(sale.dateTime, 'profit', profit);
            addToStats(sale.dateTime, 'credit', saleCredit);
            addToStats(sale.dateTime, 'payment', salePayment);
            addToStats(sale.dateTime, 'discount', discount);
            
            const d = new Date(sale.dateTime);
            d.setHours(0,0,0,0);
            if(d.getTime() === today.getTime()) stats[languageData[language].daily].issuedSales++;
            if(d >= oneWeekAgo) stats[languageData[language].weekly].issuedSales++;
            if(d >= oneMonthAgo) stats[languageData[language].monthly].issuedSales++;
        });

        // 2. SALES RETURNS PROCESSING
        sellReturns.forEach((ret) => {
            const returnTotal = parseFloat(ret.totalAmount) || 0;
            let returnCOGS = 0;
            if(ret.items && Array.isArray(ret.items)){
                ret.items.forEach(item => {
                    // Fallback cost lookup if needed, but new returns should ideally have cost info
                    // Using product context as fallback
                    const product = products.find(p => p.id === item.id);
                    let costPrice = 0;
                    if(product){
                         const batch = product.batchCode ? product.batchCode.find(b => b.batchCode === item.batchCode) : null;
                         costPrice = batch ? parseFloat(batch.purchasePrice) : parseFloat(product.purchasePrice || 0);
                    }
                    returnCOGS += (parseFloat(item.quantity) * costPrice);
                });
            }

            const profitReversal = returnTotal - returnCOGS;
            const cashRefund = parseFloat(ret.paymentDetails?.cashReturn) || 0;
            const creditAdj = parseFloat(ret.paymentDetails?.creditAdjustment) || 0;

            addToStats(ret.returnDate, 'sales', -returnTotal);
            addToStats(ret.returnDate, 'profit', -profitReversal);
            addToStats(ret.returnDate, 'payment', -cashRefund);
            addToStats(ret.returnDate, 'credit', -creditAdj);
        });

        // 3. OPERATIONAL EXPENSES
        costData.forEach((cost) => {
            addToStats(cost.date, 'cost', cost.cost);
        });

        // 4. MANUAL LEDGER RECORDS
        creditRecord.forEach((record) => {
            if (record.type === "credit") {
                addToStats(record.date, 'credit', record.amount);
            } else if (record.type === "payment") {
                addToStats(record.date, 'payment', record.amount);
            }
        });

        // 5. --- DAMAGES LOGIC (SMART) ---
        damages.forEach((dmg) => {
            // Logic: If we got a Refund or Replacement, it is NOT a financial loss for Profit calculation.
            // Only 'Pending' (Stock gone, no money yet) or 'Loss' (Written off) counts as Expense.
            
            if (dmg.resolution === 'refund' || dmg.resolution === 'replace') {
                return; // Skip, cost recovered
            }

            // Use the saved purchase price directly (As you mentioned)
            const costPrice = parseFloat(dmg.purchasePrice) || 0;
            const qty = parseFloat(dmg.quantity) || 0; // This is stored as Base Unit Qty in AddDamage
            const dmgCost = costPrice * qty;

            addToStats(dmg.date, 'damage', dmgCost);
        });

        // 6. FINAL NET PROFIT CALCULATION
        Object.keys(stats).forEach((period) => {
            const data = stats[period];
            
            // Net Profit = Gross Profit - Expenses - Actual Damage Loss
            data.profit = data.profit - data.cost - data.damage;

            // If Profit drops below zero, show as Loss
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
    }

    const [salesData, setSalesData] = useState(generateSalesData(sales, sellReturns, costData, creditRecord, products, damages));

    useEffect(() => {
        const updatedSalesData = generateSalesData(sales, sellReturns, costData, creditRecord, products, damages);
        setSalesData(updatedSalesData);
    }, [language, sales, sellReturns, costData, creditRecord, products, damages]);

    return ( 
    <>
        { /* Filter Buttons */ }
        <div className = "flex justify-end mb-4" >
            <button className = { `px-4 py-2 mx-2 rounded ${filter === languageData[language].daily ? "bg-blue-500 text-white" : "bg-gray-200"}` }
                onClick = {() => setFilter(languageData[language].daily) } >
                { languageData[language].daily } 
            </button> 
            <button className = { `px-4 py-2 mx-2 rounded ${filter === languageData[language].weekly ? "bg-blue-500 text-white" : "bg-gray-200"}` }
                onClick = {() => setFilter(languageData[language].weekly) } >
                { languageData[language].weekly }
            </button> 
            <button className = { `px-4 py-2 mx-2 rounded ${filter === languageData[language].monthly ? "bg-blue-500 text-white" : "bg-gray-200"}` }
                onClick = {() => setFilter(languageData[language].monthly) } >
                { languageData[language].monthly }
            </button> 
        </div>

        { /* Cards Grid */ }
        <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6" >
            
            <div className = "card bg-blue-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaShoppingCart />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { languageData[language].sales } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].sales } </p> 
            </div>

            <div className = "card bg-green-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaMoneyBillWave />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } Net { languageData[language].profit } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].profit } </p> 
            </div>

            <div className = "card bg-red-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <MdReport />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { languageData[language].loss } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].loss } </p> 
            </div>

            {/* --- DAMAGE CARD --- */}
            <div className = "card bg-rose-600 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaExclamationTriangle />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } Damaged Value </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].damage } </p> 
            </div>

            <div className = "card bg-orange-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaTag />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } Discount </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].discount } </p> 
            </div>

            <div className = "card bg-gray-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaMoneyBillWave />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } Expenses </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].cost } </p> 
            </div>

            <div className = "card bg-indigo-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaFileInvoice />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { languageData[language].issue_sales } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { salesData[filter].issuedSales } Sales </p> 
            </div>
            
            <div className = "card bg-yellow-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaCreditCard />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { languageData[language].credit } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].credit } </p> 
            </div>

        </div> 
    </>
    );
};

export default StatisticsDasboard;


