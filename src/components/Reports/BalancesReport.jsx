import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext';
import languageData from '../../assets/languageData.json';
import { FaArrowDown, FaArrowUp, FaUsers, FaPrint } from 'react-icons/fa';

const BalancesReport = () => {
    const { language, peopleContext, SaleContext, purchaseContext, creditManagementContext, SellReturnContext, purchaseReturnContext, settingContext } = useAppContext();

    // --- CRITICAL FIX: Universal Store Mapping ---
    // 1. All stores return 'data'
    // 2. Added Safe Fallbacks || []
    const allSales = SaleContext.data || [];
    const allPurchases = purchaseContext.data || [];
    const allPeoples = peopleContext.data || [];
    const submittedRecords = creditManagementContext.data || [];
    const sellReturns = SellReturnContext.data || [];
    const purchaseReturns = purchaseReturnContext.data || [];
    
    // Settings is also just 'data'
    const settingsData = settingContext.data || [];
    const userAndBusinessDetail = settingsData[0] || {};
    
    const currency = userAndBusinessDetail?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.business?.businessName ?? 'Business Report';

    // --- State ---
    const [sortConfig, setSortConfig] = useState({ key: 'balance', direction: 'descending' });
    const [balanceFilter, setBalanceFilter] = useState('all'); // 'all', 'receivable', 'payable'

    // --- CORE CALCULATION LOGIC ---
    const reportData = useMemo(() => {
        // If no people loaded yet, return defaults to avoid crash
        if (allPeoples.length === 0) return { data: [], summary: { totalReceivable: 0, totalPayable: 0, debtorsCount: 0, creditorsCount: 0 } };

        const balancesData = allPeoples.map(person => {
            
            // 1. SALES (Receivable +)
            const salesCredit = allSales
                .filter(s => s.personId === person.id)
                .reduce((acc, s) => acc + (parseFloat(s.credit) || 0), 0);

            // 2. MANUAL RECORDS
            const records = submittedRecords.filter(r => r.personId === person.id);
            const manualCredit = records.filter(r => r.type === 'credit').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
            const manualPayment = records.filter(r => r.type === 'payment').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);

            // 3. RETURNS
            const sReturns = sellReturns.filter(r => r.peopleId === person.id);
            const salesReturnAdj = sReturns.reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);

            const pReturns = purchaseReturns.filter(r => r.people === person.id || r.peopleId === person.id);
            const purchReturnAdj = pReturns.reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);

            // 4. PURCHASES (Payable -)
            const purchases = allPurchases.filter(p => p.personId === person.id);
            const purchaseCredit = purchases.reduce((acc, p) => acc + (parseFloat(p.credit) || 0), 0);

            // --- NET BALANCE FORMULA ---
            // (Lene Walay) - (Dene Walay)
            const totalReceivablePlus = salesCredit + manualCredit + purchReturnAdj;
            const totalPayableMinus = purchaseCredit + manualPayment + salesReturnAdj;
            
            const finalBalance = totalReceivablePlus - totalPayableMinus;
            
            return { 
                id: person.id, 
                name: person.name, 
                phone: person.phone,
                balance: finalBalance 
            };
        });

        // --- FILTERING ---
        // Remove people with 0 balance (Tolerance 0.01)
        let filteredBalances = balancesData.filter(p => Math.abs(p.balance) > 0.01);

        if (balanceFilter === 'receivable') {
            filteredBalances = filteredBalances.filter(p => p.balance > 0);
        } else if (balanceFilter === 'payable') {
            filteredBalances = filteredBalances.filter(p => p.balance < 0);
        }

        // --- SUMMARY CALCULATION ---
        const summary = filteredBalances.reduce((acc, item) => {
            if (item.balance > 0) {
                acc.totalReceivable += item.balance;
                acc.debtorsCount += 1;
            } else {
                acc.totalPayable += Math.abs(item.balance);
                acc.creditorsCount += 1;
            }
            return acc;
        }, { totalReceivable: 0, totalPayable: 0, debtorsCount: 0, creditorsCount: 0 });

        return { data: filteredBalances, summary };
    }, [allPeoples, allSales, allPurchases, submittedRecords, sellReturns, purchaseReturns, balanceFilter]);

    // --- SORTING ---
    const sortedData = useMemo(() => {
        let sortableItems = [...reportData.data];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [reportData.data, sortConfig]);

    const requestSort = (key) => {
        let direction = 'descending';
        if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending';
        setSortConfig({ key, direction });
    };

    const { summary } = reportData;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            
            {/* Print Header */}
            <div className="hidden print-header text-center mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold">{businessName}</h1>
                <h2 className="text-xl text-gray-600">Balances Report</h2>
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
            </div>

            <div className="flex justify-between items-center mb-6 no-print">
                <h3 className="text-2xl font-bold text-gray-800">{languageData[language]?.balances_report || 'Balances Report'}</h3>
                <button onClick={handlePrint} className="btn btn-primary gap-2 shadow-md">
                    <FaPrint /> Print Report
                </button>
            </div>
            
            {/* --- FILTERS --- */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 no-print">
                <div className="flex rounded-lg shadow-sm bg-white overflow-hidden border border-gray-200">
                    <button 
                        onClick={() => setBalanceFilter('all')} 
                        className={`px-6 py-2 text-sm font-bold transition-colors ${balanceFilter === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                        All
                    </button>
                    <div className="w-px bg-gray-200"></div>
                    <button 
                        onClick={() => setBalanceFilter('receivable')} 
                        className={`px-6 py-2 text-sm font-bold transition-colors ${balanceFilter === 'receivable' ? 'bg-green-600 text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                        Receivable (Lene)
                    </button>
                    <div className="w-px bg-gray-200"></div>
                    <button 
                        onClick={() => setBalanceFilter('payable')} 
                        className={`px-6 py-2 text-sm font-bold transition-colors ${balanceFilter === 'payable' ? 'bg-red-600 text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                        Payable (Dene)
                    </button>
                </div>
            </div>
            
            {/* --- SUMMARY CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 no-print">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                    <div className="flex items-center gap-2 mb-1 text-green-700">
                        <FaArrowDown /> <span className="text-sm font-bold">Total Receivable</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{currency} {summary.totalReceivable.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{summary.debtorsCount} People</p>
                </div>
                 <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                    <div className="flex items-center gap-2 mb-1 text-red-700">
                        <FaArrowUp /> <span className="text-sm font-bold">Total Payable</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{currency} {summary.totalPayable.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{summary.creditorsCount} People</p>
                </div>
                 <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-1 text-blue-700">
                        <FaUsers /> <span className="text-sm font-bold">Net Position</span>
                    </div>
                    <p className={`text-2xl font-bold ${(summary.totalReceivable - summary.totalPayable) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currency} {(summary.totalReceivable - summary.totalPayable).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{(summary.totalReceivable - summary.totalPayable) >= 0 ? 'Overall Profit' : 'Overall Liability'}</p>
                </div>
            </div>

            {/* --- TABLE --- */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="py-3 px-4 text-left cursor-pointer hover:bg-gray-200" onClick={() => requestSort('name')}>
                                    Name {sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-3 px-4 text-left">Phone</th>
                                <th className="py-3 px-4 text-left">Status</th>
                                <th className="py-3 px-4 text-right cursor-pointer hover:bg-gray-200" onClick={() => requestSort('balance')}>
                                    Amount {sortConfig.key === 'balance' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.length > 0 ? sortedData.map(p => (
                                <tr key={p.id} className="border-b hover:bg-blue-50 transition-colors">
                                    <td className="py-3 px-4 font-semibold">{p.name}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{p.phone || '-'}</td>
                                    <td className="py-3 px-4">
                                        {p.balance > 0 
                                            ? <span className="badge bg-green-100 text-green-800 border-0 font-bold">Receivable</span> 
                                            : <span className="badge bg-red-100 text-red-800 border-0 font-bold">Payable</span>
                                        }
                                    </td>
                                    <td className={`py-3 px-4 text-right font-mono font-bold text-lg ${p.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {currency} {Math.abs(p.balance).toFixed(2)}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-400">No outstanding balances found.</td></tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold text-gray-800">
                            <tr>
                                <td colSpan="3" className="py-3 px-4 text-right">Total:</td>
                                <td className="py-3 px-4 text-right text-xl">
                                    {currency} {sortedData.reduce((acc, curr) => acc + curr.balance, 0).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BalancesReport;

