import React, { useState, useEffect } from 'react';
import { FaSearch, FaTrash, FaPlus } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import { v4 as uuidv4 } from 'uuid';
import { CalculateUserCredit } from '../Utils/CalculateUserCredit';
const AddSellReturn = () => {
      const context = useAppContext();
  const [salesRef, setSalesRef] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [addCustomProduct, setAddCustomProduct] = useState([])
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedPeople, setSelectedPeople] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [customerCredit, setCustomerCredit] = useState(0);

  const addReturn = context.SellReturnContext.add

  // Sample data (replace with your actual data)
  const salesData = context.SaleContext.Sales;
  const products = context.productContext.products;
  const peoples = context.peopleContext.people;
  const [cashReturn, setCashReturn] = useState(0);
  const [creditAdjustment, setCreditAdjustment] = useState(0);
  
  useEffect(() => {
    if (selectedPeople) {
      const { pendingCredit } =     CalculateUserCredit(context, selectedPeople);
    console.log(   CalculateUserCredit(context, selectedPeople))
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
    setReturnItems(sale.products.map((item, index) => ({
      id: item.id,
      productName: item.name,
      quantity: Number(item.SellQuantity),
      maxQuantity: Number(item.SellQuantity),
      price: Number(item.newSellPrice)
      ,
      total: Number(item.newSellPrice) * Number(item.SellQuantity),
    })));
    calculateTotal();
    setSalesRef('');
    setFilteredSales([]);

   
    const matchedPeople = peoples.find(people => people.id === sale.personId);
    if (matchedPeople) {
    
        setSelectedPeople(matchedPeople.id); 
    } else {
        console.log('People not found for sale:', sale.personId);
    }
    
    
  };

  const calculateTotal = () => {
    const total = returnItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalAmount(total);
  };


useEffect(() => {
  calculateTotal();
}, [returnItems]);


  const handleAddCustomProduct = (product,batch) => {
    const alreadyAdded = returnItems.some((item) => item.id === product.id);
    
    if (alreadyAdded) {
        alert("This product is already added!");
        return;
    }

    if (selectedProduct ) {
      const newItem = {
        id: product.id ,
        productName: `${product.name} (Batch: ${batch.batchCode})`,
        quantity: 1,
        maxQuantity: Number.POSITIVE_INFINITY,
        price: Number(batch.sellPrice),
        total: quantity * price,
      };
      console.log(JSON.stringify(newItem) + "new item clg")
      setReturnItems([...returnItems, newItem]);
      setAddCustomProduct([])
      setSelectedProduct('');
      calculateTotal();
    }
  };


  const handleRemoveItem = (id) => {
    setReturnItems(returnItems.filter(item => item.id !== id));
    calculateTotal();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedPeople) {
        alert("Please select a person for the return");
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

    const returnRefNo = `RET-${uuidv4().slice(0, 8).toUpperCase()}`;
  
    const returnData = {
        id: uuidv4(),
        returnRefNo,
        salesRef: selectedSale?.salesRefNo,
        people: selectedPeople,
        items: returnItems,
        totalAmount,
        
        returnDate: new Date(),
        paymentDetails: {
            creditAdjustment,
            cashReturn,
            previousCreditBalance: customerCredit,
            newCreditBalance: customerCredit - creditAdjustment
        }
    };
  
    console.log(returnData);
    addReturn(returnData);

    // Reset form
    setReturnItems([]);
    setSelectedSale(null);
    setSalesRef('');
    setTotalAmount(0);
    setCreditAdjustment(0);
    setCashReturn(0);
    setSelectedPeople('');
};

  return (
    <div className="p-4">
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
            <ul className="menu bg-base-100 w-full rounded-box mt-2 shadow">
              {filteredSales.map((sale) => (
                <li key={sale.salesRefNo}>
                  <a onClick={() => handleSaleSelect(sale)}>
                    {sale.salesRefNo}
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

      {/* Add Custom Product */}
      <div className="card bg-base-100 shadow-xl mt-6">
        <div className="card-body">
          <h2 className="card-title">Add Custom Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <input
              type="text"
              placeholder="Search sales reference"
              className="input input-bordered w-full"
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
              
                handleSearchProduct(e.target.value);
              }}
            />

{addCustomProduct.length > 0 && (
    <ul className="menu bg-base-100 w-full rounded-box mt-2 shadow">
        {addCustomProduct.map((product) => (
            product.batchCode && product.batchCode.length > 0 && 
            product.batchCode.map((batch) => (
                <li key={`${product.id}-${batch.batchNumber}`}>
                    <a onClick={() => handleAddCustomProduct(product, batch)}>
                        {product.name} - Batch: {batch.batchNumber} - Price: {batch.sellPrice}
                    </a>
                </li>
            ))
        ))}
    </ul>
)}
          



        
          </div>
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
                        // Ensure value is between 1 and maxQuantity
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
        value={customerCredit}
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
        New Credit Balance will be: <span className="font-bold">{customerCredit - creditAdjustment}</span>
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

export default AddSellReturn;