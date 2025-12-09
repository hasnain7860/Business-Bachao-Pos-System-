import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext';
import { FaSearch, FaHistory, FaArrowUp, FaArrowDown, FaBoxOpen, FaExclamationTriangle, FaEdit, FaCheck } from 'react-icons/fa';

const ProductHistoryReport = () => {
    // 1. Context se saara data uthaya (Purchase, Sale, Damage, Returns)
    const { 
        productContext, 
        SaleContext, 
        purchaseContext, 
        supplierCustomerContext,
        damageContext,          // Nuksan/Damage
        SellReturnContext,      // Customer ki wapsi
        purchaseReturnContext   // Supplier ko wapsi
    } = useAppContext();

    // 2. Data ko safe tarike se access kiya
    const products = productContext?.data || [];
    const sales = SaleContext?.data || [];
    const purchases = purchaseContext?.data || [];
    const parties = supplierCustomerContext?.data || [];
    const damages = damageContext?.data || [];
    const sellReturns = SellReturnContext?.data || [];
    const purchaseReturns = purchaseReturnContext?.data || [];

    const [selectedProductId, setSelectedProductId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Adjust Stock State
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [newStockValue, setNewStockValue] = useState('');

    // --- Helper: Party Name dhoondne ke liye ---
    const getPartyName = (id) => {
        const party = parties.find(x => x.id === id);
        return party ? party.name : 'Unknown Party';
    };

    // --- MAIN LOGIC: History Ledger Banana ---
    const productHistory = useMemo(() => {
        if (!selectedProductId) return [];

        const product = products.find(p => p.id === selectedProductId);
        if (!product) return [];

        let history = [];

        // A. Opening Stock (Shuruwaati Maal)
        if (product.openingStock && parseFloat(product.openingStock) > 0) {
            history.push({
                date: product.openingStockDate || 'Initial',
                type: 'Opening Stock',
                refNo: 'OP-STOCK',
                partyName: '-',
                qtyIn: parseFloat(product.openingStock),
                qtyOut: 0,
                price: parseFloat(product.purchasePrice || 0),
                timestamp: product.openingStockDate ? new Date(product.openingStockDate).getTime() : 0
            });
        }

        // B. Purchases (Kharidari - Maal Aaya) -> IN
        purchases.forEach(purchase => {
            if (!purchase.products) return;
            const item = purchase.products.find(p => p.id === selectedProductId);
            
            if (item) {
                const qty = parseFloat(item.enteredQty || item.quantity || 0);
                if (qty > 0) {
                    history.push({
                        date: purchase.date,
                        type: 'Purchase',
                        refNo: purchase.purchaseRefNo || 'PUR-NA',
                        partyName: getPartyName(purchase.personId),
                        qtyIn: qty,
                        qtyOut: 0,
                        price: parseFloat(item.purchasePrice || 0),
                        timestamp: new Date(purchase.date).getTime()
                    });
                }
            }
        });

        // C. Sales (Farokht - Maal Gaya) -> OUT
        sales.forEach(sale => {
            if (!sale.products) return;
            const item = sale.products.find(p => p.id === selectedProductId);
            
            if (item) {
                const qty = parseFloat(item.SellQuantity || item.enteredQty || 1);
                if (qty > 0) {
                    history.push({
                        date: sale.dateTime || sale.date,
                        type: 'Sale',
                        refNo: sale.salesRefNo || 'SALE-NA',
                        partyName: getPartyName(sale.personId),
                        qtyIn: 0,
                        qtyOut: qty, // Sale matlab maal gaya
                        price: parseFloat(item.newSellPrice || item.sellPrice || 0),
                        timestamp: new Date(sale.dateTime || sale.date).getTime()
                    });
                }
            }
        });

        // D. Damages (Nuksan) -> OUT
        damages.forEach(dmg => {
            if (dmg.productId === selectedProductId || dmg.barcode === product.barcode) {
                const qty = parseFloat(dmg.damageQuantity || dmg.quantity || 0);
                if (qty > 0) {
                    history.push({
                        date: dmg.date || dmg.updatedAt,
                        type: 'Damage',
                        refNo: 'DMG',
                        partyName: '-',
                        qtyIn: 0,
                        qtyOut: qty, // Damage matlab maal kam hua
                        price: 0,
                        timestamp: new Date(dmg.date || dmg.updatedAt).getTime()
                    });
                }
            }
        });

        // E. Sale Returns (Customer Wapsi) -> IN
        sellReturns.forEach(ret => {
            const item = ret.products?.find(p => p.id === selectedProductId);
            if (item) {
                const qty = parseFloat(item.returnQty || item.quantity || 0);
                if (qty > 0) {
                    history.push({
                        date: ret.date,
                        type: 'Sale Return',
                        refNo: ret.returnRefNo || 'RET-IN',
                        partyName: getPartyName(ret.customerId),
                        qtyIn: qty, // Wapsi aayi matlab maal barha
                        qtyOut: 0,
                        price: parseFloat(item.price || 0),
                        timestamp: new Date(ret.date).getTime()
                    });
                }
            }
        });

        // F. Purchase Returns (Supplier Wapsi) -> OUT
        purchaseReturns.forEach(ret => {
            const item = ret.products?.find(p => p.id === selectedProductId);
            if (item) {
                const qty = parseFloat(item.returnQty || item.quantity || 0);
                if (qty > 0) {
                    history.push({
                        date: ret.date,
                        type: 'Purch Return',
                        refNo: ret.returnRefNo || 'RET-OUT',
                        partyName: getPartyName(ret.supplierId),
                        qtyIn: 0,
                        qtyOut: qty, // Supplier ko wapis kiya matlab maal kam hua
                        price: parseFloat(item.price || 0),
                        timestamp: new Date(ret.date).getTime()
                    });
                }
            }
        });

        // G. Sort by Date (Purana pehle)
        history.sort((a, b) => a.timestamp - b.timestamp);

        // H. Calculate Running Balance (Yehi asli Quantity hai)
        let currentBalance = 0;
        return history.map(entry => {
            currentBalance = currentBalance + entry.qtyIn - entry.qtyOut;
            return { ...entry, balance: currentBalance };
        });

    }, [selectedProductId, products, sales, purchases, damages, sellReturns, purchaseReturns, parties]);

    // --- Search Logic ---
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedProductDetails = products.find(p => p.id === selectedProductId);
    const lastCalculatedBalance = productHistory.length > 0 ? productHistory[productHistory.length - 1].balance : 0;

    // --- Handle Manual Adjustment ---
    const handleUpdateStock = async () => {
        if (!newStockValue || isNaN(newStockValue)) return;
        
        const confirmed = window.confirm(`Are you sure you want to manually set stock to ${newStockValue}?`);
        if (confirmed) {
            try {
                // Product update logic
                const updatedProduct = { ...selectedProductDetails, quantity: parseFloat(newStockValue) };
                await productContext.edit(selectedProductId, updatedProduct);
                alert('Stock Updated Successfully!');
                setIsAdjusting(false);
                setNewStockValue('');
            } catch (error) {
                console.error("Error updating stock:", error);
                alert('Failed to update stock');
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
            {/* --- Header & Selection --- */}
            <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 mb-4">
                    <FaHistory className="text-blue-600" />
                    Product Ledger (History)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search Input */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                            Search Product
                        </label>
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Product ka naam likhein..."
                                className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                             {/* Clear Button */}
                            {selectedProductId && (
                                <button 
                                    onClick={() => {
                                        setSelectedProductId('');
                                        setSearchTerm('');
                                        setIsAdjusting(false);
                                    }}
                                    className="absolute right-3 top-2 text-xs text-red-500 hover:text-red-700 underline font-bold"
                                >
                                    CLEAR
                                </button>
                            )}
                        </div>
                        
                        {/* Search Results Dropdown */}
                        {searchTerm && !selectedProductId && (
                            <div className="absolute z-50 w-full bg-white border rounded-md shadow-xl max-h-60 overflow-auto mt-1">
                                {filteredProducts.map(p => (
                                    <div 
                                        key={p.id}
                                        onClick={() => {
                                            setSelectedProductId(p.id);
                                            setSearchTerm(p.name);
                                        }}
                                        className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0 flex justify-between"
                                    >
                                        <span className="font-bold">{p.name}</span>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Stock: {p.quantity}</span>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="p-3 text-gray-500 text-sm">No products found</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Report Content --- */}
            <div className="p-4 flex-1 overflow-auto relative">
                {!selectedProductId ? (
                    <div className="text-center text-gray-400 mt-10">
                        <FaBoxOpen className="text-6xl mx-auto mb-2 opacity-20" />
                        <p>Product select karein history dekhne ke liye.</p>
                    </div>
                ) : (
                    <>
                        {/* Info Header */}
                        <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded flex justify-between items-center shadow-sm">
                            <div>
                                <h3 className="text-lg font-black text-blue-900">{selectedProductDetails?.name}</h3>
                                <div className="text-sm text-blue-700 mt-1">
                                    System Current Stock: <span className="text-xl font-bold ml-1">{selectedProductDetails?.quantity}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm">
                                    Total Transactions: {productHistory.length}
                                </span>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto border rounded-lg shadow-sm">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="bg-gray-800 text-white uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Ref No</th>
                                        <th className="px-4 py-3">Party</th>
                                        <th className="px-4 py-3 text-right text-green-300">In (+)</th>
                                        <th className="px-4 py-3 text-right text-red-300">Out (-)</th>
                                        <th className="px-4 py-3 text-right bg-blue-900 text-white border-l border-blue-700">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {productHistory.map((row, index) => (
                                        <tr key={index} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                                                {new Date(row.date).toLocaleDateString()} 
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold
                                                    ${row.type === 'Sale' ? 'bg-red-100 text-red-800' : 
                                                      row.type === 'Purchase' ? 'bg-green-100 text-green-800' : 
                                                      row.type === 'Damage' ? 'bg-orange-100 text-orange-800' :
                                                      row.type === 'Sale Return' ? 'bg-indigo-100 text-indigo-800' :
                                                      'bg-gray-100 text-gray-800'}`}>
                                                    
                                                    {row.type === 'Sale' && <FaArrowDown className="mr-1"/>}
                                                    {row.type === 'Purchase' && <FaArrowUp className="mr-1"/>}
                                                    {row.type === 'Damage' && <FaExclamationTriangle className="mr-1"/>}
                                                    {row.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 font-mono text-xs text-gray-500">{row.refNo}</td>
                                            <td className="px-4 py-2 truncate max-w-[150px] font-medium" title={row.partyName}>
                                                {row.partyName}
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold text-green-600">
                                                {row.qtyIn > 0 ? row.qtyIn : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold text-red-600">
                                                {row.qtyOut > 0 ? row.qtyOut : '-'}
                                            </td>
                                            {/* MAYAR (Standard) Column */}
                                            <td className="px-4 py-2 text-right font-black text-gray-900 bg-blue-50 border-l border-blue-100 text-base">
                                                {row.balance}
                                            </td>
                                        </tr>
                                    ))}
                                    {productHistory.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-10 text-center text-gray-400">
                                                No history found for this product.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* --- Footer: ADJUST OPTION (Last per) --- */}
            {selectedProductId && (
                <div className="p-4 bg-gray-100 border-t rounded-b-lg flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-xs text-gray-500 italic">
                        * Balance calculations are based on saved transactions.
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {!isAdjusting ? (
                            <button 
                                onClick={() => {
                                    setNewStockValue(selectedProductDetails?.quantity);
                                    setIsAdjusting(true);
                                }}
                                className="flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-900 transition-all w-full md:w-auto"
                            >
                                <FaEdit /> Adjust Stock Manually
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 bg-white p-2 rounded shadow-md border animate-fade-in w-full md:w-auto">
                                <span className="text-sm font-bold text-gray-700 whitespace-nowrap">New Qty:</span>
                                <input 
                                    type="number" 
                                    value={newStockValue}
                                    onChange={(e) => setNewStockValue(e.target.value)}
                                    className="w-24 p-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button 
                                    onClick={handleUpdateStock}
                                    className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                                    title="Save"
                                >
                                    <FaCheck />
                                </button>
                                <button 
                                    onClick={() => setIsAdjusting(false)}
                                    className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                                    title="Cancel"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductHistoryReport;


