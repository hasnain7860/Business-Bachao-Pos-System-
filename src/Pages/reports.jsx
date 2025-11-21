import React, { useState } from 'react';
import { useAppContext } from '../Appfullcontext';
import { FaPrint, FaChartBar, FaMoneyBillWave, FaStar, FaUsers, FaFileInvoice, FaTruckLoading, FaMapMarkerAlt } from 'react-icons/fa';
import languageData from '../assets/languageData.json';

// --- NAYE REPORTS IMPORT KAREIN ---
import BalancesReport from '../components//Reports/BalancesReport';
import SalesSummaryReport from '../components//Reports/SalesSummaryReport';
import PnLReport from '../components//Reports/PnLReport';
import ProductPerformanceReport from '../components/Reports/ProductPerformanceReport';
import CollectionSheet from '../components//Reports/CollectionSheet'; // <-- NAYA
import CustomerCompanyReport from '../components//Reports/CustomerCompanyReport'; // <-- NAYA
 import PreorderAreaReport from '../components/Reports/PreorderAreaReport';
 import InventoryReport from '../components/Reports/InventoryReport';
 
 
 
 // <-- Ye aap baad mein banayeinge


const Reports = () => {
    const context = useAppContext();
    const { language } = context;

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
                        <p className="text-gray-500">{languageData[language].select_report_type || 'Please select a report type.'}</p>
                    </div>
                );
        }
    };

    const reportButtons = [
        { key: 'collection_sheet', label: languageData[language].collection_sheet || 'Collection Sheet', icon: <FaFileInvoice /> },
        { key: 'customer_company', label: languageData[language].customer_company_report || 'Cust/Co. Report', icon: <FaTruckLoading /> },
        { key: 'preorder_area', label: languageData[language].preorder_area_report || 'Preorder Report', icon: <FaMapMarkerAlt /> },
        { key: 'balances', label: languageData[language].balances || 'Balances', icon: <FaUsers /> },
        { key: 'sales_summary', label: languageData[language].sales_summary || 'Sales Summary', icon: <FaChartBar /> },
        { key: 'pnl', label: languageData[language].pnl || 'P&L', icon: <FaMoneyBillWave /> },
        { key: 'Inventory_Report', label: languageData[language].Inventory_Report || 'Inventory Report', icon: <FaMoneyBillWave /> },
        { key: 'product_performance', label: languageData[language].product_performance || 'Product Report', icon: <FaStar /> },
    ];

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* --- YEH HAI ASLI FIX --- */}
            {/* Yeh style block ab poori app ko print ke waqt hide kar dega, 
                siwaye '.print-area' ke. */}
            <style>{`
                @media print {
                    /* 1. Sab kuch hide karein */
                    body * {
                        visibility: hidden !important;
                    }

                    /* 2. Sirf print-area aur uske children ko show karein */
                    .print-area, .print-area * {
                        visibility: visible !important;
                    }

                    /* 3. Print-area ko poori page par phelayein */
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

                    /* 4. A4 Page setup */
                    @page {
                        size: A4;
                        margin: 15mm;
                    }

                    /* 5. Jo elements no-print mark hain, unko yaqeeni hide karein */
                    .no-print {
                        display: none !important;
                    }

                    /* 6. Print-specific headers/footers ko show karein */
                    .print-header { display: block !important; }
                    .print-footer { display: block !important; }

                    /* 7. Table styles for print */
                    table { width: 100%; border-collapse: collapse; }
                    th, td {
                        border: 1px solid #000;
                        padding: 6px;
                        font-size: 9pt;
                        text-align: left;
                    }
                    th { background-color: #f0f0f0; }
                    tfoot td { font-weight: bold; background-color: #f0f0f0; }
                }
                
                /* Ye headers/footers by default hide honge */
                .print-header, .print-footer {
                    display: none;
                }
            `}</style>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-6 no-print">{languageData[language].reports || 'Reports'}</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 no-print">
                <label className="block text-sm font-medium text-gray-700 mb-2">{languageData[language].select_report_type || 'Select Report Type'}</label>
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

            {/* Ab yeh 'print-area' div print styles ko trigger karega */}
            <div className="print-area bg-white p-4 md:p-6 rounded-lg shadow-md">
                {renderActiveReport()}
            </div>
        </div>
    );
};




export default Reports;

