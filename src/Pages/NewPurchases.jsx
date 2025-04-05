import React, { useState, useEffect } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { useAppContext } from '../Appfullcontext';
import { v4 as uuidv4 } from 'uuid';
import {  useNavigate } from "react-router-dom";
const NewPurchases = () => {
  const context = useAppContext();

  const peoples = context.peopleContext.people;
  
  const products = context.productContext.products;
  const companies = context.companyContext.companies;

  const units = context.unitContext.units;
  const updateProduct = context.productContext.edit;
  const addPurchase = context.purchaseContext.add;
  const navigate = useNavigate();

  const [selectedPeople, setselectedPeople] = useState('');

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [totalPayment, setTotalPayment] = useState(0);
  const [credit, setCredit] = useState(0);
  const [batchCodes, setBatchCodes] = useState({});

 


 

  const handleAddProductToTable = (product) => {
    const existingProduct = selectedProducts.find((p) => p.id === product.id);
    if (existingProduct) {
      alert('Product is already added to the table!');
    } else {
      const batches = product.batchCode || [];
      const batchInfo = batches.length ? batches[0] : {
        batchCode: `BATCH-${String(1).padStart(3, '0')}`,
        purchasePrice: '',
        sellPrice: '',
        retailPrice: '',
        expirationDate: '',
        quantity: 0,
      };

      const newProduct = {
        id: product.id,
        name: product.name,
        companyId: product.companyId || '',
       
        unitId: product.unitId || '',
        sellPrice: batchInfo.sellPrice,
        retailPrice: batchInfo.retailPrice,
        purchasePrice: batchInfo.purchasePrice,
        expirationDate:batchInfo.expirationDate,
        quantity: 0,
        total: 0,
        batchCode: batchInfo.batchCode,
      };
      
      setSelectedProducts([...selectedProducts, newProduct]);
      setBatchCodes({ ...batchCodes, [product.id]: batches });
    }
    calculateCredit();
  };

  const updateBatchCode = (productIndex, newBatchCode) => {
    const newProducts = [...selectedProducts];
    const product = newProducts[productIndex];
    const batches = batchCodes[product.id] || [];
    const selectedBatch = batches.find((batch) => batch.batchCode === newBatchCode) || {};

    product.batchCode = newBatchCode;
    product.expirationDate = selectedBatch.expirationDate || product.expirationDate;
    product.sellPrice = selectedBatch.sellPrice || product.sellPrice;
    product.retailPrice = selectedBatch.retailPrice || product.retailPrice;
    product.purchasePrice = selectedBatch.purchasePrice || product.purchasePrice;
    product.quantity = 0;
    product.total = 0;

    setSelectedProducts(newProducts);
  };

  const updateProductField = (index, field, value) => {
    const newProducts = [...selectedProducts];
    const product = newProducts[index];
    product[field] = value;

    product.total = product.purchasePrice * product.quantity;

    setSelectedProducts(newProducts);
    calculateCredit();
  };

  const calculateTotalBill = () => {
    return selectedProducts.reduce((total, product) => total + Number(product.total), 0);
  };

  const calculateCredit = () => {
    setCredit(calculateTotalBill() - Number(totalPayment));
  };

  const handleTotalPaymentChange = (e) => {
    let value = e.target.value;
    // Remove leading zeros except if it's just "0"
    value = value.replace(/^0+(?=\d)/, '');
    const totalBill = calculateTotalBill();
    const newPayment = value === '' ? 0 : parseFloat(value);
  
    // Check if new payment exceeds total bill
    if (newPayment > totalBill) {
      alert("Paid amount cannot exceed total bill amount!");
      setTotalPayment(totalBill);
      setCredit(0);
      return;
    }
  
    setTotalPayment(value === '' ? '' : newPayment);
    setCredit(totalBill - newPayment);
  };

  const handleAddPurchase = () => {
   
  
      // Validation: Supplier required
  if (!selectedPeople) {
    alert("Please select a supplier.");
    return;
  }

    // Validation: Purchase date required
    if (!currentDate) {
      alert("Please select a purchase date.");
      return;
    }



  // Validation: At least one product required
  if (selectedProducts.length === 0) {
    alert("Please add at least one product.");
    return;
  }

  // Validation: Each product must have at least 1 quantity
  const invalidProduct = selectedProducts.find((p) => Number(p.quantity) <= 0);
  if (invalidProduct) {
    alert(`Product "${invalidProduct.name}" must have at least 1 quantity.`);
    return;
  }
   
    selectedProducts.forEach((product) => {
      const existingProduct = products.find((p) => p.id === product.id);
      if (existingProduct) {
        let batches = existingProduct.batchCode || [];
        
        // Check if there's an exact match (same batch code + same purchase price + same expiration date)
        const existingBatch = batches.find(
          (batch) => batch.purchasePrice === product.purchasePrice && batch.expirationDate === product.expirationDate
        );
    
        if (existingBatch) {
          // Update existing batch
          const batchIndex = batches.findIndex(batch => batch.batchCode === existingBatch.batchCode);
          if (batchIndex !== -1) {
            batches[batchIndex].purchasePrice = product.purchasePrice;
            batches[batchIndex].sellPrice = product.sellPrice;
            batches[batchIndex].retailPrice = product.retailPrice;
            batches[batchIndex].expirationDate = product.expirationDate;
            batches[batchIndex].quantity = Number(batches[batchIndex].quantity) + Number(product.quantity);
          }
        } else {
          // Create a new batch if no match found
          const nextBatchNumber = batches.length + 1;
          const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
          const newBatch = {
            batchCode: newBatchCode,
            expirationDate: product.expirationDate,
            purchasePrice: product.purchasePrice,
            sellPrice: product.sellPrice,
            retailPrice: product.retailPrice,
            quantity: Number(product.quantity),
          };
    
          batches = [...batches, newBatch];
          product.batchCode = newBatchCode; // Assign the new batch code to the product
        }
    
        // Update the product with the modified batches array
        updateProduct(product.id, { ...existingProduct, batchCode: batches });
      }
    });
    
    // Ab purchase add karte waqt naya batch wala product use karo
    const newPurchase1 = {
      id: uuidv4(),
      personId: selectedPeople,
      date: currentDate,
      paymentMode,
      products: selectedProducts.map((p) => ({
        id: p.id || "0",
        name: p.name,
        quantity: p.quantity,
        purchasePrice: p.purchasePrice,
        sellPrice: p.sellPrice,
        retailPrice: p.retailPrice,
        batchCode: p.batchCode,  // Yeh ab naya batch hoga agar zaroori hua toh
      })),
      totalPayment,
      credit,
      totalBill: calculateTotalBill(),
    };
    
    addPurchase(newPurchase1);
    setSelectedProducts([]);
    alert('Purchase added successfully!');
    
  };

  const filteredProducts = products.filter((product) =>
    product.name && product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
    <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">New Purchase</h2>
  
      {/* Adjust the main layout flex */}
  <div className="flex flex-col lg:flex-row gap-4">
     {/* Left Content Area - make it full width on mobile */}
     <div className="flex-1  min-w-0 space-y-3 sm:space-y-4">
         {/* Top Row Grid - stack on mobile */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        
        {/* Supplier Selection - adjust padding and text size */}
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
          <label className="text-xs sm:text-sm font-semibold text-gray-600">Supplier *:</label>
          <div className="flex gap-2">
            <select
              className="select select-bordered w-full text-xs sm:text-sm bg-white"
              value={selectedPeople}
              onChange={(e) => setselectedPeople(e.target.value)}
            >
                  <option value="" disabled>Select a Supplier</option>
                  {peoples.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
               </select>
            <button 
              className="btn btn-primary btn-sm hidden sm:flex"
              onClick={() => navigate("/people")}
            >
              <AiOutlinePlus /> New
            </button>
          </div>
        </div>
            {/* Purchase Date */}
            <div className="bg-white rounded-lg p-4 shadow">
              <label className="text-sm font-semibold text-gray-600">Purchase Date:</label>
              <input 
                type="date" 
                value={currentDate} 
                max={currentDate} 
                onChange={(e) => setCurrentDate(e.target.value)} 
                className="input input-bordered w-full bg-white"
              />
            </div>
          </div>

          {/* Product Search */}
          <div className="bg-white rounded-lg p-4 shadow">
            <label className="text-sm font-semibold text-gray-600">Search Products:</label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Search product by name"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            {productSearch && (
              <div className="overflow-y-auto max-h-60 mt-2 border rounded-lg">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-2 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleAddProductToTable(product)}
                  >
                    {product.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products Table */}
           {/* Products Table - make it scroll horizontally on mobile */}
           <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2 sm:p-4 shadow-lg">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="max-h-[calc(100vh-450px)] overflow-y-auto">
              <table className="table w-full table-auto min-w-[800px] sm:min-w-full"> {/* Force minimum width on mobile */}
           <thead className="bg-gradient-to-r from-blue-600 to-purple-600 sticky top-0 z-10"> {/* Made header sticky */}
          <tr>
            <th className="text-white font-semibold text-xs md:text-sm px-2">Product</th>
            <th className="text-white font-semibold text-xs md:text-sm px-2">Company</th>
            <th className="text-white font-semibold text-xs md:text-sm px-2">Unit</th>
            <th className="text-white font-semibold text-xs md:text-sm px-2">Batch</th>
            <th className="text-white font-semibold text-xs md:text-sm px-2">Expire</th>
            <th className="text-white font-semibold text-xs md:text-sm px-2">Sell ₨</th>
            <th className="text-white font-semibold text-xs md:text-sm px-2">Retail ₨</th>
            <th className="text-white font-semibold text-xs md:text-sm px-2">Purchase ₨</th>
            <th className="text-white font-semibold text-xs md:text-sm px-2">Qty</th>
            <th className="text-white font-semibold text-xs md:text-sm px-2">Total</th>
            <th className="text-white font-semibold text-xs md:text-sm px-2">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {selectedProducts.length > 0 ? (
            selectedProducts.map((product, index) => (
            <tr key={product.id} className="hover:bg-blue-50 transition-colors">
                      <td className="font-medium text-gray-700 text-xs md:text-sm px-2">{product.name}</td>
                      <td className="text-xs md:text-sm px-2">{companies.find((c) => c.id === product.companyId)?.name || 'N/A'}</td>
                      <td className="text-xs md:text-sm px-2">{units.find((u) => u.id === product.unitId)?.name || 'N/A'}</td>
                      <td className="text-xs md:text-sm px-2">
                        <select
                          value={product.batchCode}
                          onChange={(e) => updateBatchCode(index, e.target.value)}
                          className="select select-bordered select-sm w-full max-w-xs"
                        >
                          {(batchCodes[product.id] || []).map((batch) => (
                            <option key={batch.batchCode} value={batch.batchCode}>{batch.batchCode}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-xs md:text-sm px-2">
                        <input
                          type="date"
                          value={product.expirationDate || ''}
                          onChange={(e) => updateProductField(index, 'expirationDate', e.target.value)}
                          className="input input-bordered input-sm w-full max-w-xs"
                        />
                      </td>
                      <td className="text-xs md:text-sm px-2">
                        <input
                          type="number"
                          className="input input-bordered input-sm w-20"
                          value={product.sellPrice}
                          onChange={(e) => updateProductField(index, 'sellPrice', parseFloat(e.target.value) || '')}
                        />
                      </td>
                      <td className="text-xs md:text-sm px-2">
                        <input
                          type="number"
                          className="input input-bordered input-sm w-20"
                          value={product.retailPrice}
                          onChange={(e) => updateProductField(index, 'retailPrice', parseFloat(e.target.value) || '')}
                        />
                      </td>
                      <td className="text-xs md:text-sm px-2">
                        <input
                          type="number"
                          className="input input-bordered input-sm w-20"
                          value={product.purchasePrice}
                          onChange={(e) => updateProductField(index, 'purchasePrice', parseFloat(e.target.value) || '')}
                        />
                      </td>
                      <td className="text-xs md:text-sm px-2">
                        <input
                          type="number"
                          className="input input-bordered input-sm w-20"
                          value={product.quantity}
                          onChange={(e) => updateProductField(index, 'quantity', parseInt(e.target.value, 10) || 0)}
                        />
                      </td>
                      <td className="text-blue-600 font-bold text-xs md:text-sm px-2">
                        ₨ {product.total.toFixed(2)}
                      </td>
                      <td className="px-2">
                        <button
                          className="btn btn-error btn-xs md:btn-sm"
                          onClick={() => setSelectedProducts(selectedProducts.filter((_, i) => i !== index))}
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                 ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center text-gray-500 py-4">
                      No products added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
        </div>

         {/* Right Sidebar - Payment Details */}
         <div className="lg:w-1/4 lg:min-w-[300px] w-full">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-6 shadow-lg lg:sticky lg:top-4">
            <h3 className="text-2xl font-bold mb-6 text-blue-800">Payment Details</h3>

            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">Payment Mode:</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="select select-bordered w-full bg-white shadow-sm hover:border-blue-400 transition-colors"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
              </select>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg mb-6 shadow-md">
              <label className="text-white text-sm font-semibold block mb-1">Total Bill:</label>
              <div className="text-3xl font-bold text-white">
                ₨ {calculateTotalBill().toFixed(2)}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">Amount Paid:</label>
             <input
  type="number"
  value={totalPayment === 0 ? '' : totalPayment}
  onChange={handleTotalPaymentChange}
  className="input input-bordered w-full bg-white shadow-sm hover:border-green-400 transition-colors text-lg font-semibold"
/>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-lg mb-8 shadow-md">
              <label className="text-white text-sm font-semibold block mb-1">Credit Amount:</label>
              <div className="text-3xl font-bold text-white">
                ₨ {credit.toFixed(2)}
              </div>
            </div>

            <button
              onClick={handleAddPurchase}
              className="btn btn-primary w-full mb-3 text-lg font-bold hover:scale-105 transition-transform"
            >
              Save Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default NewPurchases;
