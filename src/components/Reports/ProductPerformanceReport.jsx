import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext';
import languageData from '../../assets/languageData.json';
import { FaPrint, FaFilter } from 'react-icons/fa';

const ProductPerformanceReport = () => {
    const { language, SaleContext, settingContext } = useAppContext();
    const allSales = SaleContext.Sales || [];
    const userAndBusinessDetail = settingContext.settings;
    const currency = userAndBusinessDetail?.[0]?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.[0]?.business?.businessName ?? 'Business Bachao';

    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [reportData, setReportData] = useState(null);
    const [showFilters, setShowFilters] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'totalProfit', direction: 'descending' });

    const handleGenerateReport = () => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const salesInRange = allSales.filter(sale => new Date(sale.dateTime) >= start && new Date(sale.dateTime) <= end);
        
        const productPerformance = {};
        salesInRange.forEach(sale => {
            if(!sale.products) return;
            const totalDiscount = parseFloat(sale.discount || 0);
            let subtotal = parseFloat(sale.subtotal || 0);
            if (subtotal === 0) subtotal = sale.products.reduce((acc, p) => acc + ((parseFloat(p.newSellPrice) || parseFloat(p.sellPrice) || 0) * (parseInt(p.SellQuantity, 10) || 0)), 0);
            
            sale.products.forEach(p => {
                const productId = p.id;
                if (!productPerformance[productId]) productPerformance[productId] = { id: productId, name: p.name, totalQuantity: 0, totalSale: 0, totalProfit: 0 };
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
        setShowFilters(false);
    };
    
    const handlePrint = () => window.print();

    const sortedData = useMemo(() => {
        if (!reportData || !reportData.data || !Array.isArray(reportData.data)) return [];
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
        if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending';
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ tkey, label }) => (<th className="py-2 px-3 cursor-pointer" onClick={() => requestSort(tkey)}>{label} {sortConfig.key === tkey ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}</th>);

    return (
        <div>
            <div className={`no-print ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language].product_performance || 'Product Performance'}</h3>
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
                        <h3>{languageData[language].product_performance || 'Product Performance Report'}</h3>
                        <p>{languageData[language].date_range || 'Date Range'}: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <SortableHeader tkey="name" label={languageData[language].product_name || 'Product Name'} />
                                    <SortableHeader tkey="totalQuantity" label={languageData[language].qty_sold || 'Qty Sold'} />
                                    <SortableHeader tkey="totalSale" label={languageData[language].total_sale || 'Total Sale'} />
                                    <SortableHeader tkey="totalProfit" label={languageData[language].total_profit || 'Total Profit'} />
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.length > 0 ? sortedData.map(p => (
                                <tr key={p.id} className="border-b">
                                    <td>{p.name}</td>
                                    <td className="font-medium text-right">{p.totalQuantity}</td>
                                    <td className="font-semibold text-right">{currency} {p.totalSale.toFixed(2)}</td>
                                    <td className={`font-bold text-right ${p.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currency} {p.totalProfit.toFixed(2)}</td>
                                </tr>)) : <tr><td colSpan="4" className="text-center py-4">{languageData[language].no_product_sales_found || 'No product sales found.'}</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductPerformanceReport;

