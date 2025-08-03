import React, { useState, useEffect } from "react";
import { useAppContext } from "../../Appfullcontext";
import { FaShoppingCart, FaMoneyBillWave, FaCreditCard, FaMoneyCheckAlt, FaFileInvoice, FaUsers, FaTag } from "react-icons/fa";
import { MdReport, MdError } from "react-icons/md";
import languageData from "../../assets/languageData.json";

const StatisticsDasboard = () => {
    const context = useAppContext();
    const products = context.productContext.products;
    const userAndBusinessDetail = context.settingContext.settings;
    const { language } = context;
    const [filter, setFilter] = useState(languageData[language].daily);
    const sales = context.SaleContext.Sales;
    const creditRecord = context.creditManagementContext.submittedRecords;
    const costData = context.costContext.costData;
    const currency = userAndBusinessDetail?.[0]?.business?.currency ?? '$';

    function generateSalesData(sales, costData, creditRecord) {
        const initialData = {
            sales: 0,
            profit: 0,
            loss: 0,
            credit: 0,
            payment: 0,
            issuedSales: 0,
            cost: 0,
            discount: 0 // Added discount field
        };

        const salesData = {
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

        // Calculate costs for each period
        const dailyCost = costData.reduce((acc, cost) => {
            const costDate = new Date(cost.date);
            costDate.setHours(0, 0, 0, 0);
            return costDate.getTime() === today.getTime() ? acc + parseFloat(cost.cost || 0) : acc;
        }, 0);

        const weeklyCost = costData.reduce((acc, cost) => {
            const costDate = new Date(cost.date);
            costDate.setHours(0, 0, 0, 0);
            return costDate >= oneWeekAgo ? acc + parseFloat(cost.cost || 0) : acc;
        }, 0);

        const monthlyCost = costData.reduce((acc, cost) => {
            const costDate = new Date(cost.date);
            costDate.setHours(0, 0, 0, 0);
            return costDate >= oneMonthAgo ? acc + parseFloat(cost.cost || 0) : acc;
        }, 0);
        
        salesData[languageData[language].daily].cost = dailyCost;
        salesData[languageData[language].weekly].cost = weeklyCost;
        salesData[languageData[language].monthly].cost = monthlyCost;


        sales.forEach((sale) => {
            const saleDate = new Date(sale.dateTime);
            saleDate.setHours(0, 0, 0, 0);
            
            const totalBill = parseFloat(sale.totalBill) || 0;
            // Safely access discount, default to 0 if not present
            const discount = parseFloat(sale.discount) || 0;

            const purchaseCost = sale.products.reduce(
                (acc, product) =>
                acc +
                (parseFloat(product.purchasePrice) || 0) *
                (parseInt(product.SellQuantity) || 0),
                0
            );

            // Profit is calculated from the final totalBill, which already accounts for the discount.
            let profit = totalBill - purchaseCost;

            let totalCredit = parseFloat(sale.credit) || 0;
            let totalPayment = parseFloat(sale.amountPaid) || 0;

            if (Array.isArray(sale.addPayment)) {
                totalPayment += sale.addPayment.reduce(
                    (acc, payment) => acc + (parseFloat(payment.amount) || 0),
                    0
                );
            }
            
            // This part for separate credit records might need review based on your app logic
            // It's adding credit/payment from other records based on date, which might lead to double counting.
            // For now, keeping it as is from your original code.
            creditRecord.forEach((record) => {
                const recordDate = new Date(record.date);
                recordDate.setHours(0,0,0,0);
                if (recordDate.getTime() === saleDate.getTime()) {
                    if (record.type === "credit") {
                        totalCredit += parseFloat(record.amount) || 0;
                    } else if (record.type === "payment") {
                        totalPayment += parseFloat(record.amount) || 0;
                    }
                }
            });

            // Update data for each period
            if (saleDate.getTime() === today.getTime()) {
                const periodData = salesData[languageData[language].daily];
                periodData.sales += totalBill;
                periodData.profit += profit;
                periodData.credit += totalCredit;
                periodData.payment += totalPayment;
                periodData.discount += discount;
                if (totalBill > 0) periodData.issuedSales++;
            }

            if (saleDate >= oneWeekAgo) {
                const periodData = salesData[languageData[language].weekly];
                periodData.sales += totalBill;
                periodData.profit += profit;
                periodData.credit += totalCredit;
                periodData.payment += totalPayment;
                periodData.discount += discount;
                if (totalBill > 0) periodData.issuedSales++;
            }

            if (saleDate >= oneMonthAgo) {
                const periodData = salesData[languageData[language].monthly];
                periodData.sales += totalBill;
                periodData.profit += profit;
                periodData.credit += totalCredit;
                periodData.payment += totalPayment;
                periodData.discount += discount;
                if (totalBill > 0) periodData.issuedSales++;
            }
        });
        
        // Final processing (Profit/Loss calculation and rounding)
        Object.keys(salesData).forEach((period) => {
            const periodData = salesData[period];
            // Adjust profit by period cost
            periodData.profit -= periodData.cost;

            // If profit is negative, it's a loss
            if (periodData.profit < 0) {
                periodData.loss = Math.abs(periodData.profit);
                periodData.profit = 0;
            }

            // Round all values to 2 decimal places, except for issuedSales
            Object.keys(periodData).forEach((key) => {
                periodData[key] =
                    key === "issuedSales" ?
                    periodData[key] :
                    parseFloat(periodData[key]).toFixed(2);
            });
        });

        return salesData;
    }


    const [salesData, setSalesData] = useState(generateSalesData(sales, costData, creditRecord));

    useEffect(() => {
        const updatedSalesData = generateSalesData(sales, costData, creditRecord);
        setFilter(languageData[language].daily)
        setSalesData(updatedSalesData);
    }, [language, sales, costData, creditRecord]);

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

        { /* Statistics Cards */ } 
        <div className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-6" >
            { /* Sales Card */ } 
            <div className = "card bg-blue-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaShoppingCart />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { languageData[language].sales } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].sales } </p> 
            </div>

            { /* Profit Card */ } 
            <div className = "card bg-green-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaMoneyBillWave />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { languageData[language].profit } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].profit } </p> 
            </div>

            { /* Loss Card */ } 
            <div className = "card bg-red-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <MdReport />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { languageData[language].loss } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].loss } </p> 
            </div>

            { /* Discount Card */ } 
            <div className = "card bg-orange-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaTag />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } Discount </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].discount } </p> 
            </div>

            { /* Credit Card */ } 
            <div className = "card bg-yellow-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaCreditCard />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { languageData[language].credit } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].credit } </p> 
            </div>

            { /* Payment Card */ } 
            <div className = "card bg-purple-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaMoneyCheckAlt />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { languageData[language].payment } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].payment } </p> 
            </div>

            { /* Cost Card */ } 
            <div className = "card bg-gray-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaMoneyBillWave />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { languageData[language].cost } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { currency } { salesData[filter].cost } </p> 
            </div>

            { /* Issue Sale Card */ } 
            <div className = "card bg-indigo-500 text-white p-4 shadow-lg rounded-lg" >
                <h2 className = "text-lg font-semibold flex items-center space-x-2" >
                    <FaFileInvoice />
                    <span > { filter.charAt(0).toUpperCase() + filter.slice(1) } { languageData[language].issue_sales } </span> 
                </h2> 
                <p className = "text-2xl font-bold mt-2" > { salesData[filter].issuedSales }
                    Sales 
                </p> 
            </div>
        </div> 
    </>
    );
};

export default StatisticsDasboard;

