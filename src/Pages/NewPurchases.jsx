import React, { useState } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { useAppContext } from '../Appfullcontext';

const NewPurchases = () => {
  const context = useAppContext();
  const suppliers = context.supplierCustomerContext.suppliers;
  const products = context.productContext.products;
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [totalPayment, setTotalPayment] = useState(0);
  const purchases = context.purchases
  const setPurchases = context.setPurchases
  
  const handleAddSupplier = () => {
    window.location.href = '/people/suppliers';
  };

  const handleAddProductToTable = (product) => {
    const existingProduct = selectedProducts.find((p) => p.id === product.id);
    if (existingProduct) {
      alert('Product is already added to the table!');
    } else {
      const newProduct = {
        id: product.id,
        name: product.productName,
        company: product.companyName || '',
        brand: product.brandName || '',
        units: product.unitId || '',
        sellPrice: product.sellPrice || 0,
        retailPrice: product.retailPrice || 0,
        purchasePrice: product.purchasePrice || 0,
        quantity: 0,
        total: 0,
      };
      setSelectedProducts([...selectedProducts, newProduct]);
    }
  };

  const updateProductField = (index, field, value) => {
    const newProducts = [...selectedProducts];
    newProducts[index][field] = value;
    newProducts[index].total =
      newProducts[index].purchasePrice * newProducts[index].quantity;
    setSelectedProducts(newProducts);
  };

  const calculateTotalBill = () => {
    return selectedProducts.reduce((total, product) => total + product.total, 0);
  };

  const calculateCredit = () => {
    return calculateTotalBill() - totalPayment;
  };

  const handleAddPurchase = () => {
    const supplier = suppliers.find(s => s.id == selectedSupplier);
    const newPurchase = {
      supplierName: supplier ? supplier.name : '',
      date: currentDate,
      paymentMode,
      products: selectedProducts.map(p => ({
        name: p.name,
        quantity: p.quantity,
        purchasePrice: p.purchasePrice,
        sellPrice: p.sellPrice,
        retailPrice: p.retailPrice,
      })),
      total: calculateTotalBill(),
    };
    
    console.log(newPurchase)

    // Update products in context
    selectedProducts.forEach(product => {
      const existingProduct = products.find(p => p.id === product.id);
      if (existingProduct) {
        existingProduct.sellPrice = product.sellPrice || existingProduct.sellPrice;
        existingProduct.retailPrice = product.retailPrice || existingProduct.retailPrice;
        existingProduct.purchasePrice = product.purchasePrice || existingProduct.purchasePrice;
        existingProduct.quantity = (existingProduct.quantity || 0) + product.quantity;
      }
    });

    setPurchases([...purchases, newPurchase]);
    setSelectedProducts([]); // Clear selected products for new purchase
    alert('Purchase added successfully!');
  };

  // Filter products based on the search input
  const filteredProducts = products.filter((product) =>
    product.productName &&
    product.productName.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-6">New Purchase</h1>

      {/* Supplier Section */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">Supplier</label>
        <div className="flex items-center space-x-2">
          <select
            className="select select-bordered w-full"
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
          >
            <option value="" disabled>
              Select a Supplier
            </option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-sm flex items-center"
            onClick={handleAddSupplier}
          >
            <AiOutlinePlus className="mr-1" /> Add Supplier
          </button>
        </div>
      </div>

      {/* Purchase Date */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Purchase Date
        </label>
        <input
          type="date"
          className="input input-bordered w-full"
          max={currentDate}
        />
      </div>

      {/* Product Search Section */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">Product</label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Search product"
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
        />
        <div className="overflow-y-auto max-h-40 border mt-2">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="p-2 border-b cursor-pointer hover:bg-gray-100"
              onClick={() => handleAddProductToTable(product)}
            >
              {product.productName}
            </div>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto mb-6">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Company</th>
              <th>Brand</th>
              <th>Units</th>
              <th>Per Sell Price</th>
              <th>Per Retail Price</th>
              <th>Per Purchase Price</th>
              <th>Purchase Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.length > 0 ? (
              selectedProducts.map((product, index) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.company}</td>
                  <td>{product.brand}</td>
                  <td>{product.units}</td>
                  <td>
                    <input
                      type="number"
                      className="input input-bordered input-sm"
                      placeholder="Per Sell Price"
                      value={product.sellPrice}
                      onChange={(e) =>
                        updateProductField(index, 'sellPrice', parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input input-bordered input-sm"
                      placeholder="Per Retail Price"
                      value={product.retailPrice}
                      onChange={(e) =>
                        updateProductField(index, 'retailPrice', parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input input-bordered input-sm"
                      placeholder="Per Purchase Price"
                      value={product.purchasePrice}
                      onChange={(e) =>
                        updateProductField(index, 'purchasePrice', parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input input-bordered input-sm"
                      placeholder="Purchase Quantity"
                      value={product.quantity}
                      onChange={(e) =>
                        updateProductField(index, 'quantity', parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </td>
                  <td>{product.total.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center text-gray-500">
                  No products added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Mode */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">Payment Mode</label>
        <select
          className="select select-bordered w-full"
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
        >
          <option value="Cash">Cash</option>
          <option value="Bank">Bank</option>
        </select>
      </div>

      {/* Total Payment and Credit */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">Total Payment</label>
        <input
          type="number"
          className="input input-bordered w-full mb-2"
          placeholder="Total Payment to Supplier"
          value={totalPayment}
          onChange={(e) => setTotalPayment(parseFloat(e.target.value) || 0)}
        />
        <label className="block text-gray-700 font-medium mb-2">Credit</label>
        <input
          type="number"
          className="input input-bordered w-full"
          placeholder="Credit Amount"
          value={calculateCredit().toFixed(2)}
          readOnly
        />
      </div>

      {/* Display Total Bill */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">Total Bill: ${calculateTotalBill().toFixed(2)}</h2>
      </div>

      {/* Add Purchase Button */}
      <button className="btn btn-success w-full" onClick={handleAddPurchase}>
        Add Purchase
      </button>
    </div>
  );
};

export default NewPurchases;