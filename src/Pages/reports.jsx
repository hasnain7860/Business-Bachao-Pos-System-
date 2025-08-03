import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../Appfullcontext';
import { FaPrint, FaChartBar, FaMoneyBillWave, FaStar } from 'react-icons/fa';
import languageData from '../assets/languageData.json';

const Reports = () => {
    const context = useAppContext();
    const { language } = context;

    // Context se data hasil karna
    const allSales = context.SaleContext.Sales || [];
    const allCosts = context.costContext.costData || [];
    const userAndBusinessDetail = context.settingContext.settings;
    const currency = userAndBusinessDetail?.[0]?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.[0]?.business?.businessName ?? 'Business Bachao';

    // State management
    const [activeReport, setActiveReport] = useState('sales');
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [reportData, setReportData] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'totalProfit', direction: 'descending' });

    const componentRef = useRef();

    // Report generate karne ka function
    const handleGenerateReport = () => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        const salesInRange = allSales.filter(sale => {
            const saleDate = new Date(sale.dateTime);
            return saleDate >= start && saleDate <= end;
        });

        if (activeReport === 'sales') {
            const processedSales = salesInRange.map(sale => {
                const totalDiscount = parseFloat(sale.discount || 0);
                let subtotal = parseFloat(sale.subtotal || 0);

                // Purane records ke liye subtotal calculate karna
                if (subtotal === 0) {
                    subtotal = sale.products.reduce((acc, p) => acc + ((parseFloat(p.newSellPrice) || parseFloat(p.sellPrice) || 0) * (parseInt(p.SellQuantity, 10) || 0)), 0);
                }

                let totalProfit = 0;
                sale.products.forEach(p => {
                    const productSubtotal = (parseFloat(p.newSellPrice) || parseFloat(p.sellPrice) || 0) * (parseInt(p.SellQuantity, 10) || 0);
                    const discountShare = (subtotal > 0) ? (productSubtotal / subtotal) * totalDiscount : 0;
                    const actualRevenue = productSubtotal - discountShare;
                    const cost = (parseFloat(p.purchasePrice) || 0) * (parseInt(p.SellQuantity, 10) || 0);
                    totalProfit += (actualRevenue - cost);
                });
                
                return { ...sale, profit: totalProfit, discount: totalDiscount };
            });

            const totalSummary = processedSales.reduce((acc, sale) => {
                acc.totalBill += parseFloat(sale.totalBill || 0);
                acc.totalDiscount += parseFloat(sale.discount || 0);
                acc.totalProfit += sale.profit;
                return acc;
            }, { totalBill: 0, totalDiscount: 0, totalProfit: 0 });

            setReportData({ type: 'sales', data: processedSales, summary: totalSummary });
        } 
        else if (activeReport === 'pnl') {
            const pnlSummary = salesInRange.reduce((acc, sale) => {
                acc.totalRevenue += parseFloat(sale.totalBill || 0);
                acc.totalDiscounts += parseFloat(sale.discount || 0);
                acc.totalCOGS += sale.products.reduce((pAcc, p) => pAcc + (parseFloat(p.purchasePrice) || 0) * (parseInt(p.SellQuantity) || 0), 0);
                return acc;
            }, { totalRevenue: 0, totalDiscounts: 0, totalCOGS: 0 });

            const otherExpenses = allCosts.filter(cost => new Date(cost.date) >= start && new Date(cost.date) <= end)
                                          .reduce((acc, cost) => acc + (parseFloat(cost.cost) || 0), 0);

            // Gross Profit = Total Sale - Cost of Goods Sold
            const grossProfit = pnlSummary.totalRevenue - pnlSummary.totalCOGS;
            // Net Profit = Gross Profit - Other Expenses
            const netProfit = grossProfit - otherExpenses;
            setReportData({ type: 'pnl', data: { ...pnlSummary, grossProfit, otherExpenses, netProfit } });
        }
        else if (activeReport === 'product') {
            const productPerformance = {};

            salesInRange.forEach(sale => {
                const totalDiscount = parseFloat(sale.discount || 0);
                let subtotal = parseFloat(sale.subtotal || 0);
                if (subtotal === 0) {
                    subtotal = sale.products.reduce((acc, p) => acc + ((parseFloat(p.newSellPrice) || parseFloat(p.sellPrice) || 0) * (parseInt(p.SellQuantity, 10) || 0)), 0);
                }

                sale.products.forEach(p => {
                    const productId = p.id;
                    if (!productPerformance[productId]) {
                        productPerformance[productId] = { id: productId, name: p.name, totalQuantity: 0, totalSale: 0, totalProfit: 0 };
                    }
                    
                    const quantity = parseInt(p.SellQuantity, 10) || 0;
                    const productSubtotal = (parseFloat(p.newSellPrice) || parseFloat(p.sellPrice) || 0) * quantity;
                    const discountShare = (subtotal > 0) ? (productSubtotal / subtotal) * totalDiscount : 0;
                    
                    const actualSale = productSubtotal - discountShare;
                    const cost = (parseFloat(p.purchasePrice) || 0) * quantity;
                    const actualProfit = actualSale - cost;
                    
                    productPerformance[productId].totalQuantity += quantity;
                    productPerformance[productId].totalSale += actualSale;
                    productPerformance[productId].totalProfit += actualProfit;
                });
            });
            setReportData({ type: 'product', data: Object.values(productPerformance) });
        }
    };
    
    const handlePrint = () => window.print();

    const sortedData = useMemo(() => {
        if (!reportData || !reportData.data.length) return [];
        let sortableItems = [...reportData.data];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [reportData, sortConfig]);

    const requestSort = (key) => {
        let direction = 'descending';
        if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ tkey, label }) => (
        <th className="py-2 px-3 cursor-pointer" onClick={() => requestSort(tkey)}>
            {label} {sortConfig.key === tkey ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
        </th>
    );

    const renderReport = () => {
        if (!reportData) return <div className="text-center p-10 bg-gray-100 rounded-lg"><p className="text-gray-500">Please select report type and date range, then click 'Generate Report'.</p></div>;

        const ReportHeader = () => (
            <div className="mb-4 print-header"><h2 className="text-2xl font-bold text-center">{businessName}</h2><h3 className="text-xl font-semibold text-center capitalize">{activeReport.replace('_', ' ')} Report</h3><p className="text-center text-sm text-gray-600">From: {new Date(startDate).toLocaleDateString()} To: {new Date(endDate).toLocaleDateString()}</p></div>
        );

        switch (reportData.type) {
            case 'sales':
                return (
                    <div><ReportHeader /><div className="overflow-x-auto"><table className="min-w-full bg-white"><thead className="bg-gray-800 text-white"><tr><th className="py-2 px-3 text-left">Date</th><th className="py-2 px-3 text-left">Ref No</th><th className="py-2 px-3 text-right">Discount</th><th className="py-2 px-3 text-right">Total Bill</th><th className="py-2 px-3 text-right">Profit</th></tr></thead><tbody className="text-gray-700">{reportData.data.length > 0 ? reportData.data.map(sale => (<tr key={sale.id} className="border-b"><td className="py-2 px-3">{new Date(sale.dateTime).toLocaleDateString()}</td><td className="py-2 px-3">{sale.salesRefNo}</td><td className="py-2 px-3 text-right text-amber-600">{currency} {sale.discount.toFixed(2)}</td><td className="py-2 px-3 text-right font-semibold">{currency} {parseFloat(sale.totalBill).toFixed(2)}</td><td className={`py-2 px-3 text-right font-bold ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currency} {sale.profit.toFixed(2)}</td></tr>)) : <tr><td colSpan="5" className="text-center py-4">No sales found.</td></tr>}</tbody><tfoot className="bg-gray-200 font-bold"><tr><td colSpan="2" className="py-2 px-3 text-right">Totals:</td><td className="py-2 px-3 text-right text-amber-700">{currency} {reportData.summary.totalDiscount.toFixed(2)}</td><td className="py-2 px-3 text-right">{currency} {reportData.summary.totalBill.toFixed(2)}</td><td className={`py-2 px-3 text-right ${reportData.summary.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{currency} {reportData.summary.totalProfit.toFixed(2)}</td></tr></tfoot></table></div></div>
                );
            case 'pnl':
                const pnl = reportData.data;
                return (
                    <div className="bg-white p-6 rounded-lg max-w-2xl mx-auto"><ReportHeader /><div className="space-y-3 text-sm md:text-base"><div className="flex justify-between border-b pb-2"><span>Total Sale</span><span className="font-bold">{currency} {pnl.totalRevenue.toFixed(2)}</span></div><div className="flex justify-between border-b pb-2"><span>Less: Discounts</span><span className="text-amber-600">({currency} {pnl.totalDiscounts.toFixed(2)})</span></div><div className="flex justify-between border-b pb-2"><span>Less: Cost of Goods Sold</span><span className="text-red-600">({currency} {pnl.totalCOGS.toFixed(2)})</span></div><div className="flex justify-between border-b-2 border-gray-800 pb-2 text-base md:text-lg"><span className="font-bold">Gross Profit</span><span className={`font-bold ${pnl.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{currency} {pnl.grossProfit.toFixed(2)}</span></div><div className="flex justify-between pt-2 border-b pb-2"><span>Less: Other Expenses</span><span className="text-red-600">({currency} {pnl.otherExpenses.toFixed(2)})</span></div><div className="flex justify-between pt-3 mt-2 border-t-4 border-double border-black text-lg md:text-xl"><span className="font-extrabold">Net Profit / Loss</span><span className={`font-extrabold ${pnl.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>{currency} {pnl.netProfit.toFixed(2)}</span></div></div></div>
                );
            case 'product':
                return (
                    <div><ReportHeader /><div className="overflow-x-auto"><table className="min-w-full bg-white"><thead className="bg-gray-800 text-white text-left"><tr><SortableHeader tkey="name" label="Product Name" /><SortableHeader tkey="totalQuantity" label="Qty Sold" /><SortableHeader tkey="totalSale" label="Total Sale" /><SortableHeader tkey="totalProfit" label="Total Profit" /></tr></thead><tbody className="text-gray-700">{sortedData.length > 0 ? sortedData.map(p => (<tr key={p.id} className="border-b"><td className="py-2 px-3">{p.name}</td><td className="py-2 px-3 font-medium">{p.totalQuantity}</td><td className="py-2 px-3 font-semibold">{currency} {p.totalSale.toFixed(2)}</td><td className={`py-2 px-3 font-bold ${p.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currency} {p.totalProfit.toFixed(2)}</td></tr>)) : <tr><td colSpan="4" className="text-center py-4">No product sales found.</td></tr>}</tbody></table></div></div>
                );
            default: return null;
        }
    };

    return (
        <><style>{`@media print {body{margin:0;}.no-print{display:none;}.print-area{box-shadow:none;padding:0;}@page{size:A4;margin:20mm;}}`}</style><div className="p-4 md:p-6 bg-gray-50 min-h-screen"><div className="no-print"><h1 className="text-3xl font-bold text-gray-800 mb-6">Reports</h1><div className="bg-white p-4 rounded-lg shadow-md mb-6"><div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"><div><label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label><div className="flex rounded-md shadow-sm"><button onClick={()=>setActiveReport('sales')} className={`flex-1 p-2 rounded-l-md ${activeReport==='sales'?'bg-blue-600 text-white':'bg-gray-200'}`}><FaChartBar className="inline mr-2"/>Sales</button><button onClick={()=>setActiveReport('pnl')} className={`flex-1 p-2 ${activeReport==='pnl'?'bg-blue-600 text-white':'bg-gray-200'}`}><FaMoneyBillWave className="inline mr-2"/>P&L</button><button onClick={()=>setActiveReport('product')} className={`flex-1 p-2 rounded-r-md ${activeReport==='product'?'bg-blue-600 text-white':'bg-gray-200'}`}><FaStar className="inline mr-2"/>Product</button></div></div><div><label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label><input type="date" id="startDate" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/></div><div><label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label><input type="date" id="endDate" value={endDate} onChange={e=>setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/></div><div className="flex space-x-2"><button onClick={handleGenerateReport} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold">Generate</button><button onClick={handlePrint} className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800"><FaPrint /></button></div></div></div></div><div ref={componentRef} className="print-area bg-white p-4 md:p-6 rounded-lg shadow-md">{renderReport()}</div></div></>
    );
};

export default Reports;

