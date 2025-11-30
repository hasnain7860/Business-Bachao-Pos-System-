import React, { useState, useEffect } from 'react';
import { FaSearch, FaTrash, FaArrowLeft, FaHistory } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import { v4 as uuidv4 } from 'uuid';
import { CalculateUserCredit } from '../Utils/CalculateUserCredit';
import { useParams, useNavigate } from "react-router-dom";

const AddSellReturn = () => {
  const context = useAppContext();
  const { id } = useParams();
  const navigate = useNavigate();

  // Data Contexts
  const salesData = context.SaleContext.data || [];
  const products = context.productContext.data || [];
  const peoples = context.peopleContext.data || [];
  const sellReturns = context.SellReturnContext.data || [];
  const units = context.unitContext.data || []; // <--- NEW: Access Unit Data
  
  const addReturn = context.SellReturnContext.add;
  const updateProduct = context.productContext.edit;

  // State
  const [salesRef, setSalesRef] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [addCustomProduct, setAddCustomProduct] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedPeople, setSelectedPeople] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  
  // Payment States
  const [customerCredit, setCustomerCredit] = useState(0);
  const [cashReturn, setCashReturn] = useState(0);
  const [creditAdjustment, setCreditAdjustment] = useState(0);

  // Load Sale by ID from URL
  useEffect(() => {
    if (id && salesData.length > 0) {
      const data = salesData.find((sale) => sale.id === id);
      if (data) {
        setSalesRef(data.salesRefNo);
        handleSaleSelect(data); 
      }
    }
  }, [id, salesData]);

  // Load Customer Credit
  useEffect(() => {
    if (selectedPeople) {
      const { pendingCredit } = CalculateUserCredit(context, selectedPeople);
      setCustomerCredit(pendingCredit);
    }
  }, [selectedPeople, context]);

  // Calculate Totals
  useEffect(() => {
    const total = returnItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setTotalAmount(total);
    setCreditAdjustment(total); 
    setCashReturn(0);
  }, [returnItems]);

  // --- HELPER: Get Unit Name by ID ---
  const getUnitName = (unitId) => {
    if (!unitId) return 'Unit';
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.name : 'Unit';
  };

  const handleSearch = (value) => {
    setSalesRef(value); 
    if(value.length > 0) {
        const filtered = salesData.filter((sale) =>
          (sale.salesRefNo || "").toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSales(filtered);
    } else {
        setFilteredSales([]);
    }
  };
  
  const handleSearchProduct = (value) => {
    setSelectedProduct(value); 
    if(value.length > 0){
        const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(value.toLowerCase())
        );
        setAddCustomProduct(filtered);
    } else {
        setAddCustomProduct([]);
    }
  };

  // --- CORE LOGIC: MAPPING ITEMS ---
  const handleSaleSelect = (sale) => {
    setSelectedSale(sale);
    
    const safeProducts = Array.isArray(sale.products) ? sale.products : [];

    const mappedItems = safeProducts.map((item) => {
      // 1. Fetch Product Master for reliable Unit IDs
      const productMaster = products.find(p => p.id === item.id);
      
      // Resolve Base Unit Name
      // Priority: Product Master ID -> Sale Item ID -> 'Pcs'
      const baseUnitId = productMaster?.unitId || item.unitId;
      const baseUnitName = getUnitName(baseUnitId);

      // Resolve Secondary Unit Name
      const secondaryUnitId = productMaster?.secondaryUnitId || item.secondaryUnitId;
      const secondaryUnitName = getUnitName(secondaryUnitId);
      
      const convRate = Number(item.conversionRate) || 1;
      
      // Logic: Only show secondary option if Conversion > 1 AND a valid secondary unit ID exists
      const hasSecondaryUnit = convRate > 1 && secondaryUnitId;

      // 2. Get Totals in BASE UNITS
      const originalSoldQtyBase = Number(item.SellQuantity || 0); 

      // 3. Calculate Previously Returned Qty (Normalized to Base Units)
      let alreadyReturnedBase = 0;
      const relatedReturns = sellReturns.filter(r => r.salesRef === sale.salesRefNo);
      relatedReturns.forEach(returnDoc => {
        if(returnDoc.items && Array.isArray(returnDoc.items)){
            const matchedItem = returnDoc.items.find(rItem => rItem.id === item.id);
            if (matchedItem) {
                 alreadyReturnedBase += Number(matchedItem.quantity || 0); 
            }
        }
      });

      const remainingQtyBase = originalSoldQtyBase - alreadyReturnedBase;
      const pricePerBase = Number(item.newSellPrice || item.sellPrice || 0);

      return {
        id: item.id,
        batchCode: item.batchCode,
        productName: item.name,
        
        // Stock Logic
        originalSoldQtyBase,
        alreadyReturnedBase,
        remainingQtyBase: remainingQtyBase < 0 ? 0 : remainingQtyBase,
        
        // Unit Conversion Logic
        conversionRate: convRate,
        hasSecondaryUnit: hasSecondaryUnit, 
        
        currentUnitMode: 'base', // Default to base
        baseUnitName: baseUnitName,
        secondaryUnitName: secondaryUnitName,
        
        // Input State
        inputQty: '', 
        pricePerBaseUnit: pricePerBase,
        total: 0,
      };
    });

    setReturnItems(mappedItems);
    setFilteredSales([]);

    const matchedPeople = peoples.find(people => people.id === sale.personId);
    if (matchedPeople) {
      setSelectedPeople(matchedPeople.id);
    }
  };

  // --- HANDLE MANUAL ADD ---
  const handleAddCustomProduct = (product, batch) => {
    const alreadyAdded = returnItems.some((item) => item.id === product.id && item.batchCode === batch.batchCode);
    if (alreadyAdded) return alert("Item already added");

    const convRate = Number(product.conversionRate || 1);
    const secondaryUnitId = product.secondaryUnitId;
    const hasSecondaryUnit = convRate > 1 && secondaryUnitId;

    // Resolve Names from Context using IDs from Product Object
    const baseUnitName = getUnitName(product.unitId);
    const secondaryUnitName = getUnitName(secondaryUnitId);

    const newItem = {
      id: product.id,
      batchCode: batch.batchCode,
      productName: `${product.name} (Batch: ${batch.batchCode})`,
      
      originalSoldQtyBase: 999999,
      alreadyReturnedBase: 0,
      remainingQtyBase: 999999,
      
      conversionRate: convRate,
      hasSecondaryUnit: hasSecondaryUnit,

      currentUnitMode: 'base',
      baseUnitName: baseUnitName,
      secondaryUnitName: secondaryUnitName,

      inputQty: 1,
      pricePerBaseUnit: Number(batch.sellPrice || 0),
      total: Number(batch.sellPrice || 0),
    };

    setReturnItems([...returnItems, newItem]);
    setAddCustomProduct([]);
    setSelectedProduct('');
  };

  // --- UI HANDLERS ---
  const handleUnitChange = (index, newMode) => {
    const newItems = [...returnItems];
    const item = newItems[index];
    
    item.currentUnitMode = newMode;
    item.inputQty = ''; 
    item.total = 0;
    
    setReturnItems(newItems);
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...returnItems];
    const item = newItems[index];
    
    if (value === '') {
        item.inputQty = '';
        item.total = 0;
        setReturnItems(newItems);
        return;
    }

    const val = Number(value);
    item.inputQty = val;

    if (item.currentUnitMode === 'secondary') {
        item.total = val * (item.pricePerBaseUnit * item.conversionRate);
    } else {
        item.total = val * item.pricePerBaseUnit;
    }
    
    setReturnItems(newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = returnItems.filter((_, i) => i !== index);
    setReturnItems(newItems);
  };

  // --- VALIDATION & SUBMIT ---
  const validateItem = (item) => {
      const input = Number(item.inputQty || 0);
      let quantityInBase = input;
      
      if (item.currentUnitMode === 'secondary') {
          quantityInBase = input * item.conversionRate;
      }

      // Allow 0.001 tolerance for float math
      if (quantityInBase > (item.remainingQtyBase + 0.001)) return false;
      if (quantityInBase < 0) return false;
      return true;
  };

  const isValid = returnItems.every(validateItem);
  const activeItems = returnItems.filter(i => Number(i.inputQty) > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPeople) return alert("Select Customer");
    if (activeItems.length === 0) return alert("No items to return");
    if (!isValid) return alert("Check quantities. You are returning more than available.");
    
    if (Math.abs((Number(creditAdjustment) + Number(cashReturn)) - totalAmount) > 1) {
       return alert("Credit Adjustment + Cash Return must equal Total Refund Amount.");
    }

    const returnRefNo = `RET-${uuidv4().slice(0, 8).toUpperCase()}`;

    const processedItems = activeItems.map(i => {
          let quantityInBase = Number(i.inputQty);
          let unitNameUsed = i.baseUnitName;

          if (i.currentUnitMode === 'secondary') {
              quantityInBase = Number(i.inputQty) * Number(i.conversionRate);
              unitNameUsed = i.secondaryUnitName;
          }

          return {
              id: i.id,
              batchCode: i.batchCode,
              productName: i.productName,
              displayQuantity: Number(i.inputQty), 
              unitName: unitNameUsed,
              quantity: quantityInBase, // STORE BASE UNITS
              total: Number(i.total)
          };
    });

    const returnData = {
      id: uuidv4(),
      returnRefNo,
      salesRef: selectedSale?.salesRefNo || 'Direct Return',
      peopleId: selectedPeople,
      items: processedItems, 
      totalAmount,
      returnDate: new Date().toISOString(),
      paymentDetails: {
        creditAdjustment: Number(creditAdjustment),
        cashReturn: Number(cashReturn),
        previousCreditBalance: customerCredit,
        newCreditBalance: customerCredit - Number(creditAdjustment)
      }
    };

    // Update Stock
    for (const returnItem of processedItems) {
      const product = products.find(p => p.id === returnItem.id);
      if (product) {
        const safeBatches = Array.isArray(product.batchCode) ? product.batchCode : [];
        const updatedBatchCode = safeBatches.map(batch => {
            if (batch.batchCode === returnItem.batchCode) {
                return {
                    ...batch,
                    quantity: Number(batch.quantity || 0) + Number(returnItem.quantity)
                };
            }
            return batch;
        });
        await updateProduct(product.id, { ...product, batchCode: updatedBatchCode });
      }
    }

    await addReturn(returnData);
    alert("Return Processed Successfully");
    navigate(-1); 
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle btn-sm">
                     <FaArrowLeft />
                 </button>
                 <h1 className="text-xl font-bold text-gray-800">Sales Return</h1>
             </div>
             {selectedSale && (
                 <div className="badge badge-primary badge-outline font-mono">
                     Ref: {selectedSale.salesRefNo}
                 </div>
             )}
          </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Search Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="card bg-white shadow-sm border border-gray-200">
                <div className="card-body p-4">
                    <label className="label pt-0"><span className="label-text font-bold text-gray-500">Find Bill</span></label>
                    <div className="relative">
                        <input
                        type="text"
                        placeholder="Scan or Enter Sale Ref No..."
                        className="input input-bordered w-full font-mono text-gray-900"
                        value={salesRef}
                        onChange={(e) => handleSearch(e.target.value)}
                        />
                        <div className="absolute right-2 top-2 text-gray-400"><FaSearch /></div>
                        
                        {filteredSales.length > 0 && (
                            <ul className="absolute top-full left-0 bg-white w-full rounded-b-lg shadow-xl max-h-60 overflow-y-auto z-50 border border-gray-100">
                            {filteredSales.map((sale) => (
                                <li key={sale.id} className="border-b last:border-b-0">
                                <button className="w-full text-left p-3 hover:bg-blue-50 transition-colors" onClick={() => handleSaleSelect(sale)}>
                                    <div className="font-bold text-blue-600">{sale.salesRefNo}</div>
                                    <div className="text-xs text-gray-500 flex justify-between">
                                        <span>Rs. {sale.totalBill}</span>
                                        <span>{new Date(sale.dateTime).toLocaleDateString()}</span>
                                    </div>
                                </button>
                                </li>
                            ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <div className="card bg-white shadow-sm border border-gray-200">
                 <div className="card-body p-4">
                    <label className="label pt-0"><span className="label-text font-bold text-gray-500">Customer</span></label>
                    <select 
                        className="select select-bordered w-full text-gray-900" 
                        value={selectedPeople} 
                        onChange={(e) => setSelectedPeople(e.target.value)}
                    >
                        <option value="">Select Customer</option>
                        {peoples.map((people) => (
                        <option key={people.id} value={people.id}>{people.name}</option>
                        ))}
                    </select>
                 </div>
            </div>
        </div>

        {/* Manual Add (Only if no bill selected) */}
        {!selectedSale && (
             <div className="collapse collapse-arrow border border-base-300 bg-white mb-6">
                <input type="checkbox" /> 
                <div className="collapse-title text-sm font-medium text-gray-500">
                    Cannot find bill? Add Product Manually
                </div>
                <div className="collapse-content"> 
                     <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search Product Name..." 
                            className="input input-bordered w-full text-gray-900"
                            value={selectedProduct} 
                            onChange={(e) => handleSearchProduct(e.target.value)} 
                        />
                        {addCustomProduct.length > 0 && (
                            <ul className="absolute top-full left-0 bg-white w-full rounded-box mt-1 shadow-lg border border-gray-200 z-50">
                                {addCustomProduct.map((product) => (
                                    product.batchCode?.map((batch) => (
                                    <li key={`${product.id}-${batch.batchCode}`} className="border-b">
                                        <button className="w-full text-left p-3 hover:bg-gray-50" onClick={() => handleAddCustomProduct(product, batch)}>
                                            <div className="font-bold text-gray-800">{product.name}</div>
                                            <div className="text-xs text-gray-500">Batch: {batch.batchCode} | Price: {batch.sellPrice}</div>
                                        </button>
                                    </li>
                                    ))
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ITEMS TABLE */}
        <div className="card bg-white shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="overflow-x-auto">
                <table className="table w-full">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                    <th className="w-[30%]">Product Details</th>
                    <th className="text-center">History (Base)</th>
                    <th className="text-center">Return Qty</th>
                    <th className="text-right">Return Amount</th>
                    <th className="w-10"></th>
                    </tr>
                </thead>
                <tbody>
                    {returnItems.map((item, index) => {
                        const isSecondary = item.currentUnitMode === 'secondary';
                        const currentReturnInBase = isSecondary ? (Number(item.inputQty) * item.conversionRate) : Number(item.inputQty);
                        
                        // Safety tolerance for floating point math
                        const isError = currentReturnInBase > (item.remainingQtyBase + 0.001);
                        
                        return (
                            <tr key={`${item.id}-${index}`} className="group hover:bg-gray-50 border-b last:border-0">
                                {/* Product Info */}
                                <td className="align-top py-3">
                                    <div className="font-bold text-gray-900 text-base">{item.productName}</div>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <span className="badge badge-xs badge-ghost py-2">{item.batchCode}</span>
                                        <span className="text-xs text-gray-500">Rate: {item.pricePerBaseUnit} / {item.baseUnitName}</span>
                                    </div>
                                    {item.hasSecondaryUnit && (
                                        <div className="text-[10px] text-blue-600 font-medium mt-1">
                                            1 {item.secondaryUnitName} = {item.conversionRate} {item.baseUnitName}
                                        </div>
                                    )}
                                </td>

                                {/* History / Remaining */}
                                <td className="align-top py-3 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="text-[10px] text-gray-400">AVAILABLE TO RETURN</div>
                                        <div className="font-mono text-xl font-bold text-green-700 leading-none mt-1">
                                            {item.remainingQtyBase} 
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-bold">{item.baseUnitName}</div>
                                        
                                        <div className="text-[10px] text-gray-400 mt-1">
                                            Sold: {item.originalSoldQtyBase} | Ret: {item.alreadyReturnedBase}
                                        </div>
                                    </div>
                                </td>

                                {/* Input Section */}
                                <td className="align-top py-3">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="join shadow-sm border border-gray-300 rounded-lg">
                                            <input
                                                type="number"
                                                className={`join-item input input-sm w-20 text-center font-bold text-lg h-10 ${isError ? 'input-error text-red-600 bg-red-50' : 'text-gray-900 bg-white'}`}
                                                placeholder="0"
                                                value={item.inputQty}
                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                min="0"
                                            />
                                            
                                            {item.hasSecondaryUnit ? (
                                                <select 
                                                    className="join-item select select-sm bg-gray-100 text-gray-800 font-bold w-24 px-2 h-10 border-l border-gray-300 focus:outline-none"
                                                    value={item.currentUnitMode}
                                                    onChange={(e) => handleUnitChange(index, e.target.value)}
                                                >
                                                    <option value="base">{item.baseUnitName}</option>
                                                    <option value="secondary">{item.secondaryUnitName}</option>
                                                </select>
                                            ) : (
                                                <div className="join-item flex items-center justify-center bg-gray-100 px-3 text-xs font-bold text-gray-600 min-w-[3rem] h-10 border-l border-gray-300">
                                                    {item.baseUnitName}
                                                </div>
                                            )}
                                        </div>
                                        {isError && (
                                            <span className="text-[10px] text-red-600 font-bold animate-pulse">
                                                Exceeds Limit ({Math.floor(item.remainingQtyBase / (isSecondary ? item.conversionRate : 1))} max)
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Total Price */}
                                <td className="align-top py-3 text-right">
                                    <div className="font-bold text-gray-900 text-lg">
                                        {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </td>

                                {/* Delete */}
                                <td className="align-middle text-center">
                                    <button 
                                        onClick={() => handleRemoveItem(index)}
                                        className="btn btn-ghost btn-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    
                    {returnItems.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center py-10 text-gray-400">
                                <div className="flex flex-col items-center">
                                    <FaHistory className="text-4xl mb-2 opacity-20" />
                                    <p>No items added for return.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
        </div>

        {/* BOTTOM ACTION BAR - FIXED */}
        {returnItems.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-3 z-40">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
                    
                    {/* Totals */}
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Refund</div>
                            <div className="text-2xl font-black text-primary leading-none">
                                {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        
                        {/* Inline Adjustments for Desktop */}
                        <div className="hidden md:flex gap-2">
                             <div className="form-control w-32">
                                <label className="label py-0 h-4"><span className="label-text text-[9px] font-bold text-gray-500 uppercase">Credit Adj.</span></label>
                                <input type="number" className="input input-bordered input-sm font-mono text-right" value={creditAdjustment} 
                                    onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setCreditAdjustment(val);
                                        if(val <= totalAmount) setCashReturn(totalAmount - val);
                                    }} 
                                />
                             </div>
                             <div className="form-control w-32">
                                <label className="label py-0 h-4"><span className="label-text text-[9px] font-bold text-gray-500 uppercase">Cash Back</span></label>
                                <input type="number" className="input input-bordered input-sm font-mono text-right" value={cashReturn} 
                                    onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setCashReturn(val);
                                        if(val <= totalAmount) setCreditAdjustment(totalAmount - val);
                                    }} 
                                />
                             </div>
                        </div>
                    </div>

                    {/* Mobile Only Adjustments */}
                    <div className="grid grid-cols-2 gap-2 w-full md:hidden">
                         <div className="form-control">
                            <label className="label py-0 h-4"><span className="label-text text-[9px] font-bold text-gray-500">CREDIT ADJ.</span></label>
                            <input type="number" className="input input-bordered input-sm w-full font-mono" value={creditAdjustment} 
                                onChange={e => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setCreditAdjustment(val);
                                    if(val <= totalAmount) setCashReturn(totalAmount - val);
                                }} 
                            />
                         </div>
                         <div className="form-control">
                            <label className="label py-0 h-4"><span className="label-text text-[9px] font-bold text-gray-500">CASH BACK</span></label>
                            <input type="number" className="input input-bordered input-sm w-full font-mono" value={cashReturn} 
                                onChange={e => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setCashReturn(val);
                                    if(val <= totalAmount) setCreditAdjustment(totalAmount - val);
                                }} 
                            />
                         </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        className="btn btn-primary w-full md:w-auto px-10 font-bold text-white shadow-lg uppercase tracking-wide"
                        disabled={!isValid || activeItems.length === 0}
                        onClick={handleSubmit}
                    >
                        Confirm Return
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AddSellReturn;


