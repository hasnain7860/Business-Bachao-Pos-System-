import React, { useState } from 'react';
import { useAppContext } from '../../Appfullcontext';
import languageData from '../../assets/languageData.json';
import { FaPrint, FaFilter, FaDollarSign, FaCalculator, FaPercent } from 'react-icons/fa';

const SalesSummaryReport = () => {
    const context = useAppContext();
    const { language } = context;
    
    // --- CRITICAL FIX: Universal Store Mapping ---
    // 1. All stores return 'data'
    // 2. Added Safe Fallbacks || []
    const allSales = context.SaleContext.data || [];
    const allPeoples = context.peopleContext.data || [];
    const allProducts = context.productContext.data || [];
    
    const settingsData = context.settingContext.data || [];
    const userAndBusinessDetail = settingsData[0] || {};
    
    const currency = userAndBusinessDetail?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.business?.businessName ?? 'Business Bachao';

    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [reportData, setReportData] = useState(null);
    const [showFilters, setShowFilters] = useState(true);

    const handleGenerateReport = () => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        const salesInRange = allSales.filter(sale => {
            const saleDate = new Date(sale.dateTime);
            return saleDate >= start && saleDate <= end;
        });

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

            let totalCost = 0;
            
            if(sale.products && Array.isArray(sale.products)) {
                sale.products.forEach(p => {
                    // SellQuantity is stored as Base Units (Pieces)
                    const qty = parseFloat(p.SellQuantity) || 0; 
                    
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
                    totalCost += lineCost;
                });
            }
            
            // Gross Profit = Net Revenue (Total Bill) - Total Cost
            const saleRevenue = parseFloat(sale.totalBill || 0);
            const profit = saleRevenue - totalCost;
            
            return { ...sale, profit: profit, discount: totalDiscount };
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
            <div className={`no-print p-4 border rounded-lg bg-gray-50 ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language].sales_summary || 'Sales Summary'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                    <div className="print-header hidden print:block text-center mb-4">
                        <h2 className="text-2xl font-bold">{businessName}</h2>
                        <h3 className="text-xl">{languageData[language].sales_summary || 'Sales Summary Report'}</h3>
                        <p>{languageData[language].date_range || 'Date Range'}: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-200">
                            <thead className="bg-gray-100 text-sm">
                                <tr>
                                    <th className="py-2 px-3 border text-left">{languageData[language].date || 'Date'}</th>
                                    <th className="py-2 px-3 border text-left">{languageData[language].ref_no || 'Ref No'}</th>
                                    <th className="py-2 px-3 border text-left">{languageData[language].customer || 'Customer'}</th>
                                    <th className="py-2 px-3 border text-right">{languageData[language].discount || 'Discount'}</th>
                                    <th className="py-2 px-3 border text-right">{languageData[language].total_bill || 'Total Bill'}</th>
                                    <th className="py-2 px-3 border text-right">{languageData[language].profit || 'Profit'}</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {reportData.data.length > 0 ? reportData.data.map(sale => {
                                    const person = allPeoples.find(p => p.id === sale.personId);
                                    const personName = person ? person.name : (languageData[language].walking_customer || 'Walking Customer');
                                    return (
                                        <tr key={sale.id} className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-3 border">{new Date(sale.dateTime).toLocaleDateString()}</td>
                                            <td className="py-2 px-3 border font-mono text-xs">{sale.salesRefNo}</td>
                                            <td className="py-2 px-3 border font-medium">{personName}</td>
                                            <td className="py-2 px-3 border text-right text-amber-600">{currency} {sale.discount.toFixed(2)}</td>
                                            <td className="py-2 px-3 border text-right font-semibold">{currency} {parseFloat(sale.totalBill).toFixed(2)}</td>
                                            <td className={`py-2 px-3 border text-right font-bold ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currency} {sale.profit.toFixed(2)}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="6" className="text-center py-10 text-gray-500">{languageData[language].no_sales_found || 'No sales found for this period.'}</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-100 font-bold text-sm">
                                <tr>
                                    <td colSpan="3" className="py-2 px-3 border text-right">{languageData[language].totals || 'Totals'}:</td>
                                    <td className="py-2 px-3 border text-right text-amber-700">{currency} {reportData.summary.totalDiscount.toFixed(2)}</td>
                                    <td className="py-2 px-3 border text-right">{currency} {reportData.summary.totalBill.toFixed(2)}</td>
                                    <td className={`py-2 px-3 border text-right ${reportData.summary.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {currency} {reportData.summary.totalProfit.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="print-footer mt-4 text-right font-bold hidden print:block">
                        {languageData[language].total_profit || 'Total Gross Profit'}: {currency} {reportData.summary.totalProfit.toFixed(2)}
                    </div>
                </div>
            )}
            
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { font-size: 12px; }
                    .print-header { display: block !important; }
                    table { width: 100%; border-collapse: collapse; font-size: 10px; }
                    th, td { padding: 4px; border: 1px solid #ccc; }
                    thead th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
                    tfoot tr { background-color: #1f2937 !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .text-green-600 { color: black !important; } 
                    .text-red-600 { color: black !important; }
                }
            `}</style>
        </div>
    );
};

export default SalesSummaryReport;

