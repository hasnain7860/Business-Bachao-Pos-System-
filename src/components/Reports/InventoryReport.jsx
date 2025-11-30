import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext.jsx';
import { FaPrint } from 'react-icons/fa'; 
import languageData from '../../assets/languageData.json';
import { useNavigate } from "react-router-dom";

const InventoryReport = () => {
    const context = useAppContext();
    const navigate = useNavigate();
    const { language } = context;

    // --- Data Sources ---
    const products = context.productContext.data || [];
    const companies = context.companyContext.data || [];
    
    // Transactions Data
    const allSales = context.SaleContext.data || [];
    const allPurchases = context.purchaseContext.data || [];
    const sellReturns = context.SellReturnContext.data || [];
    const purchaseReturns = context.purchaseReturnContext.data || [];
    const allDamages = context.damageContext?.data || [];
    
    const settingsData = context.settingContext.data || [];
    const userAndBusinessDetail = settingsData[0] || {};
    
    const businessName = userAndBusinessDetail?.business?.businessName ?? 'Business Inventory';
    const currency = userAndBusinessDetail?.business?.currency ?? 'Rs';

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
            // Agar batchCode array ha to us par loop, warna empty array handle karega
            const batches = Array.isArray(product.batchCode) ? product.batchCode : [];
            
            batches.forEach(batch => {
                
                // --- 1. HISTORICAL CALCULATION (Jo Report Kehti ha) ---
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

                    // E. Damages (-)
                    allDamages.forEach(dmg => {
                        const compareDate = dmg.updatedAt || dmg.date;
                        if (isAfterOpening(compareDate, openingDateStr)) {
                            if (dmg.resolution === 'replace') return;
                            if (dmg.productId === product.id && dmg.batchCode === batch.batchCode) {
                                damageQty += Number(dmg.quantity || 0);
                            }
                        }
                    });
                }

                // Theoretical Balance (Based on History)
                // Report Logic: 500 (Open) - 0 (Sales deleted) = 500
                const calculatedBalance = openingStock + purchaseQty + saleReturnQty - saleQty - purReturnQty - damageQty;
                
                // --- 2. ACTUAL DB STOCK (Jo Product Table me ha) ---
                // Product table me jo 'quantity' ha wo Sach ha (450)
                // Note: Batch quantity usually product.quantity nahi hoti agar multiple batches hain. 
                // Assuming batch object has a 'quantity' field updated by your backend.
                // If not, use product.quantity ONLY if 1 batch exists.
                const actualDbStock = Number(batch.quantity || 0); 

                // --- 3. THE GHOST ADJUSTMENT ---
                // Agar Report 500 bol rahi ha aur DB 450 bol raha ha.
                // Diff = 450 - 500 = -50 (Ye wo sales hain jo delete huin)
                const systemAdjustment = actualDbStock - calculatedBalance;

                // Valuation
                const price = Number(batch.purchasePrice || 0);
                // Value hamesha Actual DB Stock par nikalo, kyunki wo physical inventory ha
                const totalValue = actualDbStock * price;

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
                    adjustment: systemAdjustment, // NEW FIELD
                    balance: actualDbStock,       // Showing ACTUAL DB Stock
                    price: price,
                    totalValue: totalValue,
                    isInitialized: isInitialized
                });
            });
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
                        <span>{languageData[language]?.back || 'Back'}</span>
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
                <h2 className="text-xl font-semibold text-gray-600">Inventory Report (Actual)</h2>
                {selectedCompany && <p className="text-md text-gray-500 mt-1">Company: {companies.find(c => c.id === selectedCompany)?.name}</p>}
                <p className="text-sm text-gray-500 mt-1">Generated on: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Report Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm table-fixed">
                    <thead>
                        <tr className="bg-gray-200 text-center text-xs md:text-sm">
                            <th className="border border-gray-300 p-1 w-8">Sr#</th>
                            <th className="border border-gray-300 p-1 w-40 text-left">Product Name</th>
                            <th className="border border-gray-300 p-1 bg-blue-50 w-12">Open</th>
                            <th className="border border-gray-300 p-1 bg-green-50 w-12">Pur</th>
                            <th className="border border-gray-300 p-1 bg-green-50 w-12">S.Ret</th>
                            <th className="border border-gray-300 p-1 bg-red-50 w-12">Sale</th>
                            <th className="border border-gray-300 p-1 bg-red-50 w-12">P.Ret</th>
                            <th className="border border-gray-300 p-1 bg-red-50 w-12">Dmg</th>
                            {/* NEW COLUMN FOR GHOST ENTRIES */}
                            <th className="border border-gray-300 p-1 bg-gray-300 w-14 font-bold text-gray-700">Adj/Del</th>
                            <th className="border border-gray-300 p-1 font-bold bg-yellow-100 w-16">Stock</th>
                            <th className="border border-gray-300 p-1 w-16">Cost</th>
                            <th className="border border-gray-300 p-1 text-right w-20">Value</th>
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
                                    <td className="border border-gray-300 p-1 bg-green-50">{row.saleReturn}</td>
                                    <td className="border border-gray-300 p-1 bg-red-50">{row.sale}</td>
                                    <td className="border border-gray-300 p-1 bg-red-50">{row.purReturn}</td>
                                    <td className="border border-gray-300 p-1 bg-red-50">{row.damage}</td>
                                    
                                    {/* The Adjustment Column */}
                                    <td className={`border border-gray-300 p-1 font-bold ${row.adjustment !== 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'}`}>
                                        {row.adjustment !== 0 ? row.adjustment : '-'}
                                    </td>

                                    <td className="border border-gray-300 p-1 font-bold bg-yellow-50 text-lg border-l-2 border-yellow-300">
                                        {row.balance}
                                    </td>
                                    <td className="border border-gray-300 p-1">{row.price.toFixed(0)}</td>
                                    <td className="border border-gray-300 p-1 text-right font-medium">{row.totalValue.toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="12" className="p-6 text-center text-gray-500">No inventory records found.</td>
                            </tr>
                        )}
                    </tbody>
                    {reportData.length > 0 && (
                        <tfoot>
                            <tr className="font-bold bg-gray-800 text-white">
                                <td colSpan="11" className="border border-gray-600 p-2 text-right">Total Inventory Value:</td>
                                <td className="border border-gray-600 p-2 text-right">{currency} {grandTotalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-block { display: block !important; }
                    body { background: white; color: black; }
                    table { width: 100%; font-size: 9pt; border-collapse: collapse; }
                    th, td { padding: 3px; border: 1px solid #ccc; }
                    thead th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
                    td.bg-yellow-50 { background-color: #fefce8 !important; -webkit-print-color-adjust: exact; }
                    td.bg-orange-100 { background-color: #ffedd5 !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};

export default InventoryReport;

