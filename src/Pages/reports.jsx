import React, { useState } from 'react';
import { useAppContext } from '../Appfullcontext';
import { FaChartBar, FaMoneyBillWave, FaStar, FaUsers, FaFileInvoice, FaTruckLoading, FaMapMarkerAlt } from 'react-icons/fa';
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

const Reports = () => {
    const context = useAppContext();
    
    // --- CRASH PROOFING: Language ---
    // If context is not ready or language is missing, fallback to 'en'
    const safeLanguage = context.language && languageData[context.language] ? context.language : 'en';
    const t = languageData[safeLanguage]; // 't' is a common convention for 'translation'

    const [activeReport, setActiveReport] = useState('collection_sheet');

    const renderActiveReport = () => {
        switch (activeReport) {
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
            default:
                return (
                    <div className="text-center p-10 bg-white rounded-lg shadow">
                        <p className="text-gray-500">{t.select_report_type || 'Please select a report type.'}</p>
                    </div>
                );
        }
    };

    const reportButtons = [
        { key: 'collection_sheet', label: t.collection_sheet || 'Collection Sheet', icon: <FaFileInvoice /> },
        { key: 'customer_company', label: t.customer_company_report || 'Cust/Co. Report', icon: <FaTruckLoading /> },
        { key: 'preorder_area', label: t.preorder_area_report || 'Preorder Report', icon: <FaMapMarkerAlt /> },
        { key: 'balances', label: t.balances || 'Balances', icon: <FaUsers /> },
        { key: 'sales_summary', label: t.sales_summary || 'Sales Summary', icon: <FaChartBar /> },
        { key: 'pnl', label: t.pnl || 'P&L', icon: <FaMoneyBillWave /> },
        { key: 'Inventory_Report', label: t.Inventory_Report || 'Inventory Report', icon: <FaMoneyBillWave /> },
        { key: 'product_performance', label: t.product_performance || 'Product Report', icon: <FaStar /> },
    ];

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* --- PRINT STYLES --- */}
            <style>{`
                @media print {
                    /* Hide everything by default */
                    body * {
                        visibility: hidden !important;
                    }

                    /* Only show the print container and its children */
                    .print-area, .print-area * {
                        visibility: visible !important;
                    }

                    /* Position the print area to fill the page */
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
                            className={`flex items-center justify-center gap-2 p-3 rounded-md text-sm font-medium transition-all
                                ${activeReport === report.key 
                                    ? 'bg-blue-600 text-white shadow-lg scale-105' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {report.icon}
                            <span>{report.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Print Area Wrapper */}
            <div className="print-area bg-white p-4 md:p-6 rounded-lg shadow-md">
                {renderActiveReport()}
            </div>
        </div>
    );
};

export default Reports;

