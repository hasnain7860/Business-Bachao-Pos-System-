import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext.jsx';
import { FaPrint, FaFilter } from 'react-icons/fa'; 
import languageData from '../../assets/languageData.json';
import { useNavigate } from "react-router-dom";

const InventoryReport = () => {
    const context = useAppContext();
    const navigate = useNavigate();
    const { language } = context;

    // Context Data
    const products = context.productContext.products;
    const companies = context.companyContext.companies;
    
    // Transactions Data
    const allSales = context.SaleContext.Sales || [];
    const allPurchases = context.purchaseContext.purchases || [];
    const sellReturns = context.SellReturnContext.sellReturns || [];
    const purchaseReturns = context.purchaseReturnContext.purchaseReturns || [];
    const allDamages = context.damageContext?.damages || [];
    
    const userAndBusinessDetail = context.settingContext.settings;
    const businessName = userAndBusinessDetail?.[0]?.business?.businessName ?? 'Business Inventory';
    const currency = userAndBusinessDetail?.[0]?.business?.currency ?? 'Rs';

    // Filters State
    const [selectedCompany, setSelectedCompany] = useState("");

    // Helper: Compare Transaction Time vs Opening Time
    const isAfterOpening = (transactionTime, openingDateStr) => {
        if (!openingDateStr || !transactionTime) return false;
        
        const tDate = new Date(transactionTime).getTime();
        const oDate = new Date(openingDateStr).getTime();
        
        return tDate > oDate;
    };

    // --- MAIN CALCULATION LOGIC ---
    const reportData = useMemo(() => {
        let reportRows = [];

        // 1. Filter Products by Company
        const filteredProducts = selectedCompany 
            ? products.filter(p => p.companyId === selectedCompany)
            : products;

        filteredProducts.forEach(product => {
            if (product.batchCode && product.batchCode.length > 0) {
                product.batchCode.forEach(batch => {
                    
                    // BASELINE: Opening Stock
                    const openingStock = Number(batch.openingStock || 0);
                    const openingDateStr = batch.openingStockDate; 
                    const isInitialized = !!openingDateStr;

                    // Initialize Counters
                    let purchaseQty = 0;
                    let saleQty = 0;
                    let saleReturnQty = 0;
                    let purReturnQty = 0;
                    let damageQty = 0; 

                    if (isInitialized) {
                        // A. Purchases (+)
                        allPurchases.forEach(pur => {
                            const compareDate = pur.updatedAt || pur.date; 
                            if (isAfterOpening(compareDate, openingDateStr) && pur.products) {
                                pur.products.forEach(item => {
                                    if (item.id === product.id && item.batchCode === batch.batchCode) {
                                        purchaseQty += Number(item.quantity || 0);
                                    }
                                });
                            }
                        });

                        // B. Sales (-)
                        allSales.forEach(sale => {
                            const compareDate = sale.dateTime || sale.date;
                            if (isAfterOpening(compareDate, openingDateStr) && sale.products) {
                                sale.products.forEach(item => {
                                    if (item.id === product.id && item.batchCode === batch.batchCode) {
                                        saleQty += Number(item.SellQuantity || 0);
                                    }
                                });
                            }
                        });

                        // C. Sales Returns (+)
                        sellReturns.forEach(ret => {
                            const compareDate = ret.updatedAt || ret.returnDate;
                            if (isAfterOpening(compareDate, openingDateStr) && ret.items) {
                                ret.items.forEach(item => {
                                    if (item.id === product.id && item.batchCode === batch.batchCode) {
                                        saleReturnQty += Number(item.quantity || 0);
                                    }
                                });
                            }
                        });

                        // D. Purchase Returns (-)
                        purchaseReturns.forEach(ret => {
                            const compareDate = ret.updatedAt || ret.returnDate;
                            if (isAfterOpening(compareDate, openingDateStr) && ret.items) {
                                ret.items.forEach(item => {
                                    if (item.id === product.id && item.batchCode === batch.batchCode) {
                                        purReturnQty += Number(item.quantity || 0);
                                    }
                                });
                            }
                        });

                        // E. Damages (-) (UPDATED LOGIC)
                        allDamages.forEach(dmg => {
                            const compareDate = dmg.updatedAt || dmg.date;
                            
                            if (isAfterOpening(compareDate, openingDateStr)) {
                                // CRITICAL CHECK: 
                                // If resolution is 'replace', we got stock back, so DO NOT count as inventory deduction.
                                if (dmg.resolution === 'replace') return;

                                // Match Product ID and Batch Code
                                if (dmg.productId === product.id && dmg.batchCode === batch.batchCode) {
                                    damageQty += Number(dmg.quantity || 0);
                                }
                            }
                        });
                    }

                    // FINAL FORMULA
                    // Balance = Opening + Purchase + SaleReturn - Sale - PurReturn - Damage
                    const balance = openingStock + purchaseQty + saleReturnQty - saleQty - purReturnQty - damageQty;
                    
                    // Valuation
                    const price = Number(batch.purchasePrice || 0);
                    const totalValue = balance * price;

                    reportRows.push({
                        productId: product.id,
                        batchCode: batch.batchCode,
                        productName: product.name,
                        opening: openingStock,
                        purchase: purchaseQty,
                        saleReturn: saleReturnQty,
                        sale: saleQty,
                        purReturn: purReturnQty,
                        damage: damageQty,
                        balance: balance,
                        price: price,
                        totalValue: totalValue,
                        isInitialized: isInitialized
                    });
                });
            }
        });

        return reportRows;
    }, [products, allSales, allPurchases, sellReturns, purchaseReturns, allDamages, selectedCompany]);

    const grandTotalValue = reportData.reduce((acc, row) => acc + row.totalValue, 0);
    const handlePrint = () => window.print();

    return (
        <div className="p-4 bg-white min-h-screen text-black">
             {/* Navigation & Filters */}
             <div className="no-print">
                <div className={`mb-4 flex ${language === "ur" ? "justify-end" : "justify-start"}`}>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 bg-gray-500 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-gray-600 transition duration-200"
                    >
                        {language === "ur" ? null : "🔙"}
                        <span>{languageData[language].back}</span>
                        {language === "ur" ? "🔙" : null}
                    </button>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg mb-6 shadow-sm flex flex-wrap gap-4 items-end justify-between">
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-bold mb-2 text-gray-700">Filter by Company:</label>
                        <select 
                            value={selectedCompany} 
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            className="select select-bordered w-full bg-white"
                        >
                            <option value="">All Companies</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <button onClick={handlePrint} className="btn btn-primary flex items-center gap-2">
                            <FaPrint /> Print Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print-block text-center mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">{businessName}</h1>
                <h2 className="text-xl font-semibold text-gray-600">Inventory Report</h2>
                {selectedCompany && <p className="text-md text-gray-500 mt-1">Company: {companies.find(c => c.id === selectedCompany)?.name}</p>}
                <p className="text-sm text-gray-500 mt-1">Generated on: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Report Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm table-fixed">
                    <thead>
                        <tr className="bg-gray-200 text-center text-xs md:text-sm">
                            <th className="border border-gray-300 p-1 w-10">Sr#</th>
                            <th className="border border-gray-300 p-1 w-48 text-left">Product Name</th>
                            <th className="border border-gray-300 p-1 bg-blue-50 w-16">Opening</th>
                            <th className="border border-gray-300 p-1 bg-green-50 w-16">Purchase</th>
                            <th className="border border-gray-300 p-1 bg-green-50 w-16">Sale Ret</th>
                            <th className="border border-gray-300 p-1 bg-red-50 w-16">Sale</th>
                            <th className="border border-gray-300 p-1 bg-red-50 w-16">Pur Ret</th>
                            <th className="border border-gray-300 p-1 bg-red-50 w-16">Damage</th>
                            <th className="border border-gray-300 p-1 font-bold bg-yellow-50 w-20">Balance</th>
                            <th className="border border-gray-300 p-1 w-20">Cost</th>
                            <th className="border border-gray-300 p-1 text-right w-24">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.length > 0 ? (
                            reportData.map((row, index) => (
                                <tr key={index} className="text-center hover:bg-gray-50 text-xs md:text-sm">
                                    <td className="border border-gray-300 p-1">{index + 1}</td>
                                    <td className="border border-gray-300 p-1 text-left font-medium truncate">
                                        {row.productName} 
                                        <div className="text-[10px] text-gray-500">{row.batchCode}</div>
                                        {!row.isInitialized && <span className="text-red-500 text-[10px] block">*Not Initialized*</span>}
                                    </td>
                                    <td className="border border-gray-300 p-1 bg-blue-50">{row.opening}</td>
                                    <td className="border border-gray-300 p-1 bg-green-50">{row.purchase}</td>
                                    <td className="border border-gray-300 p-1 bg-green-50 font-semibold text-green-700">{row.saleReturn}</td>
                                    <td className="border border-gray-300 p-1 bg-red-50">{row.sale}</td>
                                    <td className="border border-gray-300 p-1 bg-red-50">{row.purReturn}</td>
                                    <td className="border border-gray-300 p-1 bg-red-50 text-red-600 font-bold">{row.damage}</td>
                                    <td className="border border-gray-300 p-1 font-bold bg-yellow-50 text-lg">{row.balance}</td>
                                    <td className="border border-gray-300 p-1">{row.price.toFixed(0)}</td>
                                    <td className="border border-gray-300 p-1 text-right font-medium">{row.totalValue.toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="11" className="p-6 text-center text-gray-500">No inventory records found.</td>
                            </tr>
                        )}
                    </tbody>
                    {reportData.length > 0 && (
                        <tfoot>
                            <tr className="font-bold bg-gray-800 text-white">
                                <td colSpan="10" className="border border-gray-600 p-2 text-right">Total Inventory Value:</td>
                                <td className="border border-gray-600 p-2 text-right">{currency} {grandTotalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {!reportData.some(r => r.isInitialized) && reportData.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 no-print rounded shadow">
                    <p className="font-bold text-lg">⚠️ System Alert:</p>
                    <p>Your products have not been initialized for tracking. Please go to the <strong>Products Page</strong> and click <strong>"Initialize Opening Stock"</strong> to set a baseline.</p>
                </div>
            )}

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-block { display: block !important; }
                    body { background: white; color: black; }
                    table { width: 100%; font-size: 10pt; border-collapse: collapse; }
                    th, td { padding: 4px; border: 1px solid #ccc; }
                    thead th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
                    tfoot tr { background-color: #1f2937 !important; color: white !important; -webkit-print-color-adjust: exact; }
                    @page { size: A4 landscape; margin: 10mm; }
                }
            `}</style>
        </div>
    );
};

export default InventoryReport;

