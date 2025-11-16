import React, { useState } from 'react';
import { useAppContext } from '../../Appfullcontext';
import languageData from '../../assets/languageData.json';
import { FaPrint, FaFilter } from 'react-icons/fa';

// Component jisme date filters hain
const SalesSummaryReport = () => {
    const { language, SaleContext, peopleContext, settingContext } = useAppContext();
    const allSales = SaleContext.Sales || [];
    const allPeoples = peopleContext.people || [];
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
            if (subtotal === 0 && sale.products) {
                subtotal = sale.products.reduce((acc, p) => acc + ((parseFloat(p.newSellPrice) || parseFloat(p.sellPrice) || 0) * (parseInt(p.SellQuantity, 10) || 0)), 0);
            }
            let totalProfit = 0;
            if(sale.products) {
                sale.products.forEach(p => {
                    const productSubtotal = (parseFloat(p.newSellPrice) || parseFloat(p.sellPrice) || 0) * (parseInt(p.SellQuantity, 10) || 0);
                    const discountShare = (subtotal > 0) ? (productSubtotal / subtotal) * totalDiscount : 0;
                    const actualRevenue = productSubtotal - discountShare;
                    const cost = (parseFloat(p.purchasePrice) || 0) * (parseInt(p.SellQuantity, 10) || 0);
                    totalProfit += (actualRevenue - cost);
                });
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

    return (
        <div>
            <div className={`no-print ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language].sales_summary || 'Sales Summary'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div><label htmlFor="startDate" className="block text-sm font-medium text-gray-700">{languageData[language].start_date || 'Start Date'}</label><input type="date" id="startDate" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/></div>
                    <div><label htmlFor="endDate" className="block text-sm font-medium text-gray-700">{languageData[language].end_date || 'End Date'}</label><input type="date" id="endDate" value={endDate} onChange={e=>setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/></div>
                    <button onClick={handleGenerateReport} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold">{languageData[language].generate || 'Generate'}</button>
                </div>
            </div>

            {reportData && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 text-blue-600"><FaFilter /> {languageData[language].change_filters || 'Change Filters'}</button>
                        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"><FaPrint /> {languageData[language].print || 'Print'}</button>
                    </div>

                    <div className="print-header">
                        <h2>{businessName}</h2>
                        <h3>{languageData[language].sales_summary || 'Sales Summary Report'}</h3>
                        <p>{languageData[language].date_range || 'Date Range'}: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th>{languageData[language].date || 'Date'}</th>
                                    <th>{languageData[language].ref_no || 'Ref No'} / {languageData[language].customer || 'Customer'}</th>
                                    <th className="text-right">{languageData[language].discount || 'Discount'}</th>
                                    <th className="text-right">{languageData[language].total_bill || 'Total Bill'}</th>
                                    <th className="text-right">{languageData[language].profit || 'Profit'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.data.length > 0 ? reportData.data.map(sale => {
                                    const person = allPeoples.find(p => p.id === sale.personId);
                                    const personName = person ? person.name : (languageData[language].walking_customer || 'Walking Customer');
                                    return (
                                        <tr key={sale.id} className="border-b">
                                            <td>{new Date(sale.dateTime).toLocaleDateString()}</td>
                                            <td>
                                                {sale.salesRefNo}
                                                <span className="block text-xs text-gray-500">{personName}</span>
                                            </td>
                                            <td className="text-right text-amber-600">{currency} {sale.discount.toFixed(2)}</td>
                                            <td className="text-right font-semibold">{currency} {parseFloat(sale.totalBill).toFixed(2)}</td>
                                            <td className={`text-right font-bold ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currency} {sale.profit.toFixed(2)}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="5" className="text-center py-4">{languageData[language].no_sales_found || 'No sales found.'}</td></tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="2" className="text-right">{languageData[language].totals || 'Totals'}:</td>
                                    <td className="text-right text-amber-700">{currency} {reportData.summary.totalDiscount.toFixed(2)}</td>
                                    <td className="text-right">{currency} {reportData.summary.totalBill.toFixed(2)}</td>
                                    <td className={`text-right ${reportData.summary.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{currency} {reportData.summary.totalProfit.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                     <div className="print-footer">
                        {languageData[language].total_profit || 'Total Profit'}: {currency} {reportData.summary.totalProfit.toFixed(2)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesSummaryReport;

