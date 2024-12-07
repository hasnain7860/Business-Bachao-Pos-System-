import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../Appfullcontext';

const NewSales = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const customers = context.supplierCustomerContext.customers;
  console.log(customers)
  const products = context.productContext.products;

  const [salesRefNo, setSalesRefNo] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
  const [credit, setCredit] = useState(0);

  useEffect(() => {
    generateSalesRefNo();
  }, []);

  const generateSalesRefNo = () => {
    setSalesRefNo(`SALE-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleAddProduct = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    if (!existingProduct) {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1, discount: 0 }]);
    }
  };

  const handleProductChange = (id, field, value) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleCalculateCredit = () => {
    const totalAmount = selectedProducts.reduce((acc, prod) => 
      acc + (prod.price * prod.quantity * (1 - prod.discount / 100)), 0
    );
    setCredit(totalAmount - amountPaid);
  };

  const handleSaveSales = () => {
    const salesData = {
      salesRefNo,
      customerId: selectedCustomer,
      products: selectedProducts,
      paymentMode,
      amountPaid,
      credit,
    };
    context.salesContext.addSales(salesData);
    alert('Sales saved successfully!');
    // Reset form
    setSelectedCustomer('');
    setSelectedProducts([]);
    setPaymentMode('');
    setAmountPaid(0);
    setCredit(0);
    generateSalesRefNo();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6 mt-10">
      <h2 className="text-2xl font-bold text-center mb-6">New Sales</h2>

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
        <div className="mt-2">
          {products
            .filter(product => product.productName.includes(searchProduct))
            .map(product => (
              <div key={product.id} className="flex justify-between items-center py-2">
                <span>{product.productName}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleAddProduct(product)}
                >
                  Add
                </button>
              </div>
            ))}
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
              <th>Discount (%)</th>
              <th>Total</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) => handleProductChange(product.id, 'quantity', e.target.value)}
                    className="input input-bordered w-20"
                  />
                </td>
                <td>{product.sellPrice}</td>
                <td>
                  <input
                    type="number"
                    value={product.discount}
                    onChange={(e) => handleProductChange(product.id, 'discount', e.target.value)}
                    className="input input-bordered w-20"
                  />
                </td>
                <td>{(product.price * product.quantity * (1 - product.discount / 100)).toFixed(2)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleProductChange(product.id, 'edit', true)}
                  >
                    Edit
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
        </select>
      </div>

      {/* Amount Paid */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Amount Paid:</span>
        </label>
        <input
          type="number"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
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
            handleCalculateCredit();
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
