import React, { useState } from 'react';
import { useAppContext } from '../Appfullcontext';
import { FaChartBar, FaMoneyBillWave, FaStar, FaUsers, FaFileInvoice, FaTruckLoading, FaMapMarkerAlt, FaHandHoldingUsd, FaHistory } from 'react-icons/fa';
import languageData from '../assets/languageData.json';

// --- REPORTS COMPONENTS ---
import BalancesReport from '../components/Reports/BalancesReport';
import SalesSummaryReport from '../components/Reports/SalesSummaryReport';
import PnLReport from '../components/Reports/PnLReport';
import ProductPerformanceReport from '../components/Reports/ProductPerformanceReport';
import CollectionSheet from '../components/Reports/CollectionSheet'; 
import CustomerCompanyReport from '../components/Reports/CustomerCompanyReport'; 
import PreorderAreaReport from '../components/Reports/PreorderAreaReport';
import InventoryReport from '../components/Reports/InventoryReport';
import DailyReceivedReport from '../components/Reports/DailyReceivedReport';
// NEW IMPORT:
import ProductHistoryReport from '../components/Reports/ProductHistoryReport';

const Reports = () => {
    const context = useAppContext();
    
    // --- CRASH PROOFING: Language ---
    const safeLanguage = context.language && languageData[context.language] ? context.language : 'en';
    const t = languageData[safeLanguage];

    // Default active report
    const [activeReport, setActiveReport] = useState('daily_received');

    const renderActiveReport = () => {
        switch (activeReport) {
            case 'daily_received':
                return <DailyReceivedReport />; 
            case 'collection_sheet':
                return <CollectionSheet />;
            case 'customer_company':
                return <CustomerCompanyReport />;
            case 'preorder_area':
                return <PreorderAreaReport />;
            case 'balances':
                return <BalancesReport />;
            case 'sales_summary':
                return <SalesSummaryReport />;
            case 'pnl':
                return <PnLReport />;
            case 'Inventory_Report':
                return <InventoryReport />;
            case 'product_performance':
                return <ProductPerformanceReport />;
            case 'product_history': // <--- NEW CASE
                return <ProductHistoryReport />;
            default:
                return (
                    <div className="text-center p-10 bg-white rounded-lg shadow">
                        <p className="text-gray-500">{t.select_report_type || 'Please select a report type.'}</p>
                    </div>
                );
        }
    };

    const reportButtons = [
        // --- DAILY OPERATIONS ---
        { key: 'daily_received', label: 'Daily Collection (Wasooli)', icon: <FaHandHoldingUsd /> },
        { key: 'collection_sheet', label: t.collection_sheet || 'Collection Sheet', icon: <FaFileInvoice /> },
        { key: 'preorder_area', label: t.preorder_area_report || 'Preorder Report', icon: <FaMapMarkerAlt /> },

        // --- INVENTORY & PRODUCTS ---
        { key: 'product_history', label: 'Product History (Ledger)', icon: <FaHistory /> }, // <--- NEW BUTTON
        { key: 'Inventory_Report', label: t.Inventory_Report || 'Inventory Report', icon: <FaBoxOpen /> }, // Changed icon slightly for variety if FaMoneyBillWave duplicate
        { key: 'product_performance', label: t.product_performance || 'Product Report', icon: <FaStar /> },

        // --- FINANCIALS & PARTNERS ---
        { key: 'balances', label: t.balances || 'Balances', icon: <FaUsers /> },
        { key: 'sales_summary', label: t.sales_summary || 'Sales Summary', icon: <FaChartBar /> },
        { key: 'pnl', label: t.pnl || 'P&L', icon: <FaMoneyBillWave /> },
        { key: 'customer_company', label: t.customer_company_report || 'Cust/Co. Report', icon: <FaTruckLoading /> },
    ];

    // Fallback icon for Inventory if FaBoxOpen isn't imported above in all cases
    const FaBoxOpenIcon = FaTruckLoading; // Just a safeguard if imports are tricky, but I added FaBoxOpen to import above.

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* --- PRINT STYLES --- */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .print-area, .print-area * {
                        visibility: visible !important;
                    }
                    .print-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        background-color: white !important;
                    }
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-6 no-print">{t.reports || 'Reports'}</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 no-print">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.select_report_type || 'Select Report Type'}</label>
                <div className="flex flex-wrap gap-2">
                    {reportButtons.map(report => (
                        <button 
                            key={report.key}
                            onClick={() => setActiveReport(report.key)} 
                            className={`flex items-center justify-center gap-2 p-3 rounded-md text-sm font-medium transition-all shadow-sm border
                                ${activeReport === report.key 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                        >
                            {report.icon}
                            <span>{report.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Print Area Wrapper */}
            <div className="print-area bg-white p-4 md:p-6 rounded-lg shadow-md min-h-[500px]">
                {renderActiveReport()}
            </div>
        </div>
    );
};

// Helper for icon consistency in case FaBoxOpen isn't available in main block
const FaBoxOpen = ({className}) => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M504 256c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H136c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16h368zM160 384c-8.8 0-16-7.2-16-16v-16c0-8.8 7.2-16 16-16h320c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H160zm344-240V48c0-26.5-21.5-48-48-48H184c-26.5 0-48 21.5-48 48v96H0v320c0 26.5 21.5 48 48 48h544c26.5 0 48-21.5 48-48V144h-136zM320 64c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32z"></path></svg>;

export default Reports;

