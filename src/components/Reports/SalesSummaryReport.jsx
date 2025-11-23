import React, { useState } from 'react';
import { useAppContext } from '../../Appfullcontext';
import languageData from '../../assets/languageData.json';
import { FaPrint, FaFilter, FaDollarSign, FaCalculator, FaPercent } from 'react-icons/fa';

const SalesSummaryReport = () => {
    const { language, SaleContext, peopleContext, settingContext, productContext } = useAppContext();
    
    // Context Data
    const allSales = SaleContext.Sales || [];
    const allPeoples = peopleContext.people || [];
    const allProducts = productContext.products || [];
    
    const userAndBusinessDetail = settingContext.settings;
    const currency = userAndBusinessDetail?.[0]?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.[0]?.business?.businessName ?? 'Business Bachao';

    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [reportData, setReportData] = useState(null);
    const [showFilters, setShowFilters] = useState(true);

    const handleGenerateReport = () => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        const salesInRange = allSales.filter(sale => new Date(sale.dateTime) >= start && new Date(sale.dateTime) <= end);

        const processedSales = salesInRange.map(sale => {
            const totalDiscount = parseFloat(sale.discount || 0);
            let subtotal = parseFloat(sale.subtotal || 0);
            
            // Fallback Subtotal Calculation
            if (subtotal === 0 && sale.products) {
                subtotal = sale.products.reduce((acc, p) => {
                    const price = parseFloat(p.newSellPrice) || parseFloat(p.sellPrice) || 0;
                    const qty = parseFloat(p.SellQuantity) || 0; // Base Units
                    return acc + (price * qty);
                }, 0);
            }

            let totalProfit = 0;
            
            if(sale.products) {
                sale.products.forEach(p => {
                    // Logic:
                    // SellQuantity is stored as Base Units (Pieces)
                    // newSellPrice/sellPrice might be per Unit (Ctn) OR per Piece depending on old/new logic.
                    // BUT, the 'subtotal' on the invoice is final.
                    // So we calculate profit based on: (Revenue Share - Cost)
                    
                    // 1. Calculate Line Revenue
                    // If new system (enteredQty exists), use that for display logic, but math uses Total Base Qty
                    const qty = parseFloat(p.SellQuantity) || 0; // Base Units
                    
                    // Attempt to get accurate revenue for this line item
                    // If newSellPrice is unit price, we need to know if it applied to Qty or EnteredQty.
                    // Simplest valid way for Profit:
                    // Line Revenue = (Total Bill + Discount) * (Line Weight) -> Hard to reverse.
                    
                    // Robust Way:
                    // Cost = Base Purchase Price * Base Qty
                    
                    // Find current purchase price from product list if missing in sale record (Fallback)
                    let costPrice = parseFloat(p.purchasePrice) || 0;
                    if(costPrice === 0) {
                        const originalProduct = allProducts.find(prod => prod.id === p.id);
                        if(originalProduct) {
                             const batch = originalProduct.batchCode ? originalProduct.batchCode.find(b => b.batchCode === p.batchCode) : null;
                             costPrice = batch ? parseFloat(batch.purchasePrice) : parseFloat(originalProduct.purchasePrice || 0);
                        }
                    }

                    const lineCost = costPrice * qty;
                    
                    // Line Revenue (Approximation for Profit Calculation)
                    // We calculate Gross Profit of the whole bill usually, but here per item
                    // Let's use the Bill Total to calculate profit directly at bill level
                    // This loop sums up the COST.
                    totalProfit -= lineCost; // Subtract Cost
                });
                
                // Profit = (Bill Total - Discount is already deducted in TotalBill) - Total Cost
                // Wait, sale.totalBill = Subtotal - Discount.
                // So Revenue = sale.totalBill.
                
                totalProfit += parseFloat(sale.totalBill || 0);
            }
            
            return { ...sale, profit: totalProfit, discount: totalDiscount };
        });

        const totalSummary = processedSales.reduce((acc, sale) => {
            acc.totalBill += parseFloat(sale.totalBill || 0);
            acc.totalDiscount += parseFloat(sale.discount || 0);
            acc.totalProfit += sale.profit;
            return acc;
        }, { totalBill: 0, totalDiscount: 0, totalProfit: 0 });
        
        setReportData({ type: 'sales', data: processedSales, summary: totalSummary });
        setShowFilters(false);
    };

    const handlePrint = () => window.print();

    const summary = reportData?.summary;

    return (
        <div>
            {/* --- FILTERS --- */}
            <div className={`no-print ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language].sales_summary || 'Sales Summary'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 border rounded-lg bg-gray-50">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language].start_date || 'Start Date'}</label>
                        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language].end_date || 'End Date'}</label>
                        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/>
                    </div>
                    <button onClick={handleGenerateReport} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold h-10">
                        {languageData[language].generate || 'Generate'}
                    </button>
                </div>
            </div>

            {/* --- REPORT --- */}
            {reportData && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 text-blue-600 hover:underline">
                            <FaFilter /> {languageData[language].change_filters || 'Change Filters'}
                        </button>
                        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                            <FaPrint /> {languageData[language].print || 'Print'}
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
                        <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
                            <h4 className="text-sm font-semibold text-blue-800 flex items-center justify-center gap-2">
                                <FaDollarSign /> {languageData[language].total_sale || 'Total Sale'}
                            </h4>
                            <p className="text-2xl font-bold text-blue-600">{currency} {summary.totalBill.toFixed(2)}</p>
                        </div>
                         <div className="bg-green-100 p-4 rounded-lg shadow text-center">
                            <h4 className="text-sm font-semibold text-green-800 flex items-center justify-center gap-2">
                                <FaCalculator /> {languageData[language].total_profit || 'Gross Profit'}
                            </h4>
                            <p className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {currency} {summary.totalProfit.toFixed(2)}
                            </p>
                        </div>
                         <div className="bg-amber-100 p-4 rounded-lg shadow text-center">
                            <h4 className="text-sm font-semibold text-amber-800 flex items-center justify-center gap-2">
                                <FaPercent /> {languageData[language].total_discount || 'Total Discount'}
                            </h4>
                            <p className="text-2xl font-bold text-amber-600">{currency} {summary.totalDiscount.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Print Header */}
                    <div className="print-header">
                        <h2>{businessName}</h2>
                        <h3>{languageData[language].sales_summary || 'Sales Summary Report'}</h3>
                        <p>{languageData[language].date_range || 'Date Range'}: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-2 px-3 text-left">{languageData[language].date || 'Date'}</th>
                                    <th className="py-2 px-3 text-left">{languageData[language].ref_no || 'Ref No'}</th>
                                    <th className="py-2 px-3 text-left">{languageData[language].customer || 'Customer'}</th>
                                    <th className="py-2 px-3 text-right">{languageData[language].discount || 'Discount'}</th>
                                    <th className="py-2 px-3 text-right">{languageData[language].total_bill || 'Total Bill'}</th>
                                    <th className="py-2 px-3 text-right">{languageData[language].profit || 'Profit'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.data.length > 0 ? reportData.data.map(sale => {
                                    const person = allPeoples.find(p => p.id === sale.personId);
                                    const personName = person ? person.name : (languageData[language].walking_customer || 'Walking Customer');
                                    return (
                                        <tr key={sale.id} className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-3">{new Date(sale.dateTime).toLocaleDateString()}</td>
                                            <td className="py-2 px-3 font-mono text-xs">{sale.salesRefNo}</td>
                                            <td className="py-2 px-3 font-medium">{personName}</td>
                                            <td className="py-2 px-3 text-right text-amber-600">{currency} {sale.discount.toFixed(2)}</td>
                                            <td className="py-2 px-3 text-right font-semibold">{currency} {parseFloat(sale.totalBill).toFixed(2)}</td>
                                            <td className={`py-2 px-3 text-right font-bold ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currency} {sale.profit.toFixed(2)}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="6" className="text-center py-10 text-gray-500">{languageData[language].no_sales_found || 'No sales found for this period.'}</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-100 font-bold">
                                <tr>
                                    <td colSpan="3" className="py-3 px-3 text-right">{languageData[language].totals || 'Totals'}:</td>
                                    <td className="py-3 px-3 text-right text-amber-700">{currency} {reportData.summary.totalDiscount.toFixed(2)}</td>
                                    <td className="py-3 px-3 text-right">{currency} {reportData.summary.totalBill.toFixed(2)}</td>
                                    <td className={`py-3 px-3 text-right ${reportData.summary.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {currency} {reportData.summary.totalProfit.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="print-footer">
                        {languageData[language].total_profit || 'Total Gross Profit'}: {currency} {reportData.summary.totalProfit.toFixed(2)}
                    </div>
                </div>
            )}

            {reportData && reportData.data.length === 0 && !showFilters && (
                 <div className="text-center p-10 mt-6 bg-white rounded-lg shadow no-print">
                    <p className="text-gray-500">{languageData[language].no_data_found || 'No data found for the selected filters.'}</p>
                    <button onClick={() => setShowFilters(true)} className="mt-4 flex items-center gap-2 text-blue-600 mx-auto hover:underline">
                        <FaFilter /> {languageData[language].change_filters || 'Change Filters'}
                    </button>
                 </div>
            )}
            
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { font-size: 12px; }
                    .print-header { text-align: center; margin-bottom: 20px; }
                    .print-header h2 { font-size: 24px; font-weight: bold; margin: 0; }
                    .print-header h3 { font-size: 18px; margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ccc !important; padding: 5px; }
                    thead { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
                    .text-green-600 { color: black !important; } 
                    .text-red-600 { color: black !important; }
                }
            `}</style>
        </div>
    );
};

export default SalesSummaryReport;
