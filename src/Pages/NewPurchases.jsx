import React, { useState, useEffect } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { useAppContext } from '../Appfullcontext';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";
import { FaTrash } from 'react-icons/fa';

// Reused Component
import ProductSearch from "../components/element/ProductSearch.jsx";

const NewPurchases = () => {
    const context = useAppContext();
    const navigate = useNavigate();

    // --- CRITICAL FIX: Universal Store Mapping ---
    // 1. Map .data to your variables
    const peoples = context.peopleContext.data || [];
    const products = context.productContext.data || [];
    const units = context.unitContext.data || [];
    
    // 2. Map actions
    const updateProduct = context.productContext.edit;
    const addPurchase = context.purchaseContext.add;

    // States
    const [selectedPeople, setselectedPeople] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [totalPayment, setTotalPayment] = useState(0);
    const [credit, setCredit] = useState(0);
    
    const [batchCodes, setBatchCodes] = useState({});

    const generatePurchaseRefNo = () => {
        return `PURCHASE-${Math.floor(100000 + Math.random() * 900000)}`;
    };

    // --- 1. ADD PRODUCT LOGIC ---
    const handleAddProductToTable = (product, selectedBatchFromSearch = null) => {
        const existingProduct = selectedProducts.find((p) => p.id === product.id);
        if (existingProduct) {
            alert('Product is already added to the table!');
            return;
        } 

        const batches = product.batchCode || [];
        
        // Logic: If clicked specific batch in search, use that. Else use first batch. Else default.
        const batchInfo = selectedBatchFromSearch || (batches.length ? batches[0] : {
            batchCode: `BATCH-${String(1).padStart(3, '0')}`,
            purchasePrice: 0,
            sellPrice: 0,
            wholeSalePrice: 0, 
            retailPrice: 0,
            expirationDate: '',
            quantity: 0,
        });

        const hasSecondary = product.secondaryUnitId && product.conversionRate > 1;
        const baseUnitName = units.find(u => u.id === product.unitId)?.name || "Pcs";
        const secUnitName = hasSecondary ? (units.find(u => u.id === product.secondaryUnitId)?.name || "Ctn") : "";

        const newProduct = {
            id: product.id,
            name: product.name,
            companyId: product.companyId || '',
            purchaseRefNo: generatePurchaseRefNo(),
            unitId: product.unitId || '',
            
            // Unit Logic
            hasSecondary: hasSecondary,
            unitMode: 'base',
            baseUnitName: baseUnitName,
            secUnitName: secUnitName,
            conversionRate: hasSecondary ? Number(product.conversionRate) : 1,
            
            enteredQty: 0, 
            enteredPurchasePrice: batchInfo.purchasePrice || 0,

            sellPrice: batchInfo.sellPrice || 0,
            wholeSalePrice: batchInfo.wholeSalePrice || 0, 
            retailPrice: batchInfo.retailPrice || 0,
            purchasePrice: batchInfo.purchasePrice || 0,
            expirationDate: batchInfo.expirationDate || '',
            quantity: 0, 
            
            total: 0,
            batchCode: batchInfo.batchCode,
            isNewBatch: false 
        };

        setSelectedProducts([...selectedProducts, newProduct]);
        setBatchCodes({ ...batchCodes, [product.id]: batches });
        setProductSearch(""); 
    };

    // --- 2. HANDLING UPDATES IN TABLE ---

    const handleUnitModeChange = (index, mode) => {
        const newProducts = [...selectedProducts];
        const p = newProducts[index];
        
        p.unitMode = mode;
        
        if (mode === 'secondary') {
             p.enteredPurchasePrice = p.purchasePrice * p.conversionRate;
        } else {
             p.enteredPurchasePrice = p.purchasePrice;
        }
        
        recalculateRow(p);
        setSelectedProducts(newProducts);
    };

    const updateBatchCode = (index, newBatchCode) => {
        const newProducts = [...selectedProducts];
        const p = newProducts[index];
        
        if (newBatchCode === 'NEW_BATCH') {
            const batches = batchCodes[p.id] || [];
            const nextNum = batches.length + 1;
            p.batchCode = `BATCH-${String(nextNum).padStart(3, '0')}`;
            p.isNewBatch = true;
            p.enteredQty = 0;
            p.quantity = 0;
            p.total = 0;
        } else {
            const batches = batchCodes[p.id] || [];
            const selectedBatch = batches.find((b) => b.batchCode === newBatchCode) || {};
            
            p.batchCode = newBatchCode;
            p.isNewBatch = false;
            p.purchasePrice = selectedBatch.purchasePrice || 0;
            p.enteredPurchasePrice = p.unitMode === 'secondary' ? (selectedBatch.purchasePrice * p.conversionRate) : selectedBatch.purchasePrice;
            
            p.sellPrice = selectedBatch.sellPrice || 0;
            p.wholeSalePrice = selectedBatch.wholeSalePrice || 0;
            p.expirationDate = selectedBatch.expirationDate || '';
        }
        
        recalculateRow(p);
        setSelectedProducts(newProducts);
    };

    const updateField = (index, field, value) => {
        const newProducts = [...selectedProducts];
        const p = newProducts[index];
        
        if (field === 'enteredQty') {
            p.enteredQty = parseFloat(value) || 0;
        } else if (field === 'enteredPurchasePrice') {
            p.enteredPurchasePrice = parseFloat(value) || 0;
        } else {
            p[field] = value;
        }

        recalculateRow(p);
        setSelectedProducts(newProducts);
    };

    const recalculateRow = (p) => {
        p.total = p.enteredQty * p.enteredPurchasePrice;

        if (p.unitMode === 'secondary') {
            p.quantity = p.enteredQty * p.conversionRate; 
            p.purchasePrice = p.enteredPurchasePrice / p.conversionRate; 
        } else {
            p.quantity = p.enteredQty;
            p.purchasePrice = p.enteredPurchasePrice;
        }
    };

    const calculateTotalBill = () => {
        return selectedProducts.reduce((total, product) => total + Number(product.total), 0);
    };

    useEffect(() => {
        const total = calculateTotalBill();
        const pay = totalPayment === '' ? 0 : parseFloat(totalPayment);
        setCredit(total - pay);
    }, [selectedProducts, totalPayment]);

    const handleTotalPaymentChange = (e) => {
        let value = e.target.value;
        const totalBill = calculateTotalBill();
        const newPayment = value === '' ? '' : parseFloat(value);
        
        if (newPayment > totalBill) {
            alert("Paid amount cannot exceed total bill amount!");
            return;
        }
        setTotalPayment(newPayment);
    };

    const handleAddPurchase = async () => {
        if (!selectedPeople) { alert("Please select a supplier."); return; }
        if (!currentDate) { alert("Please select a purchase date."); return; }
        if (selectedProducts.length === 0) { alert("Please add at least one product."); return; }
        
        const invalidProduct = selectedProducts.find((p) => Number(p.quantity) <= 0);
        if (invalidProduct) {
            alert(`Product "${invalidProduct.name}" quantity must be greater than 0.`);
            return;
        }

        const autoInitDate = new Date(0).toISOString(); 

        // Update Stock Logic
        for (const product of selectedProducts) {
            const existingProduct = products.find((p) => p.id === product.id);
            if (existingProduct) {
                let batches = existingProduct.batchCode ? [...existingProduct.batchCode] : [];
                
                const existingBatchIndex = batches.findIndex(b => b.batchCode === product.batchCode);

                if (existingBatchIndex !== -1) {
                    const b = batches[existingBatchIndex];
                    if (b.openingStock === undefined) {
                        b.openingStock = Number(b.quantity || 0);
                        b.openingStockDate = autoInitDate;
                        b.damageQuantity = 0;
                    }
                    b.purchasePrice = product.purchasePrice;
                    b.sellPrice = product.sellPrice;
                    b.wholeSalePrice = product.wholeSalePrice;
                    b.retailPrice = product.retailPrice;
                    b.expirationDate = product.expirationDate;
                    b.quantity = Number(b.quantity) + Number(product.quantity);
                } else {
                    const newBatch = {
                        batchCode: product.batchCode,
                        expirationDate: product.expirationDate,
                        purchasePrice: product.purchasePrice,
                        sellPrice: product.sellPrice,
                        wholeSalePrice: product.wholeSalePrice,
                        retailPrice: product.retailPrice,
                        quantity: Number(product.quantity),
                        openingStock: 0,
                        openingStockDate: autoInitDate,
                        damageQuantity: 0
                    };
                    batches.push(newBatch);
                }
                await updateProduct(product.id, { ...existingProduct, batchCode: batches });
            }
        }

        const newPurchase = {
            id: uuidv4(),
            purchaseRefNo: generatePurchaseRefNo(),
            personId: selectedPeople,
            date: currentDate,
            paymentMode,
            products: selectedProducts.map((p) => ({
                id: p.id,
                name: p.name,
                quantity: p.quantity,
                enteredQty: p.enteredQty,
                unitMode: p.unitMode,
                conversionRate: p.conversionRate,
                purchasePrice: p.purchasePrice,
                sellPrice: p.sellPrice,
                wholeSalePrice: p.wholeSalePrice, 
                retailPrice: p.retailPrice,
                batchCode: p.batchCode,
                total: p.total
            })),
            totalPayment: totalPayment === '' ? 0 : totalPayment,
            credit,
            totalBill: calculateTotalBill(),
        };

        await addPurchase(newPurchase);
        setSelectedProducts([]);
        setTotalPayment(0);
        alert('Purchase added successfully!');
        navigate(-1);
    };

    return (
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">New Purchase</h2>
            
            <div className="flex flex-col lg:flex-row gap-4">
                {/* LEFT SIDE */}
                <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                    
                    {/* Supplier & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                            <label className="text-xs sm:text-sm font-semibold text-gray-600">Supplier *:</label>
                            <div className="flex gap-2">
                                <select className="select select-bordered w-full text-xs sm:text-sm bg-white" value={selectedPeople} onChange={(e) => setselectedPeople(e.target.value)}>
                                    <option value="" disabled>Select a Supplier</option>
                                    {peoples.map((supplier) => (<option key={supplier.id} value={supplier.id}>{supplier.name}</option>))}
                                </select>
                                <button className="btn btn-primary btn-sm hidden sm:flex" onClick={() => navigate("/people")}><AiOutlinePlus /> New</button>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow">
                            <label className="text-sm font-semibold text-gray-600">Purchase Date:</label>
                            <input type="date" value={currentDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setCurrentDate(e.target.value)} className="input input-bordered w-full bg-white"/>
                        </div>
                    </div>

                    {/* Product Search */}
                    <ProductSearch 
                         searchProduct={productSearch}
                         setSearchProduct={setProductSearch}
                         products={products}
                         isPurchase={true} 
                         handleOpenAddModal={(product, batch) => handleAddProductToTable(product, batch)}
                    />

                    {/* CUSTOM PURCHASE TABLE */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2 sm:p-4 shadow-lg">
                        <div className="overflow-x-auto -mx-2 sm:mx-0">
                            <div className="min-w-full inline-block align-middle">
                                <table className="table w-full table-auto min-w-[1000px]">
                                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                        <tr>
                                            <th className="px-2 py-2 text-left">Product</th>
                                            <th className="px-2 py-2">Batch</th>
                                            <th className="px-2 py-2">Unit</th>
                                            <th className="px-2 py-2">Qty</th>
                                            <th className="px-2 py-2">Cost (Unit)</th>
                                            <th className="px-2 py-2">Total</th>
                                            <th className="px-2 py-2">Sale (Pc)</th>
                                            <th className="px-2 py-2">Wholesale (Pc)</th> 
                                            <th className="px-2 py-2">Expiry</th>
                                            <th className="px-2 py-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {selectedProducts.length > 0 ? (selectedProducts.map((product, index) => (
                                        <tr key={product.id + index} className="hover:bg-blue-50 transition-colors align-top border-b">
                                            {/* Product Name */}
                                            <td className="px-2 py-3">
                                                <div className="font-bold text-xs md:text-sm">{product.name}</div>
                                                <div className="text-[10px] text-gray-500">{product.hasSecondary ? 'Multi-Unit' : 'Single Unit'}</div>
                                            </td>

                                            {/* Batch Selection */}
                                            <td className="px-2 py-3">
                                                <select 
                                                    value={product.isNewBatch ? 'NEW_BATCH' : product.batchCode} 
                                                    onChange={(e) => updateBatchCode(index, e.target.value)} 
                                                    className="select select-bordered select-xs w-full"
                                                >
                                                    {(batchCodes[product.id] || []).map((batch) => (
                                                        <option key={batch.batchCode} value={batch.batchCode}>{batch.batchCode}</option>
                                                    ))}
                                                    <option value="NEW_BATCH">+ New Batch</option>
                                                </select>
                                            </td>

                                            {/* Unit Mode Selection */}
                                            <td className="px-2 py-3">
                                                {product.hasSecondary ? (
                                                    <select 
                                                        value={product.unitMode} 
                                                        onChange={(e) => handleUnitModeChange(index, e.target.value)}
                                                        className="select select-bordered select-xs w-full font-bold text-blue-700"
                                                    >
                                                        <option value="base">{product.baseUnitName}</option>
                                                        <option value="secondary">{product.secUnitName}</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-xs font-bold pl-2">{product.baseUnitName}</span>
                                                )}
                                            </td>

                                            {/* Quantity Input */}
                                            <td className="px-2 py-3">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    className="input input-bordered input-sm w-full font-bold" 
                                                    value={product.enteredQty} 
                                                    onChange={(e) => updateField(index, 'enteredQty', e.target.value)}
                                                />
                                                <div className="text-[10px] text-gray-400 text-center mt-1">
                                                    = {product.unitMode === 'secondary' ? (product.enteredQty * product.conversionRate) : product.enteredQty} Pcs
                                                </div>
                                            </td>

                                            {/* Purchase Price Input */}
                                            <td className="px-2 py-3">
                                                <input 
                                                    type="number" 
                                                    className="input input-bordered input-sm w-full" 
                                                    value={product.enteredPurchasePrice} 
                                                    onChange={(e) => updateField(index, 'enteredPurchasePrice', e.target.value)}
                                                />
                                                {product.unitMode === 'secondary' && (
                                                    <div className="text-[10px] text-gray-400 text-center mt-1">
                                                        {Math.round(product.enteredPurchasePrice / product.conversionRate)} / Pc
                                                    </div>
                                                )}
                                            </td>

                                            {/* Total */}
                                            <td className="px-2 py-3">
                                                <div className="text-blue-700 font-bold text-sm pt-1">
                                                    ₨ {product.total.toFixed(0)}
                                                </div>
                                            </td>

                                            {/* Sale Price */}
                                            <td className="px-2 py-3">
                                                <input type="number" className="input input-bordered input-sm w-full" value={product.sellPrice} onChange={(e) => updateField(index, 'sellPrice', parseFloat(e.target.value) || 0)}/>
                                            </td>

                                            {/* Wholesale Price */}
                                            <td className="px-2 py-3">
                                                <input type="number" className="input input-bordered input-sm w-full" value={product.wholeSalePrice} onChange={(e) => updateField(index, 'wholeSalePrice', parseFloat(e.target.value) || 0)}/>
                                            </td>

                                            {/* Expiry */}
                                            <td className="px-2 py-3">
                                                <input type="date" value={product.expirationDate || ''} onChange={(e) => updateField(index, 'expirationDate', e.target.value)} className="input input-bordered input-sm w-full"/>
                                            </td>

                                            {/* Action */}
                                            <td className="px-2 py-3 text-center">
                                                <button className="btn btn-ghost btn-xs text-red-500" onClick={() => setSelectedProducts(selectedProducts.filter((_, i) => i !== index))}>
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>))) : (<tr><td colSpan="10" className="text-center text-gray-500 py-8">No products added. Search above to add.</td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Payment Details */}
                <div className="lg:w-1/4 lg:min-w-[300px] w-full">
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-6 shadow-lg lg:sticky lg:top-4">
                        <h3 className="text-2xl font-bold mb-6 text-blue-800">Summary</h3>
                        
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">Payment Mode:</label>
                            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="select select-bordered w-full bg-white">
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank</option>
                            </select>
                        </div>

                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg mb-4 shadow-md">
                            <label className="text-white text-sm font-semibold block mb-1">Total Bill:</label>
                            <div className="text-3xl font-bold text-white">₨ {calculateTotalBill().toFixed(2)}</div>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">Amount Paid:</label>
                            <input type="number" value={totalPayment === 0 ? '' : totalPayment} onChange={handleTotalPaymentChange} className="input input-bordered w-full bg-white text-lg font-bold"/>
                        </div>

                        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-lg mb-6 shadow-md">
                            <label className="text-white text-sm font-semibold block mb-1">Credit (Udhaar):</label>
                            <div className="text-3xl font-bold text-white">₨ {credit.toFixed(2)}</div>
                        </div>

                        <button onClick={handleAddPurchase} className="btn btn-primary w-full mb-3 text-lg font-bold shadow-lg">
                            Save Purchase
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewPurchases;
