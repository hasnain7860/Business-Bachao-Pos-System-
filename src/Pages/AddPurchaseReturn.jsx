import React, { useState, useEffect } from 'react';
import { useAppContext } from '../Appfullcontext';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTrash, FaSave, FaArrowLeft, FaSearch, FaPlus } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

const AddPurchaseReturn = () => {
  const context = useAppContext();
  const navigate = useNavigate();
  const { id: paramPurchaseId } = useParams();

  // Data from Context
  const products = context.productContext.products;
  const suppliers = context.peopleContext.people;
  const purchases = context.purchaseContext.purchases;
  const existingReturns = context.purchaseReturnContext.purchaseReturns || []; 
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

  // --- HELPER: Calculate Already Returned Quantity ---
  const getAlreadyReturnedQty = (purchaseRefNo, productId, batchCode) => {
      if (!purchaseRefNo) return 0;
      
      const relevantReturns = existingReturns.filter(r => r.purchaseRefNo === purchaseRefNo);
      
      let totalReturned = 0;
      relevantReturns.forEach(ret => {
          if (ret.items) {
              const item = ret.items.find(i => i.id === productId && i.batchCode === batchCode);
              if (item) {
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
                const realBatch = realProduct.batchCode.find(b => b.batchCode === purItem.batchCode);
                
                if (realBatch) {
                    // 2. History Check (Invoice Limit)
                    const originalPurchasedQty = Number(purItem.quantity);
                    const alreadyReturned = getAlreadyReturnedQty(purchase.purchaseRefNo, purItem.id, purItem.batchCode);
                    const remainingInvoiceQty = Math.max(0, originalPurchasedQty - alreadyReturned);
                    
                    // 3. Current Stock Limit
                    const currentStockQty = Number(realBatch.quantity);

                    // FINAL MAX: Lowest of (Remaining Invoice vs Current Stock)
                    const finalMaxQty = Math.min(remainingInvoiceQty, currentStockQty);

                    // Only add if returnable > 0
                    if (finalMaxQty > 0) {
                        loadedItems.push({
                            id: purItem.id,
                            productName: purItem.name || realProduct.name,
                            batchCode: purItem.batchCode,
                            maxQuantity: finalMaxQty, 
                            quantity: 1, // Default 1
                            price: Number(purItem.purchasePrice),
                            total: Number(purItem.purchasePrice),
                            // Metadata for UI
                            originalQty: originalPurchasedQty,
                            returnedQty: alreadyReturned
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
        // Trigger load logic
        loadItemsFromInvoice(purchase.id);
      }
    }
  }, [paramPurchaseId, purchases, products, existingReturns]);

  // --- HANDLERS ---
  
  const handleInvoiceChange = (e) => {
      const newId = e.target.value;
      setSelectedPurchaseId(newId);
      // Trigger load logic manually when user selects from dropdown
      loadItemsFromInvoice(newId);
  };

  const generateReturnRef = () => `RET-${Math.floor(100000 + Math.random() * 900000)}`;

  const getProductBatches = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.batchCode : [];
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

    const maxQty = Number(targetBatch.quantity || 0);

    const newItem = {
      id: product.id,
      productName: product.name,
      batchCode: targetBatch.batchCode,
      maxQuantity: maxQty, 
      quantity: 1, 
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
    } else if (field === "batchCode") {
      const product = products.find(p => p.id === item.id);
      const newBatch = product.batchCode.find(b => b.batchCode === value);
      if (newBatch) {
        item.batchCode = value;
        item.maxQuantity = Number(newBatch.quantity || 0);
        item.price = Number(newBatch.purchasePrice || 0);
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
  const isValid = returnItems.every(item => item.quantity > 0 && item.quantity <= item.maxQuantity);

  const handleSave = () => {
    if (!selectedSupplier) return alert("Please select a supplier.");
    if (returnItems.length === 0) return alert("Please add items to return.");
    if (!isValid) return alert("Please correct quantities in red.");

    const returnData = {
      id: uuidv4(),
      returnRefNo: generateReturnRef(),
      purchaseRefNo: returnMode === 'invoice' ? purchases.find(p => p.id === selectedPurchaseId)?.purchaseRefNo : 'Direct Return',
      peopleId: selectedSupplier, 
      returnDate: returnDate,    
      updatedAt: new Date().toISOString(),
      totalAmount: grandTotal,
      items: returnItems.map(item => ({
        id: item.id,
        productName: item.productName,
        batchCode: item.batchCode,
        quantity: Number(item.quantity),
        price: item.price,
        total: item.total
      })),
      paymentDetails: {
        cashReturn: Number(cashReturn),
        creditAdjustment: creditAdjustment
      }
    };

    // Update Stock
    returnItems.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        const updatedBatchCode = product.batchCode.map(batch => {
          if (batch.batchCode === item.batchCode) {
            return {
              ...batch,
              quantity: Number(batch.quantity) - Number(item.quantity)
            };
          }
          return batch;
        });
        updateProduct(product.id, { ...product, batchCode: updatedBatchCode });
      }
    });

    addPurchaseReturn(returnData);
    alert("Return Saved Successfully!");
    navigate('/return/purchase_return'); 
  };

  const filteredProducts = products.filter(p => 
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.nameInUrdu?.includes(searchQuery))
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
                  onChange={handleInvoiceChange} // UPDATED HANDLER
                  disabled={!!paramPurchaseId}
                >
                  <option value="">Select Invoice</option>
                  {supplierPurchases.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.purchaseRefNo} ({new Date(p.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                {/* Helper Text */}
                {selectedPurchaseId && (
                    <div className="text-xs text-green-600 mt-1 text-center">
                        ✓ Items loaded automatically
                    </div>
                )}
              </div>
            )}
          </div>

          {/* Manual Search (Only if items need to be added manually) */}
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
                            <div className="text-xs text-gray-500">Stock: {prod.batchCode.reduce((a,b) => a + Number(b.quantity), 0)}</div>
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
                      <th>Product</th>
                      <th>Batch</th>
                      <th className="w-28 text-center">Qty (Max)</th>
                      <th className="w-24 text-right">Price</th>
                      <th className="w-24 text-right">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.length > 0 ? returnItems.map((item, index) => {
                       const isQtyInvalid = Number(item.quantity) > item.maxQuantity || Number(item.quantity) <= 0;
                       return (
                        <tr key={index}>
                          <td>
                            <div className="font-bold text-sm">{item.productName}</div>
                            {returnMode === 'invoice' && (
                                <div className="text-[10px] text-gray-400">
                                    Orig: {item.originalQty} | Prev: {item.returnedQty}
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
                          <td>
                             <div className="relative">
                               <input 
                                 type="number" 
                                 className={`input input-bordered input-sm w-full text-center ${isQtyInvalid ? 'input-error text-red-600' : ''}`}
                                 value={item.quantity}
                                 onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                               />
                               <div className={`text-[10px] text-center mt-0.5 ${isQtyInvalid ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                 Max: {item.maxQuantity}
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
                      <tr><td colSpan="6" className="text-center py-10 text-gray-400">No items selected.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>

           <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Return Value:</span>
                    <span className="text-xl font-bold">Rs. {grandTotal.toFixed(2)}</span>
                 </div>
                 <div className="divider my-1"></div>
                 <div className="form-control">
                    <label className="label text-sm font-semibold">Cash Received</label>
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