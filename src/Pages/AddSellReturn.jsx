import React, { useState, useEffect } from 'react';
import { FaSearch, FaTrash, FaPlus } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import { v4 as uuidv4 } from 'uuid';
import { CalculateUserCredit } from '../Utils/CalculateUserCredit';
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

const AddSellReturn = () => {
  const context = useAppContext();
  const { id } = useParams();
  const navigate = useNavigate();

  // --- CRITICAL FIX: Universal Store Mapping ---
  // Access .data, not specific names
  const salesData = context.SaleContext.data || [];
  const products = context.productContext.data || [];
  const peoples = context.peopleContext.data || [];
  const sellReturns = context.SellReturnContext.data || [];
  
  const addReturn = context.SellReturnContext.add;
  const updateProduct = context.productContext.edit;

  const [salesRef, setSalesRef] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [addCustomProduct, setAddCustomProduct] = useState([])
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedPeople, setSelectedPeople] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('');
  
  const [customerCredit, setCustomerCredit] = useState(0);
  const [cashReturn, setCashReturn] = useState(0);
  const [creditAdjustment, setCreditAdjustment] = useState(0);


  useEffect(() => {
    if (id && salesData.length > 0) {
      const data = salesData.find((sale) => sale.id === id)
      if (data) {
        setSalesRef(data.salesRefNo);
        handleSaleSelect(data); 
      }
    }
  }, [id, salesData]);


  useEffect(() => {
    if (selectedPeople) {
      const { pendingCredit } = CalculateUserCredit(context, selectedPeople);
      setCustomerCredit(pendingCredit);
    }
  }, [selectedPeople, context]); // Added context dependency


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

  const handleSaleSelect = (sale) => {
    setSelectedSale(sale);
    
    // Safety check for sale.products
    const safeProducts = Array.isArray(sale.products) ? sale.products : [];

    const mappedItems = safeProducts.map((item) => {
      // 1. Calculate Remaining Qty (IN BASE UNITS - PIECES)
      let remainingQtyInPieces = Number(item.SellQuantity || 0); 

      // Subtract items already returned
      const relatedReturns = sellReturns.filter(r => r.salesRef === sale.salesRefNo);
      relatedReturns.forEach(returnDoc => {
        if(returnDoc.items && Array.isArray(returnDoc.items)){
            returnDoc.items.forEach(returnItem => {
               if (returnItem.id === item.id) {
                 // Return Item quantity should be in Base Units in DB
                 const retQty = Number(returnItem.quantity || 0); 
                 remainingQtyInPieces -= retQty;
               }
            });
        }
      });

      // 2. Determine Display Mode
      const convRate = Number(item.conversionRate) || 1;
      
      // 3. Calculate Max Display Qty
      const maxDisplayQty = remainingQtyInPieces / convRate; 

      return {
        id: item.id,
        batchCode: item.batchCode,
        productName: item.name,
        
        // Unit Info
        unitMode: item.unitMode || 'base',
        unitName: item.unitName || 'Pcs',
        conversionRate: convRate,
        
        // Quantities
        quantity: 0, 
        maxDisplayQuantity: maxDisplayQty < 0 ? 0 : maxDisplayQty, // Prevent negative
        
        // Price (Per Display Unit)
        price: Number(item.newSellPrice || item.sellPrice || 0),
        
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

  // Calculate totals
  useEffect(() => {
    const total = returnItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setTotalAmount(total);
    
    setCreditAdjustment(total); 
    setCashReturn(0);
    
  }, [returnItems]);


  const handleAddCustomProduct = (product, batch) => {
    const alreadyAdded = returnItems.some((item) => item.id === product.id && item.batchCode === batch.batchCode);

    if (alreadyAdded) {
      alert("This product is already added!");
      return;
    }

    const newItem = {
      id: product.id,
      batchCode: batch.batchCode,
      productName: `${product.name} (Batch: ${batch.batchCode})`,
      
      unitMode: 'base',
      unitName: 'Pcs',
      conversionRate: 1,

      quantity: 1,
      maxDisplayQuantity: Number.POSITIVE_INFINITY, 
      
      price: Number(batch.sellPrice || 0), 
      total: Number(batch.sellPrice || 0) * 1,
    };

    setReturnItems([...returnItems, newItem]);
    setAddCustomProduct([])
    setSelectedProduct('');
  };


  const handleRemoveItem = (index) => {
    const newItems = returnItems.filter((_, i) => i !== index);
    setReturnItems(newItems);
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...returnItems];
    const item = newItems[index];
    
    const val = value === "" ? "" : Number(value);
    
    item.quantity = val;
    item.total = (Number(val) || 0) * item.price;
    
    setReturnItems(newItems);
  };

  // Validation Check
  const isValid = returnItems.every(item => {
      const qty = Number(item.quantity);
      if(qty === 0 && returnItems.length > 1) return true; 
      if(qty < 0) return false;
      return qty <= (item.maxDisplayQuantity + 0.001);
  });
  
  const activeItems = returnItems.filter(i => Number(i.quantity) > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPeople) return alert("Please select a person for the return");
    if (activeItems.length === 0) return alert("Please enter return quantity for at least one item");
    if (!isValid) return alert("Quantity exceeds refundable amount.");
    
    if (Math.abs((Number(creditAdjustment) + Number(cashReturn)) - totalAmount) > 1) {
      alert("Credit adjustment and cash return must equal total return amount");
      return;
    }

    const returnRefNo = `RET-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Prepare Items for Storage (Base Units)
    const processedItems = activeItems.map(i => ({
          id: i.id,
          batchCode: i.batchCode,
          productName: i.productName,
          displayQuantity: Number(i.quantity), 
          unitName: i.unitName,
          quantity: Number(i.quantity) * Number(i.conversionRate), 
          total: Number(i.total)
    }));

    const returnData = {
      id: uuidv4(),
      returnRefNo,
      salesRef: selectedSale?.salesRefNo || 'Direct Return',
      peopleId: selectedPeople,
      items: processedItems, 
      totalAmount,
      returnDate: new Date().toISOString(), // Standardize date format
      paymentDetails: {
        creditAdjustment: Number(creditAdjustment),
        cashReturn: Number(cashReturn),
        previousCreditBalance: customerCredit,
        newCreditBalance: customerCredit - Number(creditAdjustment)
      }
    };

    // Stock Update Logic
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
    alert("Sales Return Processed Successfully");
    navigate(-1); 
  };

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen pb-20">
      <div className="text-2xl font-bold mb-6 text-gray-800">Add Sales Return</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Sales Reference Search */}
        <div className="form-control relative">
          <label className="label">
            <span className="label-text font-semibold">Sales Reference Number</span>
          </label>
          <div className="input-group flex">
            <input
              type="text"
              placeholder="Search sales ref..."
              className="input input-bordered w-full"
              value={salesRef}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <button className="btn btn-square btn-primary">
              <FaSearch />
            </button>
          </div>
          {filteredSales.length > 0 && (
            <ul className="absolute top-full left-0 bg-white w-full rounded-box mt-1 shadow-xl max-h-60 overflow-y-auto z-50 border border-gray-200">
              {filteredSales.map((sale) => (
                <li key={sale.id} className="border-b last:border-b-0">
                  <a className="block p-3 hover:bg-gray-100 cursor-pointer" onClick={() => handleSaleSelect(sale)}>
                    <div className="font-bold text-primary">{sale.salesRefNo}</div>
                    <div className="text-xs text-gray-500">Bill: {sale.totalBill} | Date: {new Date(sale.dateTime).toLocaleDateString()}</div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Customer Selection */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Customer</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={selectedPeople}
            onChange={(e) => setSelectedPeople(e.target.value)}
          >
            <option value="">Select Customer</option>
            {peoples.map((people) => (
              <option key={people.id} value={people.id}>
                {people.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Custom Product */}
      {!selectedSale && (
        <div className="card bg-base-100 shadow-sm border border-gray-200 mt-4 mb-8">
          <div className="card-body p-4">
            <h2 className="card-title text-base text-gray-700">Add Product Manually (Without Bill Ref)</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search product name..."
                className="input input-bordered w-full"
                value={selectedProduct}
                onChange={(e) => handleSearchProduct(e.target.value)}
              />
              {addCustomProduct.length > 0 && (
                <ul className="absolute top-full left-0 bg-white w-full rounded-box mt-1 shadow-xl max-h-48 overflow-y-auto border border-gray-200 z-50">
                  {addCustomProduct.map((product) => (
                    product.batchCode && product.batchCode.length > 0 &&
                    product.batchCode.map((batch) => (
                      <li key={`${product.id}-${batch.batchCode}`} className="border-b last:border-b-0">
                        <a className="block p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleAddCustomProduct(product, batch)}>
                          <span className="font-semibold">{product.name}</span> 
                          <span className="text-xs text-gray-500 ml-2">(Batch: {batch.batchCode})</span>
                        </a>
                      </li>
                    ))
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return Items Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg mb-8 border border-gray-200">
        <table className="table w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="w-1/3">Product</th>
              <th className="text-center">Unit</th>
              <th className="text-center">Available</th>
              <th className="text-center w-24">Return Qty</th>
              <th className="text-right">Refund Rate</th>
              <th className="text-right">Total</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {returnItems.map((item, index) => {
               const isQtyInvalid = Number(item.quantity) > item.maxDisplayQuantity || Number(item.quantity) < 0;
               
               return (
                <tr key={`${item.id}-${index}`} className="hover:bg-gray-50">
                    <td>
                        <div className="font-bold text-gray-800">{item.productName}</div>
                        <div className="text-xs text-gray-500 badge badge-ghost badge-sm mt-1">{item.batchCode}</div>
                    </td>
                    
                    <td className="text-center font-bold text-blue-600">
                        {item.unitName}
                    </td>

                    <td className="text-center text-gray-600">
                        {Number(item.maxDisplayQuantity).toFixed(2)}
                    </td>

                    <td className="text-center">
                        <input
                            type="number"
                            className={`input input-bordered w-24 input-sm text-center font-bold ${isQtyInvalid ? 'input-error text-red-600' : ''}`}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                        />
                    </td>
                    
                    <td className="text-right">
                        {item.price.toFixed(2)}
                    </td>
                    
                    <td className="text-right font-bold text-gray-800">
                        {item.total.toFixed(2)}
                    </td>
                    
                    <td className="text-center">
                        <button
                            className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50"
                            onClick={() => handleRemoveItem(index)}
                        >
                            <FaTrash />
                        </button>
                    </td>
                </tr>
               );
            })}
            {returnItems.length === 0 && (
                <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">
                        No items added. Search a Sales Reference or add manually.
                    </td>
                </tr>
            )}
          </tbody>
          {returnItems.length > 0 && (
            <tfoot className="bg-gray-50">
                <tr>
                <td colSpan="5" className="text-right font-bold text-lg pt-4">Total Refund Amount:</td>
                <td colSpan="2" className="font-bold text-xl text-primary pt-4 pr-4">{totalAmount.toFixed(2)}</td>
                </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Return Payment Details */}
      {returnItems.length > 0 && (
          <div className="card bg-base-100 shadow-lg border border-gray-200">
            <div className="card-body">
            <h2 className="card-title text-gray-700 border-b pb-2 mb-4">Refund Settlement</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-gray-600">Total Return Value</span></label>
                    <div className="text-2xl font-bold text-gray-800 px-1">Rs. {totalAmount.toFixed(2)}</div>
                </div>
                
                <div className="form-control">
                    <label className="label"><span className="label-text font-semibold text-gray-600">Credit Adjustment (Udhaar Kaato)</span></label>
                    <input
                        type="number"
                        value={creditAdjustment}
                        onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setCreditAdjustment(val);
                            const numVal = Number(val);
                            if(numVal <= totalAmount) {
                                setCashReturn(totalAmount - numVal);
                            }
                        }}
                        className="input input-bordered w-full font-bold text-blue-700"
                    />
                    <label className="label">
                        <span className="label-text-alt text-gray-500">Decreases customer's due balance</span>
                    </label>
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text font-semibold text-gray-600">Cash Return (Nagad Wapis)</span></label>
                    <input
                        type="number"
                        value={cashReturn}
                        onChange={(e) => {
                             const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                             setCashReturn(val);
                             const numVal = Number(val);
                             if(numVal <= totalAmount) {
                                setCreditAdjustment(totalAmount - numVal);
                             }
                        }}
                        className="input input-bordered w-full font-bold text-green-700"
                    />
                    <label className="label">
                        <span className="label-text-alt text-gray-500">Cash given back to customer</span>
                    </label>
                </div>
            </div>

            <div className="alert alert-info mt-6 bg-blue-50 border-blue-100 text-blue-800 text-sm">
                <div className="flex flex-col sm:flex-row w-full justify-between">
                    <span><strong>Current Balance:</strong> {customerCredit.toFixed(2)}</span>
                    <span><strong>New Balance:</strong> {(customerCredit - Number(creditAdjustment)).toFixed(2)}</span>
                </div>
            </div>
            
            <div className="mt-6">
                {!isValid && <div className="text-red-500 text-sm mb-2 text-center font-bold bg-red-50 p-2 rounded">Cannot submit: Return quantity exceeds sold quantity.</div>}
                
                <button
                className="btn btn-primary w-full btn-lg text-white shadow-md hover:shadow-lg transition-all"
                onClick={handleSubmit}
                disabled={!isValid || activeItems.length === 0}
                >
                Confirm Return & Update Stock
                </button>
            </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AddSellReturn;

