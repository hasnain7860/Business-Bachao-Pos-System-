
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../Appfullcontext';

const NewSales = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const customers = context.supplierCustomerContext.customers;
  const products = context.productContext.products;

  const [salesRefNo, setSalesRefNo] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  console.log(selectedProducts)
  const [searchProduct, setSearchProduct] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
  const [credit, setCredit] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    generateSalesRefNo();
  }, []);

  const generateSalesRefNo = () => {
    setSalesRefNo(`SALE-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleAddProduct = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    if (!existingProduct && product.quantity > 0) {
      setSelectedProducts([...selectedProducts, { ...product, SellQuantity: 1, discount: 0 , newSellPrice : product.sellPrice }]);
    }
  };

  const handleProductChange = (id, field, value) => {
    const updatedProducts = selectedProducts.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setSelectedProducts(updatedProducts);
  };

  const handleSellingPriceChange = (id, value) => {
    const updatedProducts = selectedProducts.map(p => {
      if (p.id === id) {
        const newSellPrice = value; // Allow any value input
        const discount = ((100 - (newSellPrice / p.sellPrice) * 100)).toFixed(2); // Calculate discount
        return { ...p, newSellPrice: newSellPrice, discount: discount }; // Update selling price and discount
      }
      return p;
    });
    setSelectedProducts(updatedProducts);
  };

  const validateSellingPrice = (product) => {
    return product.newSellPrice < product.purchasePrice;
  };
const calculateTotalPayment = () => {
  return selectedProducts.reduce((total, product) => {
    const productTotal = product.newSellPrice * product.SellQuantity ;
    return total + productTotal;
  }, 0).toFixed(2); // Returns total payment formatted to two decimal places
};const handleCalculateCredit = (e) => {
  const paidAmount = parseFloat(e.target.value) || ""; // Parse input to float, default to 0 if NaN
  setAmountPaid(paidAmount);
  setCredit(calculateTotalPayment() - paidAmount); // Calculate credit based on the current total payment
};
  

  const handleSaveSales = () => {
    if (!selectedCustomer) {
      setMessage('Please add a customer first.');
      return;
    }

    if (selectedProducts.length === 0) {
      setMessage('Please add at least one product to the sale.');
      return;
    }

    const salesData = {
    salesRefNo,
    customerId: selectedCustomer,
    products: selectedProducts,
    paymentMode,
    totalBill: calculateTotalPayment(),
    amountPaid,
    credit,
    dateTime: new Date().toISOString() // This will give you the date and time in ISO format
};
    context.SaleContext.add(salesData);
    console.log("sales data " + JSON.stringify(salesData))
    alert('Sales saved successfully!');
    // Reset form
    setSelectedCustomer('');
    setSelectedProducts([]);
    setPaymentMode('');
    setAmountPaid(0);
    setCredit(0);
    generateSalesRefNo();
    setMessage(''); // Clear message
  };

  const handleCancelProduct = (id) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6 mt-10">
      <h2 className="text-2xl font-bold text-center mb-6">New Sales</h2>

      {/* Message Display */}
      {message && <div className="text-red-500 mb-4">{message}</div>}

      {/* Sales Reference Number */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Sales Reference Number:</span>
        </label>
        <input
          type="text"
          value={salesRefNo}
          readOnly
          className="input input-bordered w-full"
        />
      </div>

      {/* Customer Selection */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Select Customer:</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            placeholder="Search customer"
            className="input input-bordered w-full"
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate('people/customers')}
          >
            Add New
          </button>
        </div>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="select select-bordered w-full mt-2"
        >
          <option value="">Select a Customer</option>
          {customers
            .filter(customer => customer.name.includes(searchCustomer))
            .map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
        </select>
      </div>

      {/* Product Selection */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Add Products:</span>
        </label>
        <input
          type="text"
          value={searchProduct}
          onChange={(e) => setSearchProduct(e.target.value)}
          placeholder="Search product"
          className="input input-bordered w-full"
        />
        <div className="overflow-y-auto max-h-60 mt-2">
          {products.length === 0 ? (
            <div>No products available.</div>
          ) : (
            products
              .filter(product => product.name.includes(searchProduct))
              .map(product => (
                <div key={product.id} className="flex justify-between items-center py-2 border-b">
                  {product.name}
                  {product.quantity > 0 ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleAddProduct(product)}
                    >
                      Add
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      disabled
                    >
                      Out of Stock
                    </button>
                  )}
                </div>
              ))
          )}
        </div>
      </div>

      {/* Selected Products Table */}
      <div className="overflow-x-auto mt-4">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Discount (%)</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  <input
                    type="number"
                    value={product.SellQuantity}
                    onChange={(e) => handleProductChange(product.id, 'SellQuantity', e.target.value)}
                    className="input input-bordered w-20"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={product.newSellPrice}
                    onChange={(e) => handleSellingPriceChange(product.id, e.target.value)}
                    className={`input input-bordered w-20 ${validateSellingPrice(product) ? 'border-red-500' : ''}`} // Red border if selling price is less than purchase price
                  />
                  {validateSellingPrice(product) && (
                    <div className="text-red-500 text-sm">Selling price cannot be less than purchase price.</div>
                  )}
                </td>
                <td>{product.quantity - product.SellQuantity} (In Stock)</td>
                <td>
                  <input
                    type="number"
                    value={product.discount}
                    readOnly
                    className="input input-bordered w-20"
                  />
                </td>
                <td>{(product.sellPrice * product.SellQuantity * (1 - (product.discount / 100 || 0))).toFixed(2)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleCancelProduct(product.id)}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Mode */}
      <div className="form-control mb-4 mt-6">
        <label className="label">
          <span className="label-text">Payment Mode:</span>
        </label>
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
          className="select select-bordered w-full"
        >
          <option value="">Select Payment Mode</option>
          <option value="online">Online</option>
          <option value="bank">Bank</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
        </select
        >
      </div>
{/* Total Payment Display */}
<div className="form-control mb-4">
  <label className="label">
    <span className="label-text">Total Payment:</span>
  </label>
  <input
    type="text"
    value={calculateTotalPayment()}
    readOnly
    className="input input-bordered w-full"
  />
</div>
      {/* Amount Paid */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Amount Paid:</span>
        </label>
        <input
          type="number"
          value={amountPaid}
          onChange={handleCalculateCredit}
          className="input input-bordered w-full"
        />
      </div>

      {/* Credit Display */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Credit:</span>
        </label>
        <input
          type="text"
          value={credit}
          readOnly
          className="input input-bordered w-full"
        />
      </div>

      {/* Save Sales Button */}
      <div className="form-control mt-6">
        <button
          type="button"
          onClick={() => {
            
            handleSaveSales();
          }}
          className="btn btn-primary w-full"
        >
          Save Sales
        </button>
      </div>
    </div>
  );
};

export default NewSales;
