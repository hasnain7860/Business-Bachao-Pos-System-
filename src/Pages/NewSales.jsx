
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../Appfullcontext';
import { v4 as uuidv4 } from 'uuid';

const NewSales = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const customers = context.supplierCustomerContext.customers;
  const products = context.productContext.products;
  const editProduct = context.productContext.edit;

  const [salesRefNo, setSalesRefNo] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [credit, setCredit] = useState(0);
  const [message, setMessage] = useState('');
console.log(selectedProducts)
  useEffect(() => {
    generateSalesRefNo();
  }, []);

  const generateSalesRefNo = () => {
    setSalesRefNo(`SALE-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  useEffect(() => {
    handleCalculateCredit();
  }, [selectedProducts, amountPaid]);

  const handleAddProduct = (product, batch) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id && p.batchCode === batch.batchCode);
    if (!existingProduct && batch.quantity > 0) {
      setSelectedProducts([...selectedProducts, { ...product, batchCode: batch.batchCode, SellQuantity: 1, discount: 0,sellPrice:batch.sellPrice, newSellPrice: batch.sellPrice,purchasePrice:batch.
        purchasePrice, batchQuantity: batch.quantity }]);
    }
  };

  const handleProductChange = (id, batchCode, field, value) => {
    const updatedProducts = selectedProducts.map(p => {
      if (p.id === id && p.batchCode === batchCode) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setSelectedProducts(updatedProducts);
    handleCalculateCredit();
  };

  const handleSellingPriceChange = (id, batchCode, value) => {
    const updatedProducts = selectedProducts.map(p => {
      if (p.id === id && p.batchCode === batchCode) {
        const newSellPrice = value;
        let discount = (100 - ((newSellPrice * 100) / p.sellPrice));
        discount = Math.max(discount, 0); // Agar discount negative hai to 0 kar do
        return { ...p, newSellPrice: newSellPrice, discount: discount };
      }
      return p;
    });
    setSelectedProducts(updatedProducts);
    handleCalculateCredit();
  };
  
  const validateSellingPrice = (product) => {
    return Number(product.newSellPrice) < Number(product.purchasePrice);
  };

  const calculateTotalPayment = () => {
    return selectedProducts.reduce((total, product) => {
      const productTotal = Number(product.newSellPrice) * Number(product.SellQuantity);
      return Number(total) + Number(productTotal);
    }, 0).toFixed(2);
  };

  const handleAmountPaidChange = (e) => {
    setAmountPaid(e.target.value);
  };

  const handleCalculateCredit = () => {
    let amountPaidcheck = amountPaid === '' ? 0 : Number(amountPaid);
    setCredit(Number(calculateTotalPayment()) - Number(amountPaidcheck));
  };

const handleSaveSales = async () => {
  if (!selectedCustomer) {
    setMessage('Please add a customer first.');
    return;
  }

  if (selectedProducts.length === 0) {
    setMessage('Please add at least one product to the sale.');
    return;
  }

  if (amountPaid === '') {
    setAmountPaid("0");
  }

  const uniqueId = uuidv4();
  const salesData = {
    id: uniqueId,
    salesRefNo,
    customerId: selectedCustomer,
    products: selectedProducts,
    paymentMode,
    totalBill: calculateTotalPayment(),
    amountPaid,
    credit,
    dateTime: new Date().toISOString()
  };

  for (let product of selectedProducts) {
    // Find the product in the original products list
    const originalProduct = products.find(p => p.id === product.id);
    if (originalProduct) {
      // Locate the correct batch in the batchCode array
      const updatedBatchCode = originalProduct.batchCode.map(batch => {
        if (batch.batchCode === product.batchCode) {
          // Subtract the sold quantity from the batch's quantity
          return { ...batch, quantity: batch.quantity - product.SellQuantity };
        }
        return batch;
      });

      // Create updated product with the new batchCode array
      const updatedProduct = {
        ...originalProduct,
        batchCode: updatedBatchCode,
      };

      // Use the existing editProduct function to update the product in IndexedDB
      await editProduct(product.id, updatedProduct);
    }
  }

  context.SaleContext.add(salesData);
  alert('Sales saved successfully!');

  // Reset form
  setSelectedCustomer('');
  setSelectedProducts([]);
  setPaymentMode('');
  setAmountPaid('');
  setCredit(0);
  generateSalesRefNo();
  setMessage('');
};

  
  const handleCancelProduct = (id, batchCode) => {
    setSelectedProducts(selectedProducts.filter(p => !(p.id === id && p.batchCode === batchCode)));
    handleCalculateCredit();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6 mt-10">
      <h2 className="text-2xl font-bold text-center mb-6">New Sales</h2>

      {message && <div className="text-red-500 mb-4">{message}</div>}

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
            onClick={() => navigate('/people/customers')}
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
    .filter(product => {
      const productName = product.name || ""; // Default to empty string if undefined
      const productNameUrdu = product.nameInUrdu || ""; // Default to empty string if undefined
  
      return productName.includes(searchProduct) || productNameUrdu.includes(searchProduct);
  }).map(product => (
        product.batchCode && product.batchCode.length > 0 ? (
          <div key={product.id} className="py-2 border-b">
            <div className="pl-4">
              {product.batchCode.map(batch => (
                <div key={batch.batchCode} className="flex justify-between items-center py-1">
                  <span>
                    {product.name || "Unnamed Product"} ({product.nameInUrdu || "نام نہیں"}) - 
                    Batch: {batch.batchCode} - Stock: {batch.quantity}
                  </span>
                  {batch.quantity > 0 ? (
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => handleAddProduct(product, batch)}
                    >
                      Add Batch
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      disabled
                    >
                      Out of Stock
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null
      ))
  )}
</div>


      </div>

      <div className="overflow-x-auto mt-4">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Product</th>
              <th>Batch</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>In Stock</th>
              <th>Discount (%)</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.map(product => (
              <tr key={`${product.id}-${product.batchCode}`}>
                <td>{product.name}</td>
                <td>{product.batchCode}</td>
                <td>
                  <input
                    type="number"
                    value={product.SellQuantity}
                    onChange={(e) => handleProductChange(product.id, product.batchCode, 'SellQuantity', e.target.value)}
                    className="input input-bordered w-20"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={product.newSellPrice}
                    onChange={(e) => handleSellingPriceChange(product.id, product.batchCode, e.target.value)}
                    className={`input input-bordered w-20 ${validateSellingPrice(product) ? 'border-red-500' : ''}`}
                  />
                  {validateSellingPrice(product) && (
                    <div className="text-red-500 text-sm">Selling price cannot be less than purchase price.</div>
                  )}
                </td>
                <td>{product.batchQuantity - product.SellQuantity} (In Stock)</td>
                <td>
                  <input
                    type="number"
                    value={product.discount}
                    readOnly
                    className="input input-bordered w-20"
                  />
                </td>
                <td>{(product.newSellPrice * product.SellQuantity).toFixed(2)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleCancelProduct(product.id, product.batchCode)}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Amount Paid:</span>
        </label>
        <input
          type="number"
          value={amountPaid}
          onChange={handleAmountPaidChange}
          className="input input-bordered w-full"
        />
      </div>

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

      <div className="form-control mt-6">
        <button
          type="button"
          onClick={handleSaveSales}
          className="btn btn-primary w-full"
        >
          Save Sales
        </button>
      </div>
    </div>
  );
};

export default NewSales;


