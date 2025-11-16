import React, { useState } from 'react';
import { useAppContext } from '../Appfullcontext';
import { FaPrint, FaChartBar, FaMoneyBillWave, FaStar, FaUsers, FaFileInvoice, FaTruckLoading, FaMapMarkerAlt } from 'react-icons/fa';
import languageData from '../assets/languageData.json';

// --- NAYE REPORTS IMPORT KAREIN ---
import BalancesReport from '../components//Reports/BalancesReport';
import SalesSummaryReport from '../components//Reports/SalesSummaryReport';
import PnLReport from '../components//Reports/PnLReport';
import ProductPerformanceReport from '../components//Reports/ProductPerformanceReport';
import CollectionSheet from '../components//Reports/CollectionSheet'; // <-- NAYA
import CustomerCompanyReport from '../components//Reports/CustomerCompanyReport'; // <-- NAYA
// import PreorderAreaReport from './Reports/PreorderAreaReport'; // <-- Ye aap baad mein banayeinge

const Reports = () => {
    const context = useAppContext();
    const { language } = context;

    // Default active report 'collection_sheet' hai
    const [activeReport, setActiveReport] = useState('collection_sheet');

    // Report component ko render karne ka function
    const renderActiveReport = () => {
        switch (activeReport) {
            case 'collection_sheet':
                return <CollectionSheet />;
            case 'customer_company':
                return <CustomerCompanyReport />;
            case 'balances':
                return <BalancesReport />;
            case 'sales_summary':
                return <SalesSummaryReport />;
            case 'pnl':
                return <PnLReport />;
            case 'product_performance':
                return <ProductPerformanceReport />;
            // case 'preorder_area':
            //     return <PreorderAreaReport />;
            default:
                return <div className="text-center p-10"><p>Please select a report.</p></div>;
        }
    };

    // Report buttons ka data
    const reportButtons = [
        { key: 'collection_sheet', label: languageData[language].collection_sheet || 'Collection Sheet', icon: <FaFileInvoice /> },
        { key: 'customer_company', label: languageData[language].customer_company_report || 'Cust/Co. Report', icon: <FaTruckLoading /> },
        { key: 'balances', label: languageData[language].balances || 'Balances', icon: <FaUsers /> },
        { key: 'sales_summary', label: languageData[language].sales_summary || 'Sales Summary', icon: <FaChartBar /> },
        { key: 'pnl', label: languageData[language].pnl || 'P&L', icon: <FaMoneyBillWave /> },
        { key: 'product_performance', label: languageData[language].product_performance || 'Product Report', icon: <FaStar /> },
        // { key: 'preorder_area', label: 'Preorder Report', icon: <FaMapMarkerAlt /> },
    ];

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 no-print">{languageData[language].reports || 'Reports'}</h1>
            
            {/* --- NAYA NAVIGATION --- */}
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

            {/* --- Active Report Yahan Render Hoga --- */}
            <div className="print-area">
                {renderActiveReport()}
            </div>
        </div>
    );
};

export default Reports;

