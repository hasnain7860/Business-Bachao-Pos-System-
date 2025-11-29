import React, { useState, useEffect } from 'react';
import { useAppContext } from '../Appfullcontext';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTrash, FaSave, FaArrowLeft, FaSearch, FaPlus } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

const AddPurchaseReturn = () => {
  const context = useAppContext();
  const navigate = useNavigate();
  const { id: paramPurchaseId } = useParams();

  // --- CRITICAL FIX: Universal Store Mapping ---
  // Access .data, not specific names like .products or .people
  const products = context.productContext.data || [];
  const suppliers = context.peopleContext.data || [];
  const purchases = context.purchaseContext.data || [];
  const units = context.unitContext.data || [];
  const existingReturns = context.purchaseReturnContext.data || [];
  
  const addPurchaseReturn = context.purchaseReturnContext.add;
  const updateProduct = context.productContext.edit; 

  // Form State
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [returnMode, setReturnMode] = useState("manual"); 
  const [selectedPurchaseId, setSelectedPurchaseId] = useState("");
  
  // Item Selection State
  const [searchQuery, setSearchQuery] = useState("");
  const [returnItems, setReturnItems] = useState([]);
  
  // Payment/Ledger State
  const [cashReturn, setCashReturn] = useState(0);

  // --- HELPER: Calculate Already Returned Quantity (In Base Units) ---
  const getAlreadyReturnedQty = (purchaseRefNo, productId, batchCode) => {
      if (!purchaseRefNo) return 0;
      
      const relevantReturns = existingReturns.filter(r => r.purchaseRefNo === purchaseRefNo);
      
      let totalReturned = 0;
      relevantReturns.forEach(ret => {
          if (ret.items) {
              const item = ret.items.find(i => i.id === productId && i.batchCode === batchCode);
              if (item) {
                  // We assume 'quantity' in DB is always Base Unit
                  totalReturned += Number(item.quantity || 0);
              }
          }
      });
      return totalReturned;
  };

  // --- CORE LOGIC: Load Items from an Invoice ---
  const loadItemsFromInvoice = (purchaseId) => {
    if (!purchaseId) {
        setReturnItems([]);
        return;
    }

    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    const loadedItems = [];
    
    if (purchase.products && purchase.products.length > 0) {
         purchase.products.forEach(purItem => {
            // 1. Real Stock Check (Warehouse Limit)
            const realProduct = products.find(p => p.id === purItem.id);
            
            if (realProduct) {
                // Safety check for batches
                const realBatch = (realProduct.batchCode || []).find(b => b.batchCode === purItem.batchCode);
                
                if (realBatch) {
                    // --- UNIT LOGIC ---
                    const hasSecondary = realProduct.secondaryUnitId && realProduct.conversionRate > 1;
                    const convRate = hasSecondary ? Number(realProduct.conversionRate) : 1;
                    
                    // Prefer the mode used during Purchase, else default to base
                    const preferredMode = purItem.unitMode || 'base';
                    const unitName = preferredMode === 'secondary' 
                        ? (units.find(u => u.id === realProduct.secondaryUnitId)?.name || "Ctn")
                        : (units.find(u => u.id === realProduct.unitId)?.name || "Pcs");

                    // 2. History Check (Invoice Limit - Base Units)
                    const originalPurchasedQty = Number(purItem.quantity); // Base units
                    const alreadyReturned = getAlreadyReturnedQty(purchase.purchaseRefNo, purItem.id, purItem.batchCode);
                    const remainingInvoiceQty = Math.max(0, originalPurchasedQty - alreadyReturned);
                    
                    // 3. Current Stock Limit (Base Units)
                    const currentStockQty = Number(realBatch.quantity);

                    // FINAL MAX (Base Units)
                    const finalMaxQtyBase = Math.min(remainingInvoiceQty, currentStockQty);

                    // Convert to Display Unit
                    const maxDisplayQty = finalMaxQtyBase / (preferredMode === 'secondary' ? convRate : 1);
                    const displayPrice = Number(purItem.purchasePrice) * (preferredMode === 'secondary' ? convRate : 1);

                    // Only add if returnable > 0
                    if (finalMaxQtyBase > 0) {
                        loadedItems.push({
                            id: purItem.id,
                            productName: purItem.name || realProduct.name,
                            batchCode: purItem.batchCode,
                            
                            // Unit Data
                            unitMode: preferredMode,
                            unitName: unitName,
                            conversionRate: convRate,
                            hasSecondary: hasSecondary,
                            baseUnitName: units.find(u => u.id === realProduct.unitId)?.name || "Pcs",
                            secUnitName: units.find(u => u.id === realProduct.secondaryUnitId)?.name || "Ctn",

                            // Quantities
                            maxDisplayQuantity: maxDisplayQty, 
                            quantity: 0, // Start with 0 for safety
                            
                            // Prices
                            basePrice: Number(purItem.purchasePrice), // Cost per Piece
                            price: displayPrice, // Cost per Display Unit
                            total: 0,
                            
                            // Metadata for UI
                            originalQtyDisplay: purItem.enteredQty || originalPurchasedQty,
                            returnedQtyBase: alreadyReturned
                        });
                    }
                }
            }
         });
    }
    setReturnItems(loadedItems);
  };

  // --- EFFECT: Auto Load from URL ---
  useEffect(() => {
    if (paramPurchaseId && purchases.length > 0) {
      const purchase = purchases.find(p => p.id === paramPurchaseId);
      if (purchase) {
        setSelectedSupplier(purchase.personId);
        setReturnMode('invoice');
        setSelectedPurchaseId(purchase.id);
        loadItemsFromInvoice(purchase.id);
      }
    }
  }, [paramPurchaseId, purchases, products, existingReturns]);

  // --- HANDLERS ---
  
  const handleInvoiceChange = (e) => {
      const newId = e.target.value;
      setSelectedPurchaseId(newId);
      loadItemsFromInvoice(newId);
  };

  const generateReturnRef = () => `RET-${Math.floor(100000 + Math.random() * 900000)}`;

  const getProductBatches = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? (product.batchCode || []) : [];
  };

  const handleAddItem = (product, specificBatch = null) => {
    const existingItem = returnItems.find(item => 
      item.id === product.id && item.batchCode === (specificBatch ? specificBatch.batchCode : item.batchCode)
    );

    if (existingItem) {
      alert("This product/batch is already in the return list!");
      return;
    }

    const batches = product.batchCode || [];
    const targetBatch = specificBatch || (batches.length > 0 ? batches[0] : null);

    if (!targetBatch) {
      alert("This product has no stock batches available to return.");
      return;
    }

    // Unit Setup
    const hasSecondary = product.secondaryUnitId && product.conversionRate > 1;
    const convRate = hasSecondary ? Number(product.conversionRate) : 1;
    const baseUnitName = units.find(u => u.id === product.unitId)?.name || "Pcs";
    const secUnitName = hasSecondary ? (units.find(u => u.id === product.secondaryUnitId)?.name || "Ctn") : "";

    const maxQtyBase = Number(targetBatch.quantity || 0);

    const newItem = {
      id: product.id,
      productName: product.name,
      batchCode: targetBatch.batchCode,
      
      // Unit Data
      unitMode: 'base', // Default to base for manual
      unitName: baseUnitName,
      conversionRate: convRate,
      hasSecondary: hasSecondary,
      baseUnitName: baseUnitName,
      secUnitName: secUnitName,

      maxDisplayQuantity: maxQtyBase, 
      quantity: 1, 
      
      basePrice: Number(targetBatch.purchasePrice || 0),
      price: Number(targetBatch.purchasePrice || 0), 
      total: Number(targetBatch.purchasePrice || 0)
    };

    setReturnItems([...returnItems, newItem]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...returnItems];
    const item = updatedItems[index];

    if (field === "quantity") {
      const val = value === "" ? "" : Number(value);
      item.quantity = val;
      item.total = val * item.price;
    
    } else if (field === "unitMode") {
        // Toggle Logic
        const newMode = value;
        item.unitMode = newMode;
        
        if (newMode === 'secondary') {
            item.unitName = item.secUnitName;
            item.price = item.basePrice * item.conversionRate;
            // Adjust Max Qty Display
            item.maxDisplayQuantity = item.maxDisplayQuantity / item.conversionRate;
            item.quantity = Number((item.quantity / item.conversionRate).toFixed(2));
        } else {
            item.unitName = item.baseUnitName;
            item.price = item.basePrice;
            item.maxDisplayQuantity = item.maxDisplayQuantity * item.conversionRate;
            item.quantity = item.quantity * item.conversionRate;
        }
        item.total = item.quantity * item.price;

    } else if (field === "batchCode") {
      const product = products.find(p => p.id === item.id);
      const newBatch = (product.batchCode || []).find(b => b.batchCode === value);
      if (newBatch) {
        item.batchCode = value;
        // Reset to base unit values when batch changes
        const maxBase = Number(newBatch.quantity || 0);
        item.basePrice = Number(newBatch.purchasePrice || 0);
        
        if (item.unitMode === 'secondary') {
             item.maxDisplayQuantity = maxBase / item.conversionRate;
             item.price = item.basePrice * item.conversionRate;
        } else {
             item.maxDisplayQuantity = maxBase;
             item.price = item.basePrice;
        }
        item.total = Number(item.quantity || 0) * item.price;
      }
    }
    setReturnItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const updated = returnItems.filter((_, i) => i !== index);
    setReturnItems(updated);
  };

  const grandTotal = returnItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  const creditAdjustment = Math.max(0, grandTotal - Number(cashReturn));
  
  // Validation
  const isValid = returnItems.every(item => Number(item.quantity) > 0 && Number(item.quantity) <= (item.maxDisplayQuantity + 0.001));

  const handleSave = async () => {
    if (!selectedSupplier) return alert("Please select a supplier.");
    if (returnItems.length === 0) return alert("Please add items to return.");
    if (!isValid) return alert("Please correct quantities in red (cannot exceed purchased/stock amount).");

    // Prepare Items for Storage
    const processedItems = returnItems.map(item => ({
        id: item.id,
        productName: item.productName,
        batchCode: item.batchCode,
        
        // Visual
        displayQuantity: Number(item.quantity),
        unitName: item.unitName,
        unitMode: item.unitMode,
        
        // Actual Database Values (Base Units)
        quantity: Number(item.quantity) * (item.unitMode === 'secondary' ? item.conversionRate : 1),
        price: item.price, 
        total: item.total
    }));

    const returnData = {
      id: uuidv4(),
      returnRefNo: generateReturnRef(),
      purchaseRefNo: returnMode === 'invoice' ? purchases.find(p => p.id === selectedPurchaseId)?.purchaseRefNo : 'Direct Return',
      peopleId: selectedSupplier, 
      returnDate: returnDate,    
      updatedAt: new Date().toISOString(),
      totalAmount: grandTotal,
      items: processedItems,
      paymentDetails: {
        cashReturn: Number(cashReturn),
        creditAdjustment: creditAdjustment
      }
    };

    // Update Stock (Subtract Base Units)
    for (const item of processedItems) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        const safeBatches = Array.isArray(product.batchCode) ? product.batchCode : [];
        const updatedBatchCode = safeBatches.map(batch => {
          if (batch.batchCode === item.batchCode) {
            return {
              ...batch,
              quantity: Number(batch.quantity) - Number(item.quantity) // Subtract Base Units
            };
          }
          return batch;
        });
        await updateProduct(product.id, { ...product, batchCode: updatedBatchCode });
      }
    }

    await addPurchaseReturn(returnData);
    alert("Return Saved Successfully!");
    navigate('/return/purchase_return'); 
  };

  const filteredProducts = products.filter(p => 
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (p.nameInUrdu && p.nameInUrdu.includes(searchQuery)))
  );

  const supplierPurchases = purchases.filter(p => p.personId === selectedSupplier);

  return (
    <div className="p-4 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost gap-2">
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">New Purchase Return</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="form-control mb-3">
              <label className="label font-bold">Return Date</label>
              <input 
                type="date" 
                className="input input-bordered" 
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
              />
            </div>

            <div className="form-control mb-3">
              <label className="label font-bold">Supplier</label>
              <select 
                className="select select-bordered"
                value={selectedSupplier}
                onChange={e => {
                  setSelectedSupplier(e.target.value);
                  setReturnItems([]); 
                  setSelectedPurchaseId("");
                }}
                disabled={!!paramPurchaseId}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-control mb-3">
              <label className="label font-bold">Return Mode</label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button 
                  className={`flex-1 py-2 rounded text-sm font-bold ${returnMode === 'manual' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                  onClick={() => { setReturnMode('manual'); setReturnItems([]); }}
                  disabled={!!paramPurchaseId}
                >
                  Direct
                </button>
                <button 
                  className={`flex-1 py-2 rounded text-sm font-bold ${returnMode === 'invoice' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                  onClick={() => { setReturnMode('invoice'); setReturnItems([]); }}
                  disabled={!!paramPurchaseId}
                >
                  Invoice
                </button>
              </div>
            </div>

            {returnMode === 'invoice' && (
              <div className="form-control mb-3 animate-fadeIn">
                <label className="label font-bold text-sm">Select Purchase Invoice</label>
                <select 
                  className="select select-bordered select-sm"
                  value={selectedPurchaseId}
                  onChange={handleInvoiceChange} 
                  disabled={!!paramPurchaseId}
                >
                  <option value="">Select Invoice</option>
                  {supplierPurchases.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.purchaseRefNo} ({new Date(p.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                {selectedPurchaseId && (
                    <div className="text-xs text-green-600 mt-1 text-center">
                        ✓ Items loaded automatically
                    </div>
                )}
              </div>
            )}
          </div>

          {returnMode === 'manual' && (
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                <FaSearch className="text-gray-400"/> Find Products
                </h3>
                <input 
                type="text" 
                placeholder="Search by name..." 
                className="input input-bordered w-full mb-2"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                />
                <div className="h-48 overflow-y-auto border rounded-lg bg-gray-50 p-2 space-y-1">
                    {searchQuery && filteredProducts.map(prod => (
                    <div 
                        key={prod.id} 
                        className="p-2 bg-white rounded border hover:border-blue-500 cursor-pointer flex justify-between items-center group"
                        onClick={() => handleAddItem(prod)}
                    >
                        <div className="text-sm">
                            <div className="font-bold">{prod.name}</div>
                            <div className="text-xs text-gray-500">Stock: {(prod.batchCode || []).reduce((a,b) => a + Number(b.quantity), 0)}</div>
                        </div>
                        <button className="btn btn-xs btn-ghost text-blue-600 opacity-0 group-hover:opacity-100">
                            <FaPlus />
                        </button>
                    </div>
                    ))}
                </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
           <div className="bg-white rounded-lg shadow overflow-hidden flex-1">
              <div className="overflow-x-auto">
                <table className="table table-compact w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="w-1/3">Product</th>
                      <th>Batch</th>
                      <th>Unit</th>
                      <th className="text-center w-24">Qty (Max)</th>
                      <th className="text-right w-24">Refund Rate</th>
                      <th className="text-right w-24">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.length > 0 ? returnItems.map((item, index) => {
                       const isQtyInvalid = Number(item.quantity) > item.maxDisplayQuantity || Number(item.quantity) <= 0;
                       return (
                        <tr key={index}>
                          <td>
                            <div className="font-bold text-sm">{item.productName}</div>
                            {returnMode === 'invoice' && (
                                <div className="text-[10px] text-gray-400">
                                    Orig: {item.originalQtyDisplay} | Returned: {item.returnedQtyBase} Pcs
                                </div>
                            )}
                          </td>
                          <td>
                             {returnMode === 'invoice' ? (
                                 <span className="badge badge-ghost badge-sm font-mono">{item.batchCode}</span>
                             ) : (
                                <select 
                                  className="select select-bordered select-xs w-full"
                                  value={item.batchCode}
                                  onChange={(e) => handleItemChange(index, 'batchCode', e.target.value)}
                                >
                                  {getProductBatches(item.id).map(b => (
                                    <option key={b.batchCode} value={b.batchCode}>{b.batchCode}</option>
                                  ))}
                                </select>
                             )}
                          </td>
                          
                          {/* Unit Selector */}
                          <td>
                             {item.hasSecondary ? (
                                 <select 
                                    className="select select-bordered select-xs w-full font-bold text-blue-600"
                                    value={item.unitMode}
                                    onChange={(e) => handleItemChange(index, 'unitMode', e.target.value)}
                                 >
                                    <option value="base">{item.baseUnitName}</option>
                                    <option value="secondary">{item.secUnitName}</option>
                                 </select>
                             ) : (
                                 <span className="text-xs font-bold pl-2">{item.baseUnitName}</span>
                             )}
                          </td>

                          <td>
                             <div className="relative">
                               <input 
                                 type="number" 
                                 className={`input input-bordered input-sm w-full text-center ${isQtyInvalid ? 'input-error text-red-600' : ''}`}
                                 value={item.quantity}
                                 onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                               />
                               <div className={`text-[10px] text-center mt-0.5 ${isQtyInvalid ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                 Max: {Number(item.maxDisplayQuantity).toFixed(2)}
                               </div>
                             </div>
                          </td>
                          <td className="text-right">{item.price.toFixed(2)}</td>
                          <td className="text-right font-bold">{Number(item.total).toFixed(2)}</td>
                          <td>
                             <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:bg-red-50 p-1 rounded"><FaTrash /></button>
                          </td>
                        </tr>
                       );
                    }) : (
                      <tr><td colSpan="7" className="text-center py-10 text-gray-400">No items selected.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>

           <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Refund:</span>
                    <span className="text-xl font-bold">Rs. {grandTotal.toFixed(2)}</span>
                 </div>
                 <div className="divider my-1"></div>
                 <div className="form-control">
                    <label className="label text-sm font-semibold">Cash Returned (Nagad)</label>
                    <input type="number" className="input input-bordered" value={cashReturn} onChange={e => setCashReturn(e.target.value)} />
                 </div>
                 <div className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100">
                    <span className="text-blue-800 text-sm">Ledger Adjustment:</span>
                    <span className="font-bold text-blue-800">Rs. {creditAdjustment.toFixed(2)}</span>
                 </div>
              </div>
              <div className="flex flex-col gap-2">
                 <button className="btn btn-primary btn-lg w-full gap-2" onClick={handleSave} disabled={!isValid || returnItems.length === 0}>
                   <FaSave /> Confirm Return
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AddPurchaseReturn;

