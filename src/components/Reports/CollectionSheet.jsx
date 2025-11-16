import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext'; // Path update karein
import { FaPrint, FaFilter } from 'react-icons/fa';
import languageData from '../../assets/languageData.json'; // Path update karein

const CollectionSheet = () => {
    const context = useAppContext();
    const { language } = context;

    // --- NAYE LOGIC KE LIYE DATA ---
    const { areas } = context.areasContext; // Areas ki list
    const allSales = context.SaleContext.Sales || [];
    const allPurchases = context.purchaseContext.purchases || [];
    const allPeoples = context.peopleContext.people || [];
    const submittedRecords = context.creditManagementContext.submittedRecords || [];
    const sellReturns = context.SellReturnContext.sellReturns || [];
    const purchaseReturns = context.purchaseReturnContext.purchaseReturns || [];
    
    const userAndBusinessDetail = context.settingContext.settings;
    const currency = userAndBusinessDetail?.[0]?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.[0]?.business?.businessName ?? 'Business Bachao';

    // --- Filters State ---
    const [selectedArea, setSelectedArea] = useState('all'); // 'all' ya area ki ID
    const [reportData, setReportData] = useState([]);
    const [showFilters, setShowFilters] = useState(true);

    // Area ki list Dropdown ke liye
    const uniqueAreas = useMemo(() => {
        return areas.sort((a, b) => a.name.localeCompare(b.name));
    }, [areas]);

    // Har aadmi ka final balance calculate karne ka logic
    const calculateBalances = () => {
        return allPeoples.map(person => {
            // Receivable (Hum ne lene hain)
            const totalSalesCredit = allSales.filter(s => s.personId === person.id).reduce((acc, s) => acc + (parseFloat(s.credit) || 0), 0);
            const manualCredit = submittedRecords.filter(r => r.personId === person.id && r.type === 'credit').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
            const totalReceivable = totalSalesCredit + manualCredit;
            
            const manualPayments = submittedRecords.filter(r => r.personId === person.id && r.type === 'payment').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
            const sellReturnAdjustments = sellReturns.filter(r => r.peopleId === person.id || r.people === person.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
            const totalReductions = manualPayments + sellReturnAdjustments;
            
            const netReceivable = totalReceivable - totalReductions;

            // Payable (Hum ne dene hain)
            const totalPurchaseCredit = allPurchases.filter(p => p.personId === person.id).reduce((acc, p) => acc + (parseFloat(p.credit) || 0), 0);
            const purchaseReturnAdjustments = purchaseReturns.filter(r => r.people === person.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
            const netPayable = totalPurchaseCredit - purchaseReturnAdjustments;

            const finalBalance = netReceivable - netPayable;
            
            return {
                id: person.id,
                name: person.name,
                areaId: person.areaId, // areaId ko save karein
                balance: finalBalance,
            };
        });
    };

    // Report generate karne ka function
    const handleGenerateReport = () => {
        const allBalances = calculateBalances();
        
        let filteredData = allBalances
            // Sirf "Receivable" (lene wale) log dikhayein
            .filter(p => p.balance > 0); 

        // Area ke hisab se filter karein (ab ID se)
        if (selectedArea !== 'all') {
            filteredData = filteredData.filter(p => p.areaId === selectedArea);
        }

        // Balance ke hisab se sort karein (ziada bqaya upar)
        filteredData.sort((a, b) => b.balance - a.balance);

        setReportData(filteredData);
        setShowFilters(false); // Report generate karne ke baad filters hide karein
    };
    
    const handlePrint = () => window.print();

    const totalBqaya = reportData.reduce((acc, item) => acc + item.balance, 0);

    // Helper function
    const getAreaName = (areaId) => {
        const area = areas.find(a => a.id === areaId);
        return area ? area.name : (languageData[language].not_assigned || 'Not Assigned');
    };

    const selectedAreaName = selectedArea === 'all' ? (languageData[language].all_areas || 'All Areas') : getAreaName(selectedArea);

    return (
        <div>
            {/* --- Filters (No Print) --- */}
            <div className={`no-print ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language].collection_sheet || 'Collection Sheet'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="areaFilter" className="block text-sm font-medium text-gray-700">{languageData[language].filter_by_area || 'Filter by Area'}</label>
                        <select
                            id="areaFilter"
                            value={selectedArea}
                            onChange={e => setSelectedArea(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                            <option value="all">{languageData[language].all_areas || 'All Areas'}</option>
                            {uniqueAreas.map(area => (
                                <option key={area.id} value={area.id}>{area.name}</option>
                            ))}
                        </select>
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
            {reportData.length > 0 && (
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
                        <h3>{languageData[language].collection_sheet || 'Collection Sheet'}</h3>
                        <p>{languageData[language].area || 'Area'}: {selectedAreaName}</p>
                        <p>{languageData[language].print_date || 'Print Date'}: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full collection-sheet-table">
                            <thead>
                                <tr>
                                    <th>S.No.</th>
                                    <th>{languageData[language].customer_name || 'Customer Name'}</th>
                                    <th>{languageData[language].area || 'Area'}</th>
                                    <th className="text-right">{languageData[language].total_bqaya || 'Total Bqaya'}</th>
                                    <th className="text-left">{languageData[language].received_amount || 'Received Amount'}</th>
                                    <th className="text-left">{languageData[language].signature || 'Signature'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((person, index) => (
                                    <tr key={person.id} className="border-b hover:bg-gray-50">
                                        <td className="text-center">{index + 1}</td>
                                        <td>{person.name}</td>
                                        <td>{getAreaName(person.areaId)}</td>
                                        <td className="text-right font-bold text-red-600">
                                            {currency} {person.balance.toFixed(2)}
                                        </td>
                                        <td className="received-line"></td>
                                        <td className="signature-line"></td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="3" className="text-right">{languageData[language].total || 'Total'}:</td>
                                    <td className="text-right">
                                        {currency} {totalBqaya.toFixed(2)}
                                    </td>
                                    <td colSpan="2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="print-footer">
                        {languageData[language].total || 'Total'}: {currency} {totalBqaya.toFixed(2)}
                    </div>
                </div>
            )}
            {reportData.length === 0 && !showFilters && (
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

export default CollectionSheet;


