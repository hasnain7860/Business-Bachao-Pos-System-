import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext'; // Path update karein
import { FaPrint, FaFilter } from 'react-icons/fa';
import languageData from '../../assets/languageData.json'; // Path update karein

const PreorderAreaReport = () => {
    const context = useAppContext();
    const { language } = context;

    // --- Data from context ---
    const allPreorders = context.preordersContext.preorders || [];
    const allPeoples = context.peopleContext.people || [];
    const { areas } = context.areasContext;
    
    const userAndBusinessDetail = context.settingContext.settings;
    const businessName = userAndBusinessDetail?.[0]?.business?.businessName ?? 'Business Bachao';

    // --- Filters State ---
    const [selectedArea, setSelectedArea] = useState('all');
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    
    const [reportData, setReportData] = useState(null);
    const [showFilters, setShowFilters] = useState(true);

    // Area ki list Dropdown ke liye
    const uniqueAreas = useMemo(() => {
        return areas.sort((a, b) => a.name.localeCompare(b.name));
    }, [areas]);

    // Report generate karne ka function
    const handleGenerateReport = () => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // 1. Date se filter karein
        const preordersInRange = allPreorders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= start && orderDate <= end;
        });

        // 2. Area ke hisab se filter karein
        let filteredPreorders = preordersInRange;
        if (selectedArea !== 'all') {
            // Un logon ki ID nikalein jo is area mein hain
            const peopleInArea = allPeoples
                .filter(p => p.areaId === selectedArea)
                .map(p => p.id);
            
            // Sirf un preorders ko rakhein jo un logon ke hain
            filteredPreorders = preordersInRange.filter(order => peopleInArea.includes(order.personId));
        }

        // 3. Products ko aggregate karein
        const productSummary = new Map();
        filteredPreorders.forEach(order => {
            order.products.forEach(product => {
                const existing = productSummary.get(product.id) || { id: product.id, name: product.name, totalQuantity: 0 };
                existing.totalQuantity += (parseInt(product.quantity, 10) || 0);
                productSummary.set(product.id, existing);
            });
        });

        const finalData = Array.from(productSummary.values())
            .sort((a, b) => b.totalQuantity - a.totalQuantity); // Ziada quantity wale upar
        
        setReportData(finalData);
        setShowFilters(false);
    };
    
    const handlePrint = () => window.print();

    const selectedAreaName = selectedArea === 'all' ? (languageData[language].all_areas || 'All Areas') : areas.find(a => a.id === selectedArea)?.name;

    return (
        <div>
            {/* --- Filters (No Print) --- */}
            <div className={`no-print ${showFilters ? '' : 'hidden'}`}>
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
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold"
                    >
                        {languageData[language].generate || 'Generate'}
                    </button>
                </div>
            </div>

            {/* --- Report Data --- */}
            {reportData && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 text-blue-600">
                            <FaFilter /> {languageData[language].change_filters || 'Change Filters'}
                        </button>
                        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                            <FaPrint /> {languageData[language].print || 'Print'}
                        </button>
                    </div>

                    <div className="print-header">
                        <h2>{businessName}</h2>
                        <h3>{languageData[language].preorder_area_report || 'Area-wise Preorder Report'}</h3>
                        <p>{languageData[language].area || 'Area'}: {selectedAreaName}</p>
                        <p>{languageData[language].date_range || 'Date Range'}: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>{languageData[language].product_name || 'Product Name'}</th>
                                    <th className="text-right">{languageData[language].total_ordered_qty || 'Total Ordered Qty'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((item, index) => (
                                    <tr key={item.id} className="border-b hover:bg-gray-50">
                                        <td className="text-center">{index + 1}</td>
                                        <td className="font-medium">{item.name}</td>
                                        <td className="text-right font-bold">{item.totalQuantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
             {reportData && reportData.length === 0 && !showFilters && (
                 <div className="text-center p-10">
                    <p className="text-gray-500">{languageData[language].no_data_found || 'No data found for the selected filters.'}</p>
                    <button onClick={() => setShowFilters(true)} className="mt-4 flex items-center gap-2 text-blue-600 mx-auto">
                        <FaFilter /> {languageData[language].change_filters || 'Change Filters'}
                    </button>
                 </div>
            )}
        </div>
    );
};

export default PreorderAreaReport;

