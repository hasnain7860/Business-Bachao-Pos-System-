import React, { useState } from 'react';
import { useAppContext } from '../../Appfullcontext';
import languageData from '../../assets/languageData.json';
import { FaPrint, FaFilter } from 'react-icons/fa';

const PnLReport = () => {
    const { language, SaleContext, costContext, settingContext } = useAppContext();
    const allSales = SaleContext.Sales || [];
    const allCosts = costContext.costData || [];
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
        
        const pnlSummary = salesInRange.reduce((acc, sale) => {
            acc.totalRevenue += parseFloat(sale.totalBill || 0);
            acc.totalDiscounts += parseFloat(sale.discount || 0);
            if(sale.products) {
                acc.totalCOGS += sale.products.reduce((pAcc, p) => pAcc + (parseFloat(p.purchasePrice) || 0) * (parseInt(p.SellQuantity) || 0), 0);
            }
            return acc;
        }, { totalRevenue: 0, totalDiscounts: 0, totalCOGS: 0 });

        const otherExpenses = allCosts.filter(cost => new Date(cost.date) >= start && new Date(cost.date) <= end)
                                      .reduce((acc, cost) => acc + (parseFloat(cost.cost) || 0), 0);
        
        const grossProfit = pnlSummary.totalRevenue - pnlSummary.totalCOGS;
        const netProfit = grossProfit - otherExpenses;
        
        setReportData({ type: 'pnl', data: { ...pnlSummary, grossProfit, otherExpenses, netProfit } });
        setShowFilters(false);
    };

    const handlePrint = () => window.print();
    const pnl = reportData?.data;

    return (
        <div>
            <div className={`no-print ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language].pnl_report || 'Profit & Loss Report'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div><label htmlFor="startDate" className="block text-sm font-medium text-gray-700">{languageData[language].start_date || 'Start Date'}</label><input type="date" id="startDate" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/></div>
                    <div><label htmlFor="endDate" className="block text-sm font-medium text-gray-700">{languageData[language].end_date || 'End Date'}</label><input type="date" id="endDate" value={endDate} onChange={e=>setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/></div>
                    <button onClick={handleGenerateReport} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold">{languageData[language].generate || 'Generate'}</button>
                </div>
            </div>

            {pnl && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 text-blue-600"><FaFilter /> {languageData[language].change_filters || 'Change Filters'}</button>
                        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"><FaPrint /> {languageData[language].print || 'Print'}</button>
                    </div>

                    <div className="print-header">
                        <h2>{businessName}</h2>
                        <h3>{languageData[language].pnl_report || 'Profit & Loss Report'}</h3>
                        <p>{languageData[language].date_range || 'Date Range'}: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <div className="space-y-3 text-sm md:text-base">
                            <div className="flex justify-between border-b pb-2"><span>{languageData[language].total_sale || 'Total Sale'}</span><span className="font-bold">{currency} {pnl.totalRevenue.toFixed(2)}</span></div>
                            <div className="flex justify-between border-b pb-2"><span>{languageData[language].less_discounts || 'Less: Discounts'}</span><span className="text-amber-600">({currency} {pnl.totalDiscounts.toFixed(2)})</span></div>
                            <div className="flex justify-between border-b pb-2"><span>{languageData[language].less_cogs || 'Less: Cost of Goods Sold'}</span><span className="text-red-600">({currency} {pnl.totalCOGS.toFixed(2)})</span></div>
                            <div className="flex justify-between border-b-2 border-gray-800 pb-2 text-base md:text-lg"><span className="font-bold">{languageData[language].gross_profit || 'Gross Profit'}</span><span className={`font-bold ${pnl.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{currency} {pnl.grossProfit.toFixed(2)}</span></div>
                            <div className="flex justify-between pt-2 border-b pb-2"><span>{languageData[language].less_other_expenses || 'Less: Other Expenses'}</span><span className="text-red-600">({currency} {pnl.otherExpenses.toFixed(2)})</span></div>
                            <div className="flex justify-between pt-3 mt-2 border-t-4 border-double border-black text-lg md:text-xl"><span className="font-extrabold">{languageData[language].net_profit_loss || 'Net Profit / Loss'}</span><span className={`font-extrabold ${pnl.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>{currency} {pnl.netProfit.toFixed(2)}</span></div>
                        </div>
                    </div>
                    <div className="print-footer">
                        {languageData[language].net_profit_loss || 'Net Profit / Loss'}: {currency} {pnl.netProfit.toFixed(2)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PnLReport;

