import React, { useState, useEffect } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { FaSave, FaArrowLeft, FaSearch } from 'react-icons/fa';

const AddDamage = () => {
  const context = useAppContext();
  const navigate = useNavigate();

  // --- CRITICAL FIX: Universal Store Mapping ---
  // 1. 'products' -> 'data'
  // 2. 'units' -> 'data'
  const products = context.productContext.data || [];
  const units = context.unitContext.data || [];
  
  const updateProduct = context.productContext.edit;
  const addDamage = context.damageContext.add;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [reason, setReason] = useState("");
  
  // --- Unit & Qty States ---
  const [enteredQty, setEnteredQty] = useState(1);
  const [unitMode, setUnitMode] = useState('base'); // 'base' or 'secondary'

  // Filter products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    // Auto-select first batch
    if(prod.batchCode && prod.batchCode.length > 0) {
        setSelectedBatch(prod.batchCode[0].batchCode);
    }
    setUnitMode('base'); // Reset mode
    setEnteredQty(1);    // Reset qty
    setSearchQuery(""); 
  };

  const getSelectedBatchDetails = () => {
      if(!selectedProduct || !selectedBatch) return null;
      // Safety check for batchCode array
      if (!selectedProduct.batchCode) return null;
      return selectedProduct.batchCode.find(b => b.batchCode === selectedBatch);
  };

  const batchDetails = getSelectedBatchDetails();
  
  // --- UNIT LOGIC ---
  const hasSecondary = selectedProduct?.secondaryUnitId && selectedProduct?.conversionRate > 1;
  const convRate = hasSecondary ? Number(selectedProduct.conversionRate) : 1;
  
  const baseUnitName = selectedProduct ? (units.find(u => u.id === selectedProduct.unitId)?.name || "Pcs") : "";
  const secUnitName = hasSecondary ? (units.find(u => u.id === selectedProduct.secondaryUnitId)?.name || "Ctn") : "";

  // Calculate Max Qty in Display Unit
  const currentStockBase = batchDetails ? Number(batchDetails.quantity) : 0;
  
  const maxQtyDisplay = unitMode === 'secondary' 
      ? Math.floor(currentStockBase / convRate) 
      : currentStockBase;

  const handleSave = async () => {
    if (!selectedProduct || !selectedBatch) return alert("Select Product & Batch");
    if (enteredQty <= 0) return alert("Invalid Quantity");
    if (enteredQty > maxQtyDisplay) return alert(`Insufficient Stock! You only have ${maxQtyDisplay} ${unitMode === 'secondary' ? secUnitName : baseUnitName}`);
    if (!reason) return alert("Please provide a reason.");

    // Calculate Total Pieces to Deduct
    const totalPiecesToDeduct = unitMode === 'secondary' 
        ? Number(enteredQty) * convRate 
        : Number(enteredQty);

    const damageRecord = {
        id: uuidv4(),
        refNo: `DMG-${Math.floor(100000 + Math.random() * 900000)}`,
        date: date,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        batchCode: selectedBatch,
        
        // STORE BOTH VISUAL & ACTUAL DATA
        quantity: totalPiecesToDeduct, // For Stock & Math (Base Units)
        enteredQty: Number(enteredQty), // For Display
        unitMode: unitMode,
        unitName: unitMode === 'secondary' ? secUnitName : baseUnitName,
        conversionRate: convRate,

        purchasePrice: batchDetails.purchasePrice, 
        reason: reason,
        status: 'Pending', 
        resolution: null,
        updatedAt: new Date().toISOString()
    };

    // 1. Add Record
    await addDamage(damageRecord);

    // 2. Deduct Stock (Always in Base Units)
    const updatedBatchCode = selectedProduct.batchCode.map(b => {
        if(b.batchCode === selectedBatch) {
            return { ...b, quantity: Number(b.quantity) - totalPiecesToDeduct };
        }
        return b;
    });
    await updateProduct(selectedProduct.id, { ...selectedProduct, batchCode: updatedBatchCode });

    alert("Damage Recorded & Stock Deducted Successfully");
    navigate('/damage');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost gap-2"><FaArrowLeft /> Back</button>
        <h1 className="text-2xl font-bold text-red-800">Report Damage</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg space-y-5 border border-gray-200">
        
        {/* Date */}
        <div className="form-control">
            <label className="label font-bold text-gray-600">Date</label>
            <input type="date" className="input input-bordered w-full" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {/* Product Search */}
        {!selectedProduct ? (
            <div className="form-control">
                <label className="label font-bold text-gray-600">Search Product</label>
                <div className="relative">
                    <input 
                        type="text" 
                        className="input input-bordered w-full pl-10" 
                        placeholder="Type name or barcode..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                </div>
                {searchQuery && (
                    <div className="border rounded mt-2 max-h-48 overflow-y-auto bg-white shadow-lg z-10">
                        {filteredProducts.map(p => (
                            <div key={p.id} onClick={() => handleSelectProduct(p)} className="p-3 hover:bg-blue-50 cursor-pointer border-b transition-colors">
                                <div className="font-bold">{p.name}</div>
                                <div className="text-xs text-gray-500">Stock: {(p.batchCode || []).reduce((a,b)=>a+Number(b.quantity),0)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 relative animate-fadeIn">
                <button onClick={() => setSelectedProduct(null)} className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost hover:bg-blue-200">✕</button>
                <h3 className="font-bold text-lg text-blue-900">{selectedProduct.name}</h3>
                
                {/* Batch Selection */}
                <div className="mt-3">
                    <label className="text-xs font-bold uppercase text-blue-800 tracking-wide">Select Batch</label>
                    <select className="select select-bordered select-sm w-full mt-1 bg-white" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                        {(selectedProduct.batchCode || []).map(b => (
                            <option key={b.batchCode} value={b.batchCode}>{b.batchCode} (Base Qty: {b.quantity})</option>
                        ))}
                    </select>
                </div>
            </div>
        )}

        {/* Unit & Quantity Section */}
        {selectedProduct && batchDetails && (
            <div className="grid grid-cols-2 gap-4">
                {/* Unit Toggle */}
                <div className="form-control">
                    <label className="label font-bold text-gray-600">Unit</label>
                    {hasSecondary ? (
                        <div className="flex bg-gray-100 rounded-lg p-1 border">
                            <button 
                                className={`flex-1 py-2 text-sm font-bold rounded ${unitMode === 'base' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
                                onClick={() => setUnitMode('base')}
                            >
                                {baseUnitName}
                            </button>
                            <button 
                                className={`flex-1 py-2 text-sm font-bold rounded ${unitMode === 'secondary' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
                                onClick={() => setUnitMode('secondary')}
                            >
                                {secUnitName}
                            </button>
                        </div>
                    ) : (
                        <input type="text" value={baseUnitName} disabled className="input input-bordered bg-gray-100 font-bold text-gray-500" />
                    )}
                </div>

                {/* Quantity Input */}
                <div className="form-control">
                    <label className="label font-bold text-gray-600">
                        Quantity <span className="text-xs font-normal text-gray-400">(Max: {maxQtyDisplay})</span>
                    </label>
                    <input 
                        type="number" 
                        className={`input input-bordered w-full font-bold text-lg ${enteredQty > maxQtyDisplay ? 'input-error text-red-600' : ''}`}
                        value={enteredQty} 
                        onChange={e => setEnteredQty(e.target.value)}
                        min="1"
                    />
                </div>
            </div>
        )}

        {/* Reason */}
        <div className="form-control">
            <label className="label font-bold text-gray-600">Reason / Cause</label>
            <textarea 
                className="textarea textarea-bordered h-24" 
                placeholder="Example: Broken during delivery, Rat damage, Expired..."
                value={reason}
                onChange={e => setReason(e.target.value)}
            ></textarea>
        </div>

        <button 
            className="btn btn-error w-full mt-4 gap-2 text-white shadow-lg hover:shadow-xl transition-all" 
            onClick={handleSave} 
            disabled={!selectedProduct || enteredQty > maxQtyDisplay || enteredQty <= 0}
        >
            <FaSave /> Confirm Damage Entry
        </button>

      </div>
    </div>
  );
};

export default AddDamage;

