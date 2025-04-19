import React, { useState, useEffect } from 'react';
import { FaSearch, FaTrash, FaPlus } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import { v4 as uuidv4 } from 'uuid';
import {CalculateUserCredit } from '../Utils/CalculateUserCredit';

const AddPurchaseReturn = () => {
  const context = useAppContext();
  const [purchaseRef, setPurchaseRef] = useState('');
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [addCustomProduct, setAddCustomProduct] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [peopleCredit, setSupplierCredit] = useState(0);
  const [cashReturn, setCashReturn] = useState(0);
  const [creditAdjustment, setCreditAdjustment] = useState(0);
  const [selectedPeople, setSelectedPeople] = useState('')
 
  const addReturn = context.purchaseReturnContext?.add;
  const purchasesData = context.purchaseContext?.purchases || [];
  const products = context.productContext?.products || [];
  const peoples = context.peopleContext.people;
  useEffect(() => {
    if (selectedPeople) {
      const { pendingCredit } =CalculateUserCredit(context, selectedPeople);
      console.log(CalculateUserCredit(context,selectedPeople))
      setSupplierCredit(pendingCredit);
    }
  }, [selectedPeople]);

  const handleSearch = (value) => {
    const filtered = purchasesData.filter((purchase) =>
      purchase.purchaseRefNo.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredPurchases(filtered);
  };

  const handleSearchProduct = (value) => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(value.toLowerCase())
    );
    setAddCustomProduct(filtered);
  };

  const handlePurchaseSelect = (purchase) => {
    setSelectedPurchase(purchase);
    setReturnItems(purchase.products.map((item) => ({
      id: item.id,
      productName: item.name,
      quantity: Number(item.quantity),
      maxQuantity: Number(item.quantity),
      price: Number(item.purchasePrice),
      total: Number(item.purchasePrice) * Number(item.quantity),
    })));
    calculateTotal();
    setPurchaseRef('');
    setFilteredPurchases([]);

    const matchedSupplier = peoples.find(people => people.id === purchase.peopleId);
    if (matchedSupplier) {
      setSelectedPeople(matchedSupplier.id);
    }
  };

  const handleAddCustomProduct = (product, batch) => {
    const alreadyAdded = returnItems.some((item) => item.id === product.id);
    
    if (alreadyAdded) {
      alert("This product is already added!");
      return;
    }

    if (selectedProduct) {
      const newItem = {
        id: product.id,
        productName: `${product.name} (Batch: ${batch.batchCode})`,
        quantity: 1,
        maxQuantity: Number.POSITIVE_INFINITY,
        price: Number(batch.purchasePrice),
        total: quantity * price,
      };
      setReturnItems([...returnItems, newItem]);
      setAddCustomProduct([]);
      setSelectedProduct('');
      calculateTotal();
    }
  };

  const calculateTotal = () => {
    const total = returnItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalAmount(total);
  };

  useEffect(() => {
    calculateTotal();
  }, [returnItems]);

  const handleRemoveItem = (id) => {
    setReturnItems(returnItems.filter(item => item.id !== id));
    calculateTotal();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedPeople) {
      alert("Please select a people for the return");
      return;
    }

    if (returnItems.length === 0) {
      alert("Please add items to return");
      return;
    }

    if (creditAdjustment + cashReturn !== totalAmount) {
      alert("Credit adjustment and cash return must equal total return amount");
      return;
    }

    const returnRefNo = `PRET-${uuidv4().slice(0, 8).toUpperCase()}`;
  
    const returnData = {
      id: uuidv4(),
      returnRefNo,
      purchaseRef: selectedPurchase?.purchaseRefNo,
      people: selectedPeople,
      items: returnItems,
      totalAmount,
      returnDate: new Date(),
      paymentDetails: {
        creditAdjustment,
        cashReturn,
        previousCreditBalance: peopleCredit,
        newCreditBalance: peopleCredit - creditAdjustment
      }
    };
  console.log(returnData)
    addReturn(returnData);

    // Reset form
    setReturnItems([]);
    setSelectedPurchase(null);
    setPurchaseRef('');
    setTotalAmount(0);
    setCreditAdjustment(0);
    setCashReturn(0);
    setSelectedPeople('');
  };

  return (
    <div className="p-4">
      <div className="text-2xl font-bold mb-6">Add Purchase Return</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Purchase Reference Search */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Purchase Reference Number</span>
          </label>
          <div className="input-group">
            <input
              type="text"
              placeholder="Search purchase reference"
              className="input input-bordered w-full"
              value={purchaseRef}
              onChange={(e) => {
                setPurchaseRef(e.target.value);
                handleSearch(e.target.value);
              }}
            />
            <button className="btn btn-square">
              <FaSearch />
            </button>
          </div>
          {filteredPurchases.length > 0 && (
            <ul className="menu bg-base-100 w-full rounded-box mt-2 shadow">
              {filteredPurchases.map((purchase) => (
                <li key={purchase.purchaseRefNo}>
                  <a onClick={() => handlePurchaseSelect(purchase)}>
                    {purchase.purchaseRefNo}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Supplier Selection */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Supplier</span>
          </label>
          <select 
            className="select select-bordered w-full"
            value={selectedPeople}
            onChange={(e) => setSelectedPeople(e.target.value)}
          >
            <option value="">Select Supplier</option>
            {peoples.map((people) => (
              <option key={people.id} value={people.id}>
                {people.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Return Items Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {returnItems.map((item) => (
              <tr key={item.id}>
                <td>{item.productName}</td>
                <td>
                  <input
                    type="number"
                    className="input input-bordered w-24"
                    value={item.quantity}
                    min="1"
                    max={item.maxQuantity}
                    onChange={(e) => {
                      let newValue = parseInt(e.target.value) || 0;
                      newValue = Math.min(Math.max(newValue, 1), item.maxQuantity);
                      
                      const newItems = returnItems.map((i) =>
                        i.id === item.id
                          ? { ...i, quantity: newValue, total: i.price * newValue }
                          : i
                      );
                      setReturnItems(newItems);
                    }}
                  />
                </td>
                <td>{item.price}</td>
                <td>{item.price * item.quantity}</td>
                <td>
                  <button
                    className="btn btn-error btn-sm"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="text-right font-bold">Total Amount:</td>
              <td colSpan="2" className="font-bold">{totalAmount}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Return Payment Details */}
      <div className="card bg-base-100 shadow-xl mt-6">
        <div className="card-body">
          <h2 className="card-title">Return Payment Details</h2>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Current Credit Balance:</span>
            </label>
            <input 
              type="text" 
              value={peopleCredit}
              className="input input-bordered"
              disabled
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Total Return Amount:</span>
            </label>
            <input 
              type="text" 
              value={totalAmount}
              className="input input-bordered"
              disabled
            />
          </div>

          <div className="divider">Return Breakdown</div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Credit Adjustment:</span>
              </label>
              <input 
                type="number" 
                value={creditAdjustment}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setCreditAdjustment(value);
                  setCashReturn(totalAmount - value);
                }}
                className="input input-bordered"
                max={totalAmount}
                min={0}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Cash Return:</span>
              </label>
              <input 
                type="number" 
                value={cashReturn}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setCashReturn(value);
                  setCreditAdjustment(totalAmount - value);
                }}
                className="input input-bordered"
                max={totalAmount}
                min={0}
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm">
              New Credit Balance will be: <span className="font-bold">{peopleCredit - creditAdjustment}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          className="btn btn-primary w-full md:w-auto"
          onClick={handleSubmit}
        >
          Submit Return
        </button>
      </div>
    </div>
  );
};

export default AddPurchaseReturn;