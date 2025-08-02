import React, { useState, useRef } from 'react';
import { useAppContext } from '../Appfullcontext'; // Aapka context import
import { FaPrint, FaChartBar, FaMoneyBillWave, FaBoxOpen } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import languageData from '../assets/languageData.json'; // Language file

const Reports = () => {
    const context = useAppContext();
    const { language } = context;

    // Context se data hasil karna
    const allSales = context.SaleContext.Sales || [];
    const allCosts = context.costContext.costData || [];
    const allProducts = context.productContext.products || [];
    const userAndBusinessDetail = context.settingContext.settings;
    const currency = userAndBusinessDetail?.[0]?.business?.currency ?? 'Rs';

    // State management
    const [activeReport, setActiveReport] = useState('sales'); // 'sales', 'pnl', 'stock'
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [reportData, setReportData] = useState(null);

    const componentRef = useRef();

  
    // Report generate karne ka function
    const handleGenerateReport = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Din ke aakhir tak ki sales shamil karne ke liye

        if (activeReport === 'sales') {
            const filteredSales = allSales.filter(sale => {
                const saleDate = new Date(sale.dateTime);
                return saleDate >= start && saleDate <= end;
            }).map(sale => {
                const purchaseCost = sale.products.reduce(
                    (acc, product) => acc + (parseFloat(product.purchasePrice) || 0) * (parseInt(product.SellQuantity) || 0),
                    0
                );
                const profit = (parseFloat(sale.totalBill) || 0) - purchaseCost;
                return { ...sale, profit };
            });
            setReportData({ type: 'sales', data: filteredSales });
        } 
        else if (activeReport === 'pnl') {
            // Sales se revenue aur cost of goods sold (COGS) calculate karna
            const salesInRange = allSales.filter(sale => {
                const saleDate = new Date(sale.dateTime);
                return saleDate >= start && saleDate <= end;
            });

            const totalRevenue = salesInRange.reduce((acc, sale) => acc + (parseFloat(sale.totalBill) || 0), 0);
            
            const totalCOGS = salesInRange.reduce((acc, sale) => {
                const saleCOGS = sale.products.reduce(
                    (pAcc, product) => pAcc + (parseFloat(product.purchasePrice) || 0) * (parseInt(product.SellQuantity) || 0),
                    0
                );
                return acc + saleCOGS;
            }, 0);

            // Doosre ikhrajat (costs) calculate karna
            const otherExpenses = allCosts.filter(cost => {
                const costDate = new Date(cost.date);
                return costDate >= start && costDate <= end;
            }).reduce((acc, cost) => acc + (parseFloat(cost.cost) || 0), 0);

            const grossProfit = totalRevenue - totalCOGS;
            const netProfit = grossProfit - otherExpenses;

            setReportData({
                type: 'pnl',
                data: {
                    totalRevenue,
                    totalCOGS,
                    grossProfit,
                    otherExpenses,
                    netProfit,
                }
            });
        }
        else if (activeReport === 'stock') {
            // Stock report date range se independent hoti hai, yeh hamesha current stock dikhati hai
            const stockValue = allProducts.reduce((acc, p) => acc + ( (p.purchasePrice || 0) * (p.quantity || 0) ), 0);
            setReportData({ type: 'stock', data: { products: allProducts, totalValue: stockValue } });
        }
    };
    console.log(reportData)
    // Print function
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Business_Bachao_${activeReport}_Report`
    });

    const renderReport = () => {
        if (!reportData) {
            return (
                <div className="text-center p-10 bg-gray-100 rounded-lg">
                    <p className="text-gray-500">{languageData[language].report_prompt || "Please select report type and date range, then click 'Generate Report'."}</p>
                </div>
            );
        }

        switch (reportData.type) {
            case 'sales':
                return (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-800 text-white">
                                <tr>
                                    <th className="py-3 px-4 uppercase font-semibold text-sm text-left">{languageData[language].date || "Date"}</th>
                                    <th className="py-3 px-4 uppercase font-semibold text-sm text-left">{languageData[language].salesRefNo || "Sales Ref No"}</th>
                                    <th className="py-3 px-4 uppercase font-semibold text-sm text-left">{languageData[language].total_bill || "Total Bill"}</th>
                                    <th className="py-3 px-4 uppercase font-semibold text-sm text-left">{languageData[language].profit || "Profit"}</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {reportData.data.length > 0 ? reportData.data.map(sale => (
                                    <tr key={sale.id} className="border-b hover:bg-gray-100">
                                        <td className="py-3 px-4">{new Date(sale.dateTime).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">{sale.salesRefNo}</td>
                                        <td className="py-3 px-4">{currency} {parseFloat(sale.totalBill).toFixed(2)}</td>
                                        <td className={`py-3 px-4 font-bold ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {currency} {sale.profit.toFixed(2)}
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan="4" className="text-center py-4">{languageData[language].no_data || "No sales found in this period."}</td></tr>}
                            </tbody>
                        </table>
                    </div>
                );
            case 'pnl':
                const pnl = reportData.data;
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-2xl font-bold mb-4 text-center">{languageData[language].profit_loss_statement || "Profit & Loss Statement"}</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-semibold">{languageData[language].total_revenue || "Total Revenue (Sales)"}</span>
                                <span className="font-bold text-green-600">{currency} {pnl.totalRevenue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-semibold">{languageData[language].cogs || "Cost of Goods Sold (COGS)"}</span>
                                <span className="text-red-600">({currency} {pnl.totalCOGS.toFixed(2)})</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 text-lg">
                                <span className="font-bold">{languageData[language].gross_profit || "Gross Profit"}</span>
                                <span className={`font-bold ${pnl.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{currency} {pnl.grossProfit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-semibold">{languageData[language].other_expenses || "Other Expenses"}</span>
                                <span className="text-red-600">({currency} {pnl.otherExpenses.toFixed(2)})</span>
                            </div>
                            <div className="flex justify-between pt-4 mt-4 border-t-2 border-black text-xl">
                                <span className="font-extrabold">{languageData[language].net_profit_loss || "Net Profit / Loss"}</span>
                                <span className={`font-extrabold ${pnl.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>{currency} {pnl.netProfit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                );
          
                 return (
                    <div className="overflow-x-auto">
                        <div className="text-right mb-4 font-bold text-lg">
                            {languageData[language].total_stock_value || "Total Stock Value"}: {currency} {reportData.data.totalValue.toFixed(2)}
                        </div>
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-800 text-white">
                                <tr>
                                    <th className="py-3 px-4 uppercase font-semibold text-sm text-left">{languageData[language].product_name || "Product Name"}</th>
                                     <th className="p-2 border-b" onClick={handleSort} style={{ cursor: 'pointer' }}>
                                        {languageData[language].total_stock} {sortOrder === "asc" ? "↑" : "↓"}
                                    </th>
                                    <th className="py-3 px-4 uppercase font-semibold text-sm text-left">{languageData[language].quantity || "Quantity"}</th>
                                    <th className="py-3 px-4 uppercase font-semibold text-sm text-left">{languageData[language].purchase_price || "Purchase Price"}</th>
                                    <th className="py-3 px-4 uppercase font-semibold text-sm text-left">{languageData[language].stock_value || "Stock Value"}</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {reportData.data.products.length > 0 ? reportData.data.products.map(p => 
                                {
 const totalStock = calculateTotalStock(p.batchCode);

                               return (
                                    <tr key={p.id} className="border-b hover:bg-gray-100">
                                        <td className="py-3 px-4">{p.name}</td>
                                        <td className="py-3 px-4">{totalStock}</td>
                                        <td className="py-3 px-4">{currency} {parseFloat(p.purchasePrice).toFixed(2)}</td>
                                        <td className="py-3 px-4 font-bold">{currency} {(p.quantity * p.purchasePrice).toFixed(2)}</td>
                                    </tr>
                                )}) : <tr><td colSpan="4" className="text-center py-4">{languageData[language].no_products_found || "No products found."}</td></tr>}
                            </tbody>
                        </table>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">{languageData[language].reports || "Reports"}</h1>

            {/* Controls Section */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    {/* Report Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{languageData[language].report_type || "Report Type"}</label>
                        <div className="flex rounded-md shadow-sm">
                            <button onClick={() => setActiveReport('sales')} className={`flex-1 p-2 rounded-l-md ${activeReport === 'sales' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                <FaChartBar className="inline mr-2"/>{languageData[language].sales || "Sales"}
                            </button>
                            <button onClick={() => setActiveReport('pnl')} className={`flex-1 p-2 ${activeReport === 'pnl' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                <FaMoneyBillWave className="inline mr-2"/>{languageData[language].pnl || "P&L"}
                            </button>
                           
                            
                        </div>
                    </div>

                    {/* Date Filters (Stock report ke liye hide) */}
                    {activeReport !== 'stock' && (
                        <>
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">{languageData[language].start_date || "Start Date"}</label>
                                <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"/>
                            </div>
                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">{languageData[language].end_date || "End Date"}</label>
                                <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"/>
                            </div>
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                         <button onClick={handleGenerateReport} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold">
                            {languageData[language].generate_report || "Generate Report"}
                        </button>
                        <button onClick={handlePrint} className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800">
                            <FaPrint />
                        </button>
                    </div>
                </div>
                 {activeReport === 'stock' && <p className="text-xs text-gray-500 mt-2">{languageData[language].stock_report_note || "Note: Stock report shows current inventory and does not require a date range."}</p>}
            </div>

            {/* Report Display Area */}
            <div ref={componentRef} className="bg-white p-4 rounded-lg shadow-md">
                {renderReport()}
            </div>
        </div>
    );
};

export default Reports;