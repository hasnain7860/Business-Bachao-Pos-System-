import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext'; 
import { FaPrint, FaFilter } from 'react-icons/fa';
import languageData from '../../assets/languageData.json';

const PreorderAreaReport = () => {
    const context = useAppContext();
    const { language } = context;

    // --- Data from context ---
    const allPreorders = context.preordersContext.preorders || [];
    const allProducts = context.productContext.products || []; // Needed for Unit Conversion
    const { areas } = context.areasContext;
    const { units } = context.unitContext; // Needed for Unit Names (Ctn/Pcs)
    
    const userAndBusinessDetail = context.settingContext.settings;
    const businessName = userAndBusinessDetail?.[0]?.business?.businessName ?? 'Business Bachao';

    // --- Filters State ---
    const [selectedArea, setSelectedArea] = useState('all');
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    
    const [reportData, setReportData] = useState(null);
    const [showFilters, setShowFilters] = useState(true);

    const uniqueAreas = useMemo(() => {
        return areas.sort((a, b) => a.name.localeCompare(b.name));
    }, [areas]);

    // --- HELPER: Format Quantity (Smart Unit Display) ---
    const formatQuantity = (productId, totalBaseQty) => {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return totalBaseQty;

        const qty = Number(totalBaseQty);
        const hasSecondary = product.secondaryUnitId && product.conversionRate > 1;

        if (hasSecondary) {
            const rate = Number(product.conversionRate);
            const cartons = Math.floor(qty / rate);
            const loose = qty % rate;

            const secName = units.find(u => u.id === product.secondaryUnitId)?.name || 'Ctn';
            const baseName = units.find(u => u.id === product.unitId)?.name || 'Pcs';

            if (cartons > 0 && loose > 0) return `${cartons} ${secName}, ${loose} ${baseName}`;
            if (cartons > 0) return `${cartons} ${secName}`;
            return `${qty} ${baseName}`;
        }

        // Single Unit Case
        const baseName = units.find(u => u.id === product.unitId)?.name || '';
        return `${qty} ${baseName}`;
    };

    // --- Generate Report ---
    const handleGenerateReport = () => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // 1. Filter Date
        const preordersInRange = allPreorders.filter(order => {
            const orderDate = new Date(order.preorderDate);
            return orderDate >= start && orderDate <= end;
        });

        // 2. Filter Area
        let filteredPreorders = preordersInRange;
        if (selectedArea !== 'all') {
            filteredPreorders = preordersInRange.filter(order => order.areaId === selectedArea);
        }

        // 3. Aggregate Products
        const productSummary = new Map();
        
        filteredPreorders.forEach(order => {
            if (!Array.isArray(order.products)) return; 

            order.products.forEach(product => {
                const existing = productSummary.get(product.id) || { 
                    id: product.id, 
                    name: product.name, 
                    totalBaseQuantity: 0 
                };
                
                // Always sum up the BASE QUANTITY (SellQuantity is always in Pieces now)
                existing.totalBaseQuantity += (parseFloat(product.SellQuantity) || 0);
                
                productSummary.set(product.id, existing);
            });
        });

        const finalData = Array.from(productSummary.values())
            .sort((a, b) => b.totalBaseQuantity - a.totalBaseQuantity);
        
        setReportData(finalData);
        setShowFilters(false);
    };
    
    const handlePrint = () => window.print();

    const selectedAreaName = selectedArea === 'all' ? (languageData[language].all_areas || 'All Areas') : areas.find(a => a.id === selectedArea)?.name;

    return (
        <div>
            {/* --- Filters --- */}
            <div className={`no-print p-4 border rounded-lg bg-gray-50 ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language].preorder_area_report || 'Area-wise Preorder Report'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language].filter_by_area || 'Filter by Area'}</label>
                        <select
                            value={selectedArea}
                            onChange={e => setSelectedArea(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                            <option value="all">{languageData[language].all_areas || 'All Areas'}</option>
                            {uniqueAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language].start_date || 'Start Date'}</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language].end_date || 'End Date'}</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/>
                    </div>

                    <button 
                        onClick={handleGenerateReport} 
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold h-10"
                    >
                        {languageData[language].generate || 'Generate'}
                    </button>
                </div>
            </div>

            {/* --- Report Output --- */}
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
                        <h3>{languageData[language].preorder_area_report || 'Area-wise Loading Sheet'}</h3>
                        <p>{languageData[language].area || 'Area'}: {selectedAreaName}</p>
                        <p>{languageData[language].date_range || 'Date Range'}: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    {reportData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-2 px-3 text-center border border-gray-300 w-16">S.No.</th>
                                        <th className="py-2 px-3 text-left border border-gray-300">{languageData[language].product_name || 'Product Name'}</th>
                                        <th className="py-2 px-3 text-right border border-gray-300 font-bold">{languageData[language].total_ordered_qty || 'Total Load Qty'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((item, index) => (
                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-3 text-center border border-gray-300">{index + 1}</td>
                                            <td className="py-2 px-3 font-medium border border-gray-300">{item.name}</td>
                                            
                                            {/* Smart Quantity Display (e.g., 5 Ctn, 2 Pcs) */}
                                            <td className="py-2 px-3 text-right border border-gray-300 font-bold text-blue-800">
                                                {formatQuantity(item.id, item.totalBaseQuantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center p-10 no-print">
                             <p className="text-gray-500">{languageData[language].no_data_found || 'No data found for the selected filters.'}</p>
                        </div>
                    )}
                </div>
            )}
            
             {/* No Data Helper */}
             {reportData && reportData.length === 0 && !showFilters && (
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
                    th, td { border: 1px solid #000 !important; padding: 5px; }
                    thead { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};

export default PreorderAreaReport;

