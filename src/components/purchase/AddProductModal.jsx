import React, { useState, useEffect } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const AddProductModal = ({ isOpen, onClose, onConfirm, product, initialBatch, units }) => {
    const [tempProduct, setTempProduct] = useState(null);

    useEffect(() => {
        if (isOpen && product) {
            const batches = product.batchCode || [];
            const defaultBatch = initialBatch || (batches.length ? batches[0] : null);
            
            // --- STRICT CHECKS ---
            // Ensure IDs are strings or null, never undefined
            const pUnitId = product.unitId || null;
            const pSecUnitId = product.secondaryUnitId || null;
            const pConvRate = Number(product.conversionRate) || 1;
            
            // Logic: Secondary tabhi banega jab ID ho aur Rate > 1 ho
            const hasSecondary = Boolean(pSecUnitId && pConvRate > 1);

            // Get Unit Names safely
            const baseUnitName = units.find(u => u.id === pUnitId)?.name || "Pcs";
            const secUnitName = hasSecondary ? (units.find(u => u.id === pSecUnitId)?.name || "Ctn") : "";

            setTempProduct({
                // Original Reference
                originalProduct: product,
                id: product.id || "",
                name: product.name || "Unknown",
                companyId: product.companyId || null,
                
                // --- ID SAVING (Safe Defaults) ---
                baseUnitId: pUnitId,
                secondaryUnitId: pSecUnitId,

                // Logic Flags
                hasSecondary: hasSecondary,
                baseUnitName: baseUnitName,
                secUnitName: secUnitName,
                conversionRate: pConvRate,
                existingBatches: batches,

                // Selection State
                selectedBatchCode: defaultBatch ? (defaultBatch.batchCode || "") : `BATCH-${String(1).padStart(3, '0')}`,
                isNewBatch: !defaultBatch, 
                unitMode: 'base', // 'base' or 'secondary'
                
                // Inputs (Strings for UI)
                enteredQty: '', 
                enteredPrice: defaultBatch ? (defaultBatch.purchasePrice || 0) : 0, 
                
                // Prices
                sellPrice: defaultBatch ? (defaultBatch.sellPrice || 0) : 0,
                wholeSalePrice: defaultBatch ? (defaultBatch.wholeSalePrice || 0) : 0,
                retailPrice: defaultBatch ? (defaultBatch.retailPrice || 0) : 0,
                expirationDate: defaultBatch ? (defaultBatch.expirationDate || "") : "",
            });
        }
    }, [isOpen, product, initialBatch, units]);

    if (!isOpen || !tempProduct) return null;

    // --- HANDLERS ---

    const handleBatchChange = (e) => {
        const val = e.target.value;
        if (val === 'NEW_BATCH') {
             const nextNum = (tempProduct.existingBatches?.length || 0) + 1;
             setTempProduct(prev => ({
                 ...prev,
                 selectedBatchCode: `BATCH-${String(nextNum).padStart(3, '0')}`,
                 isNewBatch: true,
                 enteredQty: '',
                 enteredPrice: 0
             }));
        } else {
            const batch = tempProduct.existingBatches.find(b => b.batchCode === val);
            if(batch) {
                const displayPrice = tempProduct.unitMode === 'secondary' 
                    ? (Number(batch.purchasePrice || 0) * tempProduct.conversionRate) 
                    : Number(batch.purchasePrice || 0);

                setTempProduct(prev => ({
                    ...prev,
                    selectedBatchCode: batch.batchCode || "",
                    isNewBatch: false,
                    enteredPrice: displayPrice,
                    sellPrice: batch.sellPrice || 0,
                    wholeSalePrice: batch.wholeSalePrice || 0,
                    retailPrice: batch.retailPrice || 0,
                    expirationDate: batch.expirationDate || ""
                }));
            }
        }
    };

    const handleUnitToggle = (mode) => {
        if (mode === tempProduct.unitMode) return;
        let newPrice = Number(tempProduct.enteredPrice || 0);
        
        if (mode === 'secondary') {
            // Base -> Sec (Multiply)
            newPrice = newPrice * tempProduct.conversionRate;
        } else {
            // Sec -> Base (Divide)
            newPrice = newPrice / tempProduct.conversionRate;
        }
        setTempProduct(prev => ({ ...prev, unitMode: mode, enteredPrice: newPrice }));
    };

    const handleConfirm = () => {
        // Validation
        if (!tempProduct.enteredQty || Number(tempProduct.enteredQty) <= 0) {
            alert("Quantity must be greater than 0");
            return;
        }
        
        const qty = parseFloat(tempProduct.enteredQty) || 0;
        const price = parseFloat(tempProduct.enteredPrice) || 0;
        
        // Calculate Backend Values
        let finalBaseQty = 0;
        let finalBaseCost = 0;
        
        if (tempProduct.unitMode === 'secondary') {
            finalBaseQty = qty * tempProduct.conversionRate;
            finalBaseCost = price / tempProduct.conversionRate;
        } else {
            finalBaseQty = qty;
            finalBaseCost = price;
        }

        // --- EXPLICIT PAYLOAD MAPPING (NO UNDEFINED ALLOWED) ---
        const payload = {
            id: tempProduct.id,
            name: tempProduct.name,
            companyId: tempProduct.companyId || null, // Firebase needs null, not undefined
            
            // IDs
            baseUnitId: tempProduct.baseUnitId || null,
            secondaryUnitId: tempProduct.secondaryUnitId || null,
            // Determine transaction unit ID
            transactionUnitId: tempProduct.unitMode === 'secondary' 
                ? (tempProduct.secondaryUnitId || tempProduct.baseUnitId) 
                : (tempProduct.baseUnitId || null),

            // Display
            hasSecondary: Boolean(tempProduct.hasSecondary),
            baseUnitName: tempProduct.baseUnitName || "Pcs",
            secUnitName: tempProduct.secUnitName || "",
            conversionRate: Number(tempProduct.conversionRate) || 1,
            unitMode: tempProduct.unitMode, // 'base' or 'secondary'

            // Values
            enteredQty: qty,
            enteredPurchasePrice: price,
            
            // Backend Storage Values
            quantity: finalBaseQty,
            purchasePrice: finalBaseCost,
            batchCode: tempProduct.selectedBatchCode || "BATCH-001",
            total: qty * price,
            
            // Other Prices
            sellPrice: Number(tempProduct.sellPrice) || 0,
            wholeSalePrice: Number(tempProduct.wholeSalePrice) || 0,
            retailPrice: Number(tempProduct.retailPrice) || 0,
            expirationDate: tempProduct.expirationDate || "",
            
            isNewBatch: Boolean(tempProduct.isNewBatch)
        };

        onConfirm(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg">{tempProduct.name}</h3>
                    <button onClick={onClose} className="text-white hover:text-red-200 text-2xl"><AiOutlineClose /></button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {/* BATCH SELECT */}
                    <div className="form-control">
                        <label className="label"><span className="label-text font-semibold">Select Batch</span></label>
                        <select className="select select-bordered w-full bg-gray-50" value={tempProduct.isNewBatch ? 'NEW_BATCH' : tempProduct.selectedBatchCode} onChange={handleBatchChange}>
                            {tempProduct.existingBatches?.map(b => (
                                <option key={b.batchCode} value={b.batchCode}>{b.batchCode} (Stk: {b.quantity})</option>
                            ))}
                            <option value="NEW_BATCH" className="font-bold text-blue-600">+ Create New Batch</option>
                        </select>
                    </div>

                    {/* UNIT TOGGLE */}
                    {tempProduct.hasSecondary && (
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${tempProduct.unitMode === 'base' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`} onClick={() => handleUnitToggle('base')}>{tempProduct.baseUnitName}</button>
                            <button className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${tempProduct.unitMode === 'secondary' ? 'bg-white text-purple-600 shadow' : 'text-gray-500'}`} onClick={() => handleUnitToggle('secondary')}>{tempProduct.secUnitName} (x{tempProduct.conversionRate})</button>
                        </div>
                    )}

                    {/* INPUTS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text">Qty</span></label>
                            <input type="number" className="input input-bordered w-full font-bold" autoFocus value={tempProduct.enteredQty} onChange={(e) => setTempProduct({...tempProduct, enteredQty: e.target.value})} />
                        </div>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Cost</span></label>
                            <input type="number" className="input input-bordered w-full font-bold" value={tempProduct.enteredPrice} onChange={(e) => setTempProduct({...tempProduct, enteredPrice: e.target.value})} />
                        </div>
                    </div>

                    {/* DISPLAY TOTAL */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-center">
                        <div className="text-xs text-gray-500">Line Total</div>
                        <div className="text-2xl font-black text-blue-700">₨ {((parseFloat(tempProduct.enteredQty) || 0) * (parseFloat(tempProduct.enteredPrice) || 0)).toFixed(2)}</div>
                    </div>

                    {/* SALE PRICES */}
                    <div className="divider text-xs text-gray-400">Sale Rates (Per Piece)</div>
                    <div className="grid grid-cols-3 gap-2">
                        <div><label className="text-xs">Sale</label><input type="number" className="input input-bordered input-sm w-full" value={tempProduct.sellPrice} onChange={e => setTempProduct({...tempProduct, sellPrice: e.target.value})} /></div>
                        <div><label className="text-xs">Wholesale</label><input type="number" className="input input-bordered input-sm w-full" value={tempProduct.wholeSalePrice} onChange={e => setTempProduct({...tempProduct, wholeSalePrice: e.target.value})} /></div>
                        <div><label className="text-xs">Retail</label><input type="number" className="input input-bordered input-sm w-full" value={tempProduct.retailPrice} onChange={e => setTempProduct({...tempProduct, retailPrice: e.target.value})} /></div>
                    </div>
                     <div className="form-control">
                        <label className="label"><span className="label-text text-xs">Expiry Date</span></label>
                        <input type="date" className="input input-bordered w-full" value={tempProduct.expirationDate} onChange={e => setTempProduct({...tempProduct, expirationDate: e.target.value})} />
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex gap-2">
                    <button className="btn flex-1" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary flex-1" onClick={handleConfirm}>Add</button>
                </div>
            </div>
        </div>
    );
};

export default AddProductModal;


