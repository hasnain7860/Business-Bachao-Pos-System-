import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext';
import languageData from '../../assets/languageData.json';
import { FaPrint, FaFilter } from 'react-icons/fa';

const ProductPerformanceReport = () => {
    const context = useAppContext();
    const { language } = context;
    
    // --- CRITICAL FIX: Universal Store Mapping ---
    // 1. All stores return 'data'
    // 2. Added Safe Fallbacks || []
    const allSales = context.SaleContext.data || [];
    const allDamages = context.damageContext?.data || [];
    const allProducts = context.productContext.data || [];

    const settingsData = context.settingContext.data || [];
    const userAndBusinessDetail = settingsData[0] || {};
    
    const currency = userAndBusinessDetail?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.business?.businessName ?? 'Business Bachao';

    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [reportData, setReportData] = useState(null);
    const [showFilters, setShowFilters] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'netProfit', direction: 'descending' });

    const handleGenerateReport = () => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const productStats = {};

        // 1. Initialize all products (Map by ID)
        allProducts.forEach(p => {
            productStats[p.id] = {
                id: p.id,
                name: p.name,
                qtySold: 0,
                revenue: 0,
                grossProfit: 0,
                qtyDamaged: 0,
                damageLoss: 0,
                netProfit: 0
            };
        });

        // 2. PROCESS SALES
        const salesInRange = allSales.filter(sale => {
            const d = new Date(sale.dateTime);
            return d >= start && d <= end;
        });

        salesInRange.forEach(sale => {
            if(!sale.products || !Array.isArray(sale.products)) return;
            
            const totalDiscount = parseFloat(sale.discount || 0);
            let rawSubtotal = parseFloat(sale.subtotal || 0);
            
            // Fallback Subtotal Calc
            if (rawSubtotal === 0) {
                rawSubtotal = sale.products.reduce((acc, p) => {
                    const price = parseFloat(p.newSellPrice) || parseFloat(p.sellPrice) || 0;
                    const qty = parseFloat(p.SellQuantity) || 0;
                    return acc + (price * qty);
                }, 0);
            }

            sale.products.forEach(p => {
                if (!productStats[p.id]) return; // Skip deleted/unknown products

                // Note: SellQuantity is Base Units in DB
                const qty = parseFloat(p.SellQuantity) || 0;
                
                // Calculate Unit Price (Revenue per unit)
                // If it was sold as Secondary Unit, newSellPrice is per secondary unit.
                // We need to normalize revenue to the line item total.
                let lineTotal = 0;
                
                if (p.enteredQty && p.newSellPrice) {
                    // New System: Entered Qty (e.g. 5 Cartons) * Price (Per Carton)
                    lineTotal = parseFloat(p.enteredQty) * parseFloat(p.newSellPrice);
                } else {
                    // Old System/Fallback: Base Qty * Unit Price
                    const price = parseFloat(p.newSellPrice) || parseFloat(p.sellPrice) || 0;
                    lineTotal = qty * price;
                }

                // Cost is always tracked in Base Units
                const cost = parseFloat(p.purchasePrice) || 0;
                const lineCost = cost * qty;

                // Distribute Discount Proportionally
                const discountShare = (rawSubtotal > 0) ? (lineTotal / rawSubtotal) * totalDiscount : 0;
                
                const actualRevenue = lineTotal - discountShare;
                const lineProfit = actualRevenue - lineCost;

                productStats[p.id].qtySold += qty;
                productStats[p.id].revenue += actualRevenue;
                productStats[p.id].grossProfit += lineProfit;
            });
        });

        // 3. PROCESS DAMAGES
        const damagesInRange = allDamages.filter(dmg => {
            const d = new Date(dmg.date);
            return d >= start && d <= end;
        });

        damagesInRange.forEach(dmg => {
            if (!productStats[dmg.productId]) return;

            // Filter: Only count Unresolved/Loss damages as Expense
            if (dmg.resolution === 'refund' || dmg.resolution === 'replace') return;

            const qty = parseFloat(dmg.quantity) || 0;
            const cost = parseFloat(dmg.purchasePrice) || 0;
            const loss = qty * cost;

            productStats[dmg.productId].qtyDamaged += qty;
            productStats[dmg.productId].damageLoss += loss;
        });

        // 4. CALCULATE NET & FLATTEN
        const finalData = Object.values(productStats)
            .map(item => ({
                ...item,
                netProfit: item.grossProfit - item.damageLoss
            }))
            .filter(item => item.qtySold > 0 || item.qtyDamaged > 0); // Remove inactive items
        
        setReportData({ data: finalData });
        setShowFilters(false);
    };
    
    const handlePrint = () => window.print();

    const sortedData = useMemo(() => {
        if (!reportData || !reportData.data) return [];
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

    const SortableHeader = ({ tkey, label }) => (
        <th className="py-2 px-2 cursor-pointer hover:bg-gray-200" onClick={() => requestSort(tkey)}>
            <div className="flex items-center justify-end gap-1">
                {label} {sortConfig.key === tkey ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
            </div>
        </th>
    );

    return (
        <div>
            {/* FILTERS */}
            <div className={`no-print p-4 border rounded-lg bg-gray-50 ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language].product_performance || 'Product Performance'}</h3>
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

            {/* REPORT TABLE */}
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

                    <div className="print-header">
                        <h2>{businessName}</h2>
                        <h3>{languageData[language].product_performance || 'Product Performance Report'}</h3>
                        <p>{languageData[language].date_range || 'Date Range'}: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-200">
                            <thead className="bg-gray-100 text-xs md:text-sm">
                                <tr>
                                    <th className="py-2 px-3 text-left border">Product Name</th>
                                    <SortableHeader tkey="qtySold" label="Sold Qty" />
                                    <SortableHeader tkey="revenue" label="Sale Value" />
                                    <SortableHeader tkey="grossProfit" label="Sales Profit" />
                                    
                                    {/* Damage Columns */}
                                    <th className="py-2 px-3 text-right border bg-red-50">Dmg Qty</th>
                                    <th className="py-2 px-3 text-right border bg-red-50">Dmg Loss</th>
                                    
                                    <SortableHeader tkey="netProfit" label="Net Profit" />
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {sortedData.length > 0 ? sortedData.map(p => (
                                <tr key={p.id} className="border-b hover:bg-gray-50">
                                    <td className="py-2 px-3 border font-medium">{p.name}</td>
                                    
                                    <td className="py-2 px-3 border text-right">{p.qtySold}</td>
                                    <td className="py-2 px-3 border text-right">{currency} {p.revenue.toFixed(0)}</td>
                                    <td className="py-2 px-3 border text-right text-green-600 font-semibold">{currency} {p.grossProfit.toFixed(0)}</td>
                                    
                                    {/* Damage Info */}
                                    <td className="py-2 px-3 border text-right bg-red-50 text-red-600">{p.qtyDamaged > 0 ? p.qtyDamaged : '-'}</td>
                                    <td className="py-2 px-3 border text-right bg-red-50 text-red-600">{p.damageLoss > 0 ? p.damageLoss.toFixed(0) : '-'}</td>
                                    
                                    {/* Net Profit */}
                                    <td className={`py-2 px-3 border text-right font-bold ${p.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {currency} {p.netProfit.toFixed(0)}
                                    </td>
                                </tr>)) : <tr><td colSpan="7" className="text-center py-6 text-gray-500">No activity found in this period.</td></tr>}
                            </tbody>
                            {sortedData.length > 0 && (
                                <tfoot className="bg-gray-800 text-white font-bold text-sm">
                                    <tr>
                                        <td className="py-2 px-3 text-right">Totals:</td>
                                        <td className="py-2 px-3 text-right">{sortedData.reduce((a,b)=>a+b.qtySold,0)}</td>
                                        <td className="py-2 px-3 text-right">{currency} {sortedData.reduce((a,b)=>a+b.revenue,0).toFixed(0)}</td>
                                        <td className="py-2 px-3 text-right">{currency} {sortedData.reduce((a,b)=>a+b.grossProfit,0).toFixed(0)}</td>
                                        <td className="py-2 px-3 text-right">{sortedData.reduce((a,b)=>a+b.qtyDamaged,0)}</td>
                                        <td className="py-2 px-3 text-right">{currency} {sortedData.reduce((a,b)=>a+b.damageLoss,0).toFixed(0)}</td>
                                        <td className="py-2 px-3 text-right">{currency} {sortedData.reduce((a,b)=>a+b.netProfit,0).toFixed(0)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}
            
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    table { width: 100%; border-collapse: collapse; font-size: 10px; }
                    th, td { padding: 4px; border: 1px solid #ccc; }
                    thead th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
                    tfoot tr { background-color: #1f2937 !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .bg-red-50 { background-color: #fef2f2 !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};

export default ProductPerformanceReport;

