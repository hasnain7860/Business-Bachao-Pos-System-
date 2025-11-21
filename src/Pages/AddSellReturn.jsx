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

  const [salesRef, setSalesRef] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [addCustomProduct, setAddCustomProduct] = useState([])
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedPeople, setSelectedPeople] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('');
  
  const [customerCredit, setCustomerCredit] = useState(0);

  const addReturn = context.SellReturnContext.add
  const sellReturns = context.SellReturnContext.sellReturns

  // Sample data (replace with your actual data)
  const salesData = context.SaleContext.Sales;
  const products = context.productContext.products;
  const updateProduct = context.productContext.edit;
  const peoples = context.peopleContext.people;
  const [cashReturn, setCashReturn] = useState(0);
  const [creditAdjustment, setCreditAdjustment] = useState(0);


  useEffect(() => {
    if (id) {
      const data = salesData.find((sale) => sale.id === id)
      if (data) {
        setSalesRef(data.salesRefNo);
        handleSaleSelect(data); // Reuse the selection logic
      }
    }
  }, [id, salesData]);


  useEffect(() => {
    if (selectedPeople) {
      const { pendingCredit } = CalculateUserCredit(context, selectedPeople);
      setCustomerCredit(pendingCredit);
    }
  }, [selectedPeople]);


  const handleSearch = (value) => {
    const filtered = salesData.filter((sale) =>
      sale.salesRefNo.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSales(filtered);
  };
  
  const handleSearchProduct = (value) => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(value.toLowerCase())
    );
    setAddCustomProduct(filtered);
  };

  const handleSaleSelect = (sale) => {
    setSelectedSale(sale);
    
    // Map items from the sale
    const mappedItems = sale.products.map((item) => {
      // Calculate remaining returnable quantity
      const saleReturns = sellReturns.filter(r => r.salesRef === sale.salesRefNo);
      let remainingQty = Number(item.SellQuantity);

      saleReturns.forEach(returnDoc => {
        returnDoc.items.forEach(returnItem => {
          if (returnItem.id === item.id) { // Ideally check batchCode too if possible
            remainingQty -= Number(returnItem.quantity);
          }
        });
      });

      return {
        id: item.id,
        batchCode: item.batchCode, // Keep batch code for stock update
        productName: item.name,
        quantity: 1, // Default return quantity
        maxQuantity: Math.max(0, remainingQty),
        price: Number(item.newSellPrice),
        total: Number(item.newSellPrice) * 1,
      };
    });

    // Filter out items that have 0 remaining quantity? Optional.
    // For now, keeping them but maxQuantity will be 0.
    setReturnItems(mappedItems);
    
    setSalesRef('');
    setFilteredSales([]);

    const matchedPeople = peoples.find(people => people.id === sale.personId);
    if (matchedPeople) {
      setSelectedPeople(matchedPeople.id);
    }
  };

  // Calculate totals whenever items change
  useEffect(() => {
    const total = returnItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    setTotalAmount(total);
    
    // Auto-adjust cash/credit logic if needed, or reset
    if(creditAdjustment + cashReturn !== total) {
        setCreditAdjustment(total); // Default to full credit adjustment
        setCashReturn(0);
    }
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
      quantity: 1,
      maxQuantity: Number.POSITIVE_INFINITY, // Custom add usually has no limit linked to a specific sale
      price: Number(batch.sellPrice),
      total: Number(batch.sellPrice) * 1,
    };

    setReturnItems([...returnItems, newItem]);
    setAddCustomProduct([])
    setSelectedProduct('');
  };


  const handleRemoveItem = (index) => {
    const newItems = returnItems.filter((_, i) => i !== index);
    setReturnItems(newItems);
  };

  // --- FIXED INPUT HANDLER ---
  const handleQuantityChange = (index, value) => {
    const newItems = [...returnItems];
    const item = newItems[index];
    
    // Allow empty string or any number
    const val = value === "" ? "" : Number(value);
    
    item.quantity = val;
    item.total = (Number(val) || 0) * item.price;
    
    setReturnItems(newItems);
  };

  // Validation Check
  const isValid = returnItems.every(item => Number(item.quantity) > 0 && Number(item.quantity) <= item.maxQuantity);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedPeople) return alert("Please select a person for the return");
    if (returnItems.length === 0) return alert("Please add items to return");
    if (!isValid) return alert("Please fix quantities marked in red (cannot exceed sold/remaining quantity).");
    
    if (Math.abs((creditAdjustment + cashReturn) - totalAmount) > 0.01) {
      alert("Credit adjustment and cash return must equal total return amount");
      return;
    }

    const returnRefNo = `RET-${uuidv4().slice(0, 8).toUpperCase()}`;

    const returnData = {
      id: uuidv4(),
      returnRefNo,
      salesRef: selectedSale?.salesRefNo || 'Direct Return',
      peopleId: selectedPeople,
      items: returnItems.map(i => ({
          ...i,
          quantity: Number(i.quantity),
          total: Number(i.total)
      })),
      totalAmount,
      returnDate: new Date(),
      paymentDetails: {
        creditAdjustment,
        cashReturn,
        previousCreditBalance: customerCredit,
        newCreditBalance: customerCredit - creditAdjustment
      }
    };

    // Stock Update Logic (Add Qty Back)
    returnItems.forEach(returnItem => {
      const product = products.find(p => p.id === returnItem.id);
      if (product) {
        const updatedBatchCode = product.batchCode.map(batch => {
            // Strict batch matching
            if (batch.batchCode === returnItem.batchCode) {
                return {
                    ...batch,
                    quantity: Number(batch.quantity) + Number(returnItem.quantity)
                };
            }
            return batch;
        });
        updateProduct(product.id, { ...product, batchCode: updatedBatchCode });
      }
    });

    addReturn(returnData);
    alert("Sales Return Processed Successfully");
    navigate(-1); // Go back
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="text-2xl font-bold mb-6">Add Sales Return</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Sales Reference Search */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Sales Reference Number</span>
          </label>
          <div className="input-group">
            <input
              type="text"
              placeholder="Search sales reference"
              className="input input-bordered w-full"
              value={salesRef}
              onChange={(e) => {
                setSalesRef(e.target.value);
                handleSearch(e.target.value);
              }}
            />
            <button className="btn btn-square">
              <FaSearch />
            </button>
          </div>
          {filteredSales.length > 0 && (
            <ul className="menu bg-base-100 w-full rounded-box mt-2 shadow max-h-48 overflow-y-auto z-10">
              {filteredSales.map((sale) => (
                <li key={sale.id}>
                  <a onClick={() => handleSaleSelect(sale)}>
                    {sale.salesRefNo} - {sale.totalBill}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Customer Selection */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">People</span>
          </label>
          <select
            className="select select-bordered w-full"
            value={selectedPeople}
            onChange={(e) => setSelectedPeople(e.target.value)}
          >
            <option value="">Select People</option>
            {peoples.map((people) => (
              <option key={people.id} value={people.id}>
                {people.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Custom Product (Only if no sale selected) */}
      {!selectedSale && (
        <div className="card bg-base-100 shadow-sm border mt-6 mb-6">
          <div className="card-body p-4">
            <h2 className="card-title text-lg">Add Custom Product</h2>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="Search product name..."
                className="input input-bordered w-full"
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  handleSearchProduct(e.target.value);
                }}
              />
              {addCustomProduct.length > 0 && (
                <ul className="menu bg-base-100 w-full rounded-box mt-2 shadow max-h-48 overflow-y-auto border">
                  {addCustomProduct.map((product) => (
                    product.batchCode && product.batchCode.length > 0 &&
                    product.batchCode.map((batch) => (
                      <li key={`${product.id}-${batch.batchCode}`}>
                        <a onClick={() => handleAddCustomProduct(product, batch)}>
                          {product.name} - Batch: {batch.batchCode} - Qty: {batch.quantity}
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
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="table w-full">
          <thead className="bg-gray-100">
            <tr>
              <th>Product</th>
              <th>Remaining Qty (Max)</th>
              <th>Return Qty</th>
              <th>Unit Price</th>
              <th>Total Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {returnItems.map((item, index) => {
               // Check Validity for UI
               const isQtyInvalid = Number(item.quantity) > item.maxQuantity || Number(item.quantity) <= 0;
               
               return (
                <tr key={`${item.id}-${index}`}>
                    <td>
                        <div className="font-bold">{item.productName}</div>
                        <div className="text-xs text-gray-500">{item.batchCode}</div>
                    </td>
                    <td>{item.maxQuantity}</td>
                    <td>
                    <div className="relative">
                        <input
                            type="number"
                            className={`input input-bordered w-24 input-sm ${isQtyInvalid ? 'input-error text-red-600 font-bold' : ''}`}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                        />
                        {isQtyInvalid && <div className="text-[10px] text-red-500 absolute top-full">Invalid</div>}
                    </div>
                    </td>
                    <td>{item.price}</td>
                    <td>{item.total}</td>
                    <td>
                    <button
                        className="btn btn-ghost btn-xs text-red-500"
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
                    <td colSpan="6" className="text-center py-4 text-gray-400">No items added.</td>
                </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" className="text-right font-bold text-lg">Total Amount:</td>
              <td colSpan="2" className="font-bold text-lg">{totalAmount}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Return Payment Details */}
      <div className="card bg-base-100 shadow-xl mt-6 border">
        <div className="card-body">
          <h2 className="card-title">Payment & Adjustment</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="form-control">
                <label className="label"><span className="label-text font-bold">Total Return</span></label>
                <input type="text" value={totalAmount} className="input input-bordered font-bold" disabled />
             </div>
             <div className="form-control">
                <label className="label"><span className="label-text">Cash Return</span></label>
                <input
                    type="number"
                    value={cashReturn}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        setCashReturn(val);
                        setCreditAdjustment(totalAmount - val);
                    }}
                    className="input input-bordered"
                />
             </div>
             <div className="form-control">
                <label className="label"><span className="label-text">Credit Adjustment</span></label>
                <input
                    type="number"
                    value={creditAdjustment}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        setCreditAdjustment(val);
                        setCashReturn(totalAmount - val);
                    }}
                    className="input input-bordered"
                />
             </div>
          </div>

          <div className="alert alert-info mt-4 shadow-sm text-sm">
            <div>
              <span className="font-bold">Ledger Update:</span> Customer's pending credit will reduce from <strong>{customerCredit}</strong> to <strong>{customerCredit - creditAdjustment}</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6 mb-10">
        {!isValid && <div className="text-red-500 text-sm mb-2 text-center font-bold">Cannot submit: Some quantities exceed the allowed maximum.</div>}
        <button
          className="btn btn-primary w-full btn-lg"
          onClick={handleSubmit}
          disabled={!isValid || returnItems.length === 0}
        >
          Process Return
        </button>
      </div>
    </div>
  );
};

export default AddSellReturn;