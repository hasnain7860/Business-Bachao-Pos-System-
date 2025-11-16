import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext';
import languageData from '../../assets/languageData.json';

// Simple component: Koi filter nahi, sirf data dikhata hai
const BalancesReport = () => {
    const { language, peopleContext, SaleContext, purchaseContext, creditManagementContext, SellReturnContext, purchaseReturnContext, settingContext } = useAppContext();

    const allSales = SaleContext.Sales || [];
    const allPurchases = purchaseContext.purchases || [];
    const allPeoples = peopleContext.people || [];
    const submittedRecords = creditManagementContext.submittedRecords || [];
    const sellReturns = SellReturnContext.sellReturns || [];
    const purchaseReturns = purchaseReturnContext.purchaseReturns || [];
    
    const userAndBusinessDetail = settingContext.settings;
    const currency = userAndBusinessDetail?.[0]?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.[0]?.business?.businessName ?? 'Business Bachao';

    const [sortConfig, setSortConfig] = useState({ key: 'balance', direction: 'descending' });

    const reportData = useMemo(() => {
        const balancesData = allPeoples.map(person => {
            const totalSalesCredit = allSales.filter(s => s.personId === person.id).reduce((acc, s) => acc + (parseFloat(s.credit) || 0), 0);
            const manualCredit = submittedRecords.filter(r => r.personId === person.id && r.type === 'credit').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
            const totalReceivable = totalSalesCredit + manualCredit;
            
            const manualPayments = submittedRecords.filter(r => r.personId === person.id && r.type === 'payment').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
            const sellReturnAdjustments = sellReturns.filter(r => r.peopleId === person.id || r.people === person.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
            const totalReductions = manualPayments + sellReturnAdjustments;
            
            const netReceivable = totalReceivable - totalReductions;

            const totalPurchaseCredit = allPurchases.filter(p => p.personId === person.id).reduce((acc, p) => acc + (parseFloat(p.credit) || 0), 0);
            const purchaseReturnAdjustments = purchaseReturns.filter(r => r.people === person.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
            const netPayable = totalPurchaseCredit - purchaseReturnAdjustments;

            const finalBalance = netReceivable - netPayable;
            
            return { id: person.id, name: person.name, balance: finalBalance };
        }).filter(p => p.balance !== 0);

        const summary = balancesData.reduce((acc, item) => {
            if (item.balance > 0) {
                acc.totalReceivable += item.balance;
                acc.debtorsCount += 1;
            } else {
                acc.totalPayable += Math.abs(item.balance);
                acc.creditorsCount += 1;
            }
            return acc;
        }, { totalReceivable: 0, totalPayable: 0, debtorsCount: 0, creditorsCount: 0 });

        return { data: balancesData, summary };
    }, [allPeoples, allSales, allPurchases, submittedRecords, sellReturns, purchaseReturns]);

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

    const SortableHeader = ({ tkey, label }) => (<th className="py-2 px-3 cursor-pointer" onClick={() => requestSort(tkey)}>{label} {sortConfig.key === tkey ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}</th>);

    const { summary } = reportData;

    return (
        <div>
            <div className="print-header">
                <h2>{businessName}</h2>
                <h3>{languageData[language].balances_report || 'Balances Report'}</h3>
            </div>
            
            <h3 className="text-xl font-semibold mb-4 no-print">{languageData[language].balances_report || 'Balances Report'}</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 no-print">
                <div className="bg-green-100 p-4 rounded-lg shadow text-center">
                    <h4 className="text-sm font-semibold text-green-800">{languageData[language].total_receivable || 'Total Receivable'}</h4>
                    <p className="text-2xl font-bold text-green-600">{currency} {summary.totalReceivable.toFixed(2)}</p>
                </div>
                 <div className="bg-red-100 p-4 rounded-lg shadow text-center">
                    <h4 className="text-sm font-semibold text-red-800">{languageData[language].total_payable || 'Total Payable'}</h4>
                    <p className="text-2xl font-bold text-red-600">{currency} {summary.totalPayable.toFixed(2)}</p>
                </div>
                 <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
                    <h4 className="text-sm font-semibold text-blue-800">{languageData[language].debtors || 'Debtors'}</h4>
                    <p className="text-2xl font-bold text-blue-600">{summary.debtorsCount}</p>
                </div>
                 <div className="bg-orange-100 p-4 rounded-lg shadow text-center">
                    <h4 className="text-sm font-semibold text-orange-800">{languageData[language].creditors || 'Creditors'}</h4>
                    <p className="text-2xl font-bold text-orange-600">{summary.creditorsCount}</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <SortableHeader tkey="name" label={languageData[language].person_name || 'Person Name'} />
                            <SortableHeader tkey="balance" label={languageData[language].status || 'Status'} />
                            <SortableHeader tkey="balance" label={languageData[language].amount || 'Amount'} />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length > 0 ? sortedData.map(p => (
                            <tr key={p.id} className="border-b">
                                <td>{p.name}</td>
                                <td className="font-semibold">
                                    {p.balance > 0 
                                        ? <span className="text-green-600">{languageData[language].receivable || 'Receivable'}</span> 
                                        : <span className="text-red-600">{languageData[language].payable || 'Payable'}</span>
                                    }
                                </td>
                                <td className={`font-bold ${p.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {currency} {Math.abs(p.balance).toFixed(2)}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="3" className="text-center py-4">{languageData[language].no_outstanding_balances || 'No outstanding balances found.'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
             <div className="print-footer">
                {languageData[language].total_receivable || 'Total Receivable'}: {currency} {summary.totalReceivable.toFixed(2)} | {languageData[language].total_payable || 'Total Payable'}: {currency} {summary.totalPayable.toFixed(2)}
            </div>
        </div>
    );
};

export default BalancesReport;

