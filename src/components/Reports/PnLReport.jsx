import React, { useState } from 'react';
import { useAppContext } from '../../Appfullcontext';
import languageData from '../../assets/languageData.json';
import { FaPrint, FaFilter } from 'react-icons/fa';

const PnLReport = () => {
    const context = useAppContext();
    const { language } = context;
    
    // --- CRITICAL FIX: Universal Store Mapping ---
    // 1. Map .data to variables
    // 2. Add Safe Fallbacks || []
    const allSales = context.SaleContext.data || [];
    const allCosts = context.costContext.data || [];
    const allDamages = context.damageContext.data || []; 

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

        // 1. SALES CALCULATION
        const salesInRange = allSales.filter(sale => {
            const saleDate = new Date(sale.dateTime);
            return saleDate >= start && saleDate <= end;
        });
        
        const pnlSummary = salesInRange.reduce((acc, sale) => {
            acc.totalRevenue += parseFloat(sale.totalBill || 0);
            acc.totalDiscounts += parseFloat(sale.discount || 0);
            
            if(sale.products && Array.isArray(sale.products)) {
                // COGS = Purchase Price * Sold Qty (Base Units)
                acc.totalCOGS += sale.products.reduce((pAcc, p) => {
                    // Note: SellQuantity is stored as Base Units in DB
                    return pAcc + (parseFloat(p.purchasePrice) || 0) * (parseFloat(p.SellQuantity) || 0);
                }, 0);
            }
            return acc;
        }, { totalRevenue: 0, totalDiscounts: 0, totalCOGS: 0 });

        // 2. EXPENSES CALCULATION
        const otherExpenses = allCosts
            .filter(cost => {
                const cDate = new Date(cost.date);
                return cDate >= start && cDate <= end;
            })
            .reduce((acc, cost) => acc + (parseFloat(cost.cost) || 0), 0);
        
        // 3. DAMAGE CALCULATION
        const damageLoss = allDamages
            .filter(dmg => {
                const dDate = new Date(dmg.date);
                return dDate >= start && dDate <= end;
            })
            .reduce((acc, dmg) => {
                // Logic: If Resolved as Refund/Replace -> No financial loss for PnL
                if (dmg.resolution === 'refund' || dmg.resolution === 'replace') return acc;
                
                // Loss = Cost Price * Qty
                const cost = (parseFloat(dmg.purchasePrice) || 0) * (parseFloat(dmg.quantity) || 0);
                return acc + cost;
            }, 0);

        // 4. FINAL FORMULAS
        const grossProfit = pnlSummary.totalRevenue - pnlSummary.totalCOGS;
        const netProfit = grossProfit - otherExpenses - damageLoss; 
        
        setReportData({ 
            type: 'pnl', 
            data: { 
                ...pnlSummary, 
                grossProfit, 
                otherExpenses, 
                damageLoss, 
                netProfit 
            } 
        });
        setShowFilters(false);
    };

    const handlePrint = () => window.print();
    const pnl = reportData?.data;

    return (
        <div>
            {/* FILTERS */}
            <div className={`no-print p-4 border rounded-lg bg-gray-50 ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language]?.pnl_report || 'Profit & Loss Report'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language]?.start_date || 'Start Date'}</label>
                        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language]?.end_date || 'End Date'}</label>
                        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/>
                    </div>
                    <button onClick={handleGenerateReport} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold h-10">
                        {languageData[language]?.generate || 'Generate'}
                    </button>
                </div>
            </div>

            {/* REPORT CONTENT */}
            {pnl && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 text-blue-600 hover:underline">
                            <FaFilter /> {languageData[language]?.change_filters || 'Change Filters'}
                        </button>
                        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                            <FaPrint /> {languageData[language]?.print || 'Print'}
                        </button>
                    </div>

                    <div className="print-header hidden print:block mb-4 text-center">
                        <h2 className="text-2xl font-bold">{businessName}</h2>
                        <h3 className="text-xl">{languageData[language]?.pnl_report || 'Profit & Loss Report'}</h3>
                        <p>{languageData[language]?.date_range || 'Date Range'}: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    <div className="max-w-3xl mx-auto border border-gray-300 p-6 bg-white shadow-sm rounded-lg print:border-0 print:shadow-none">
                        <div className="space-y-4 text-sm md:text-base">
                            
                            {/* Revenue Section */}
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="font-medium text-gray-700">{languageData[language]?.total_sale || 'Total Sales Revenue'}</span>
                                <span className="font-bold text-gray-900">{currency} {pnl.totalRevenue.toFixed(2)}</span>
                            </div>
                            
                            <div className="pl-4 space-y-2 text-gray-600">
                                <div className="flex justify-between">
                                    <span>{languageData[language]?.less_discounts || 'Less: Discounts given'}</span>
                                    <span className="text-red-500">({currency} {pnl.totalDiscounts.toFixed(2)})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{languageData[language]?.less_cogs || 'Less: Cost of Goods Sold (Product Cost)'}</span>
                                    <span className="text-red-500">({currency} {pnl.totalCOGS.toFixed(2)})</span>
                                </div>
                            </div>

                            {/* Gross Profit */}
                            <div className="flex justify-between border-t-2 border-black pt-2 pb-4 text-lg">
                                <span className="font-bold text-gray-800">{languageData[language]?.gross_profit || 'Gross Profit'}</span>
                                <span className={`font-bold ${pnl.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {currency} {pnl.grossProfit.toFixed(2)}
                                </span>
                            </div>

                            {/* Operating Expenses Section */}
                            <div className="pl-4 space-y-2 text-gray-600 border-t border-gray-200 pt-4">
                                <div className="flex justify-between">
                                    <span>{languageData[language]?.less_other_expenses || 'Less: Operating Expenses'}</span>
                                    <span className="text-red-500">({currency} {pnl.otherExpenses.toFixed(2)})</span>
                                </div>
                                
                                {/* Damage Line Item */}
                                <div className="flex justify-between">
                                    <span className="flex items-center gap-2">
                                        {languageData[language]?.less_damage || 'Less: Damaged Stock Loss'} 
                                        {pnl.damageLoss > 0 && <span className="text-xs bg-red-100 text-red-700 px-1 rounded print:hidden">Impact</span>}
                                    </span>
                                    <span className="text-red-500 font-medium">({currency} {pnl.damageLoss.toFixed(2)})</span>
                                </div>
                            </div>

                            {/* Net Profit */}
                            <div className="flex justify-between pt-4 mt-4 border-t-4 border-double border-black text-xl bg-gray-50 p-2 rounded print:bg-transparent">
                                <span className="font-extrabold text-gray-900 uppercase">{languageData[language]?.net_profit_loss || 'Net Profit / Loss'}</span>
                                <span className={`font-extrabold ${pnl.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                                    {currency} {pnl.netProfit.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="print-footer text-center mt-8 text-gray-500 text-sm hidden print:block">
                        {languageData[language]?.net_profit_loss || 'Net Profit / Loss'}: {currency} {pnl.netProfit.toFixed(2)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PnLReport;

