import React, { useState } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Save, ArrowLeft, Search } from 'lucide-react';

const AddDamage = () => {
  const context = useAppContext();
  const navigate = useNavigate();

  const products = context.productContext.products;
  const updateProduct = context.productContext.edit;
  const addDamage = context.damageContext.add; // From new context

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [damageQty, setDamageQty] = useState(1);
  const [reason, setReason] = useState("");

  // Filter products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    // Auto-select first batch if available
    if(prod.batchCode && prod.batchCode.length > 0) {
        setSelectedBatch(prod.batchCode[0].batchCode);
    }
    setSearchQuery(""); // Clear search to show selected UI
  };

  const getSelectedBatchDetails = () => {
      if(!selectedProduct || !selectedBatch) return null;
      return selectedProduct.batchCode.find(b => b.batchCode === selectedBatch);
  };

  const batchDetails = getSelectedBatchDetails();
  const maxQty = batchDetails ? Number(batchDetails.quantity) : 0;

  const handleSave = async () => {
    if (!selectedProduct || !selectedBatch) return alert("Select Product & Batch");
    if (damageQty <= 0 || damageQty > maxQty) return alert("Invalid Quantity");
    if (!reason) return alert("Please provide a reason (e.g. Broken, Expired)");

    const damageRecord = {
        id: uuidv4(),
        refNo: `DMG-${Math.floor(100000 + Math.random() * 900000)}`,
        date: date,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        batchCode: selectedBatch,
        quantity: Number(damageQty),
        purchasePrice: batchDetails.purchasePrice, // Tracking value
        reason: reason,
        status: 'Pending', // Initial Status: Warehouse mein pada hai
        resolution: null,  // Abhi koi faisla nahi hua
        updatedAt: new Date().toISOString()
    };

    // 1. Add to Damage Context
    await addDamage(damageRecord);

    // 2. Deduct from Main Product Stock
    const updatedBatchCode = selectedProduct.batchCode.map(b => {
        if(b.batchCode === selectedBatch) {
            return { ...b, quantity: Number(b.quantity) - Number(damageQty) };
        }
        return b;
    });
    await updateProduct(selectedProduct.id, { ...selectedProduct, batchCode: updatedBatchCode });

    alert("Damage Recorded & Stock Deducted Successfully");
    navigate('/damage'); // Go to list
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost gap-2"><ArrowLeft className="w-5 h-5" /> Back</button>
        <h1 className="text-2xl font-bold">Report Damage</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        
        {/* Date */}
        <div className="form-control">
            <label className="label font-bold">Date</label>
            <input type="date" className="input input-bordered" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {/* Product Search/Select */}
        {!selectedProduct ? (
            <div className="form-control">
                <label className="label font-bold">Search Product</label>
                <div className="relative">
                    <input 
                        type="text" 
                        className="input input-bordered w-full pl-10" 
                        placeholder="Type name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                </div>
                {searchQuery && (
                    <div className="border rounded mt-2 max-h-40 overflow-y-auto">
                        {filteredProducts.map(p => (
                            <div key={p.id} onClick={() => handleSelectProduct(p)} className="p-2 hover:bg-gray-100 cursor-pointer border-b">
                                {p.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            <div className="p-4 bg-blue-50 rounded border border-blue-200 relative">
                <button onClick={() => setSelectedProduct(null)} className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost">✕</button>
                <h3 className="font-bold text-lg">{selectedProduct.name}</h3>
                
                {/* Batch Selection */}
                <div className="mt-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Select Batch</label>
                    <select className="select select-bordered select-sm w-full mt-1" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                        {selectedProduct.batchCode.map(b => (
                            <option key={b.batchCode} value={b.batchCode}>{b.batchCode} (Qty: {b.quantity})</option>
                        ))}
                    </select>
                </div>
            </div>
        )}

        {/* Quantity */}
        {selectedProduct && (
            <div className="form-control">
                <label className="label font-bold">Quantity (Max: {maxQty})</label>
                <input 
                    type="number" 
                    className={`input input-bordered ${damageQty > maxQty ? 'input-error' : ''}`}
                    value={damageQty} 
                    onChange={e => setDamageQty(e.target.value)}
                />
                {damageQty > maxQty && <span className="text-xs text-red-500 mt-1">Cannot exceed current stock</span>}
            </div>
        )}

        {/* Reason */}
        <div className="form-control">
            <label className="label font-bold">Reason / Cause</label>
            <textarea 
                className="textarea textarea-bordered" 
                placeholder="e.g. Broken during shipping, Expired..."
                value={reason}
                onChange={e => setReason(e.target.value)}
            ></textarea>
        </div>

        <button className="btn btn-error w-full mt-4 gap-2" onClick={handleSave} disabled={!selectedProduct || damageQty > maxQty}>
            <Save className="w-5 h-5" /> Confirm Damage Entry
        </button>

      </div>
    </div>
  );
};

export default AddDamage;