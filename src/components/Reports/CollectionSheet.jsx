import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext';
import { FaPrint, FaFilter } from 'react-icons/fa';
import languageData from '../../assets/languageData.json';

const CollectionSheet = () => {
    const context = useAppContext();
    const { language } = context;

    // --- CRITICAL FIX: Universal Store Mapping ---
    // 1. All stores return 'data'
    // 2. Added Safe Fallbacks || []
    const areas = context.areasContext.data || [];
    const allSales = context.SaleContext.data || [];
    const allPurchases = context.purchaseContext.data || [];
    const allPeoples = context.peopleContext.data || [];
    const submittedRecords = context.creditManagementContext.data || [];
    const sellReturns = context.SellReturnContext.data || [];
    const purchaseReturns = context.purchaseReturnContext.data || [];
    
    const settingsData = context.settingContext.data || [];
    const userAndBusinessDetail = settingsData[0] || {};
    
    const currency = userAndBusinessDetail?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.business?.businessName ?? 'Business Bachao';

    // --- State ---
    const [selectedArea, setSelectedArea] = useState('all');
    const [reportData, setReportData] = useState([]);
    const [showFilters, setShowFilters] = useState(true);

    // --- Memos ---
    const uniqueAreas = useMemo(() => {
        return [...areas].sort((a, b) => a.name.localeCompare(b.name));
    }, [areas]);

    const getPersonDetails = (personId) => {
        const person = allPeoples.find(p => p.id === personId);
        // Code will now be displayed as raw number (e.g., 1000)
        const codeDisplay = person && person.code ? `${person.code}` : 'N/A'; 
        return {
            name: person?.name || 'Unknown',
            codeDisplay: codeDisplay
        };
    }

    const calculateBalances = () => {
        return allPeoples.map(person => {
            // 1. SALES (Receivable +)
            const totalSalesCredit = allSales.filter(s => s.personId === person.id).reduce((acc, s) => acc + (parseFloat(s.credit) || 0), 0);
            
            // 2. MANUAL RECORDS
            const manualCredit = submittedRecords.filter(r => r.personId === person.id && r.type === 'credit').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
            const manualPayments = submittedRecords.filter(r => r.personId === person.id && r.type === 'payment').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
            
            // 3. RETURNS
            const sellReturnAdjustments = sellReturns.filter(r => r.peopleId === person.id || r.people === person.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
            const purchaseReturnAdjustments = purchaseReturns.filter(r => r.people === person.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);

            // 4. PURCHASES (Payable -)
            const totalPurchaseCredit = allPurchases.filter(p => p.personId === person.id).reduce((acc, p) => acc + (parseFloat(p.credit) || 0), 0);

            // --- FORMULA ---
            const totalReceivable = totalSalesCredit + manualCredit;
            const totalReductions = manualPayments + sellReturnAdjustments;
            const netReceivable = totalReceivable - totalReductions;
            
            const netPayable = totalPurchaseCredit - purchaseReturnAdjustments;
            
            const finalBalance = netReceivable - netPayable;
            
            // --- Combine name and code ---
            const { name, codeDisplay } = getPersonDetails(person.id);

            return {
                id: person.id,
                displayName: `${name} - ${codeDisplay}`,
                areaId: person.areaId,
                balance: finalBalance,
            };
        });
    };

    // --- Functions ---
    const handleGenerateReport = () => {
        const allBalances = calculateBalances();
        // Only showing positive balance (Receivables) for Collection Sheet usually
        let filteredData = allBalances.filter(p => p.balance > 0); 
        
        if (selectedArea !== 'all') {
            filteredData = filteredData.filter(p => p.areaId === selectedArea);
        }
        filteredData.sort((a, b) => b.balance - a.balance);
        setReportData(filteredData);
        setShowFilters(false);
    };
    
    const handlePrint = () => window.print();

    const totalBqaya = reportData.reduce((acc, item) => acc + item.balance, 0);

    const getAreaName = (areaId) => {
        const area = areas.find(a => a.id === areaId);
        return area ? area.name : (languageData[language]?.not_assigned || 'Not Assigned');
    };

    const selectedAreaName = selectedArea === 'all' ? (languageData[language]?.all_areas || 'All Areas') : getAreaName(selectedArea);

    return (
        <div>
            {/* --- FILTERS --- */}
            <div className={`no-print p-4 border rounded-lg bg-gray-50 ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language]?.collection_sheet || 'Collection Sheet'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="areaFilter" className="block text-sm font-medium text-gray-700">{languageData[language]?.filter_by_area || 'Filter by Area'}</label>
                        <select
                            id="areaFilter"
                            value={selectedArea}
                            onChange={e => setSelectedArea(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                            <option value="all">{languageData[language]?.all_areas || 'All Areas'}</option>
                            {uniqueAreas.map(area => (
                                <option key={area.id} value={area.id}>{area.name}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={handleGenerateReport} 
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold h-10"
                    >
                        {languageData[language]?.generate || 'Generate'}
                    </button>
                </div>
            </div>

            {/* --- Report Data --- */}
            {!showFilters && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 text-blue-600 hover:underline">
                            <FaFilter /> {languageData[language]?.change_filters || 'Change Filters'}
                        </button>
                        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                            <FaPrint /> {languageData[language]?.print || 'Print'}
                        </button>
                    </div>

                    {/* Report Header (Print Only) */}
                    <div className="print-header hidden print:block mb-4">
                        <h2 className="text-2xl font-bold">{businessName}</h2>
                        <h3 className="text-xl">{languageData[language]?.collection_sheet || 'Collection Sheet'}</h3>
                        <p>{languageData[language]?.area || 'Area'}: {selectedAreaName}</p>
                        <p>{languageData[language]?.print_date || 'Print Date'}: {new Date().toLocaleDateString()}</p>
                    </div>

                    {/* Sirf tab dikhayein jab data ho */}
                    {reportData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full collection-sheet-table border-collapse border border-gray-300">
                                {/* Table Header */}
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-2 px-3 border border-gray-300 text-center">S.No.</th>
                                        <th className="py-2 px-3 border border-gray-300 text-left">{languageData[language]?.customer_name || 'Customer Name'} (Code)</th>
                                        <th className="py-2 px-3 border border-gray-300 text-left">{languageData[language]?.area || 'Area'}</th>
                                        <th className="py-2 px-3 border border-gray-300 text-right">{languageData[language]?.total_bqaya || 'Total Bqaya'}</th>
                                        <th className="py-2 px-3 border border-gray-300 text-left w-32">{languageData[language]?.received_amount || 'Received Amount'}</th>
                                        <th className="py-2 px-3 border border-gray-300 text-left w-32">{languageData[language]?.signature || 'Signature'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((person, index) => (
                                        <tr key={person.id} className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-3 border border-gray-300 text-center">{index + 1}</td>
                                            <td className="py-2 px-3 border border-gray-300 font-medium">{person.displayName}</td>
                                            <td className="py-2 px-3 border border-gray-300">{getAreaName(person.areaId)}</td>
                                            <td className="py-2 px-3 border border-gray-300 text-right font-bold text-red-600">
                                                {currency} {person.balance.toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300"></td>
                                            <td className="border border-gray-300"></td>
                                        </tr>
                                    ))}
                                </tbody>
                                {/* Footer */}
                                <tfoot className="bg-gray-100 font-bold">
                                    <tr>
                                        <td colSpan="3" className="py-3 px-3 border border-gray-300 text-right">{languageData[language]?.total || 'Total'}:</td>
                                        <td className="py-3 px-3 border border-gray-300 text-right text-red-700">
                                            {currency} {totalBqaya.toFixed(2)}
                                        </td>
                                        <td colSpan="2" className="border border-gray-300"></td> 
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        // "No Data" message
                        <div className="text-center p-10 mt-6 bg-white rounded-lg shadow no-print">
                            <p className="text-gray-500">{languageData[language]?.no_data_found || 'No data found for the selected filters.'}</p>
                            <button onClick={() => setShowFilters(true)} className="mt-4 flex items-center gap-2 text-blue-600 mx-auto hover:underline">
                                <FaFilter /> {languageData[language]?.change_filters || 'Change Filters'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CollectionSheet;

