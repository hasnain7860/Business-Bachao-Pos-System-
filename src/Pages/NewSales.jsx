
import React, { useState, useEffect , useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../Appfullcontext';
import { v4 as uuidv4 } from 'uuid';
import AddProductModal from '../Components/element/AddProductModal';

const NewSales = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  const customers = context.supplierCustomerContext.customers;
  const products = context.productContext.products;
  const editProduct = context.productContext.edit;
const isPrint = useRef(false);
  const [salesRefNo, setSalesRefNo] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [credit, setCredit] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
const [selectedBatch, setSelectedBatch] = useState(null);
const [selectedModalProduct, setSelectedModalProduct] = useState(null);
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

  const handleAddProduct = (product, batch, quantity = 1) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id && p.batchCode === batch.batchCode);
    if (!existingProduct && batch.quantity > 0) {
      setSelectedProducts([...selectedProducts, { 
        ...product, 
        batchCode: batch.batchCode, 
        SellQuantity: quantity, 
        discount: 0,
        sellPrice: batch.sellPrice, 
        newSellPrice: batch.sellPrice,
        purchasePrice: batch.purchasePrice, 
        batchQuantity: batch.quantity 
      }]);
    }
  };

  const handleProductChange = (id, batchCode, field, value) => {
    if (field === 'SellQuantity') {
      // Convert value to number and ensure it's not negative
      const quantity = Math.max(0, Math.min(Number(value), 
        selectedProducts.find(p => p.id === id && p.batchCode === batchCode)?.batchQuantity || 0
      ));
  
      const updatedProducts = selectedProducts.map(p => {
        if (p.id === id && p.batchCode === batchCode) {
          return { ...p, [field]: quantity };
        }
        return p;
      });
      setSelectedProducts(updatedProducts);
    } else {
      const updatedProducts = selectedProducts.map(p => {
        if (p.id === id && p.batchCode === batchCode) {
          return { ...p, [field]: value };
        }
        return p;
      });
      setSelectedProducts(updatedProducts);
    }
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

  // Add this new function to handle opening the modal
const handleOpenAddModal = (product, batch) => {
  setSelectedModalProduct(product);
  setSelectedBatch(batch);
  setShowAddModal(true);
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

  await context.SaleContext.add(salesData);
  alert('Sales saved successfully!');
if(isPrint.current){
  return salesData;
}

  // Reset form
  setSelectedCustomer('');
  setSelectedProducts([]);
  setPaymentMode('');
  setAmountPaid('');
  setCredit(0);
  generateSalesRefNo();
  setMessage('');
};

const handleSaveAndPrintSales = async () => {
  isPrint.current = true; 
  const salesData = await handleSaveSales();
 
  navigate(`/sales/view/${salesData.id}/print`);
  isPrint.current = false; 
};

  
  const handleCancelProduct = (id, batchCode) => {
    setSelectedProducts(selectedProducts.filter(p => !(p.id === id && p.batchCode === batchCode)));
    handleCalculateCredit();
  };

  return (
    <div className="container mx-auto p-4">
    <h2 className="text-2xl font-bold text-primary mb-6">New Sales</h2>
    
    {message && <div className="text-red-500 mb-4">{message}</div>}
     
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Left Content Area */}
      <div className="flex-1 space-y-4">
        {/* Top Row with responsive grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Sales Reference */}
          <div className="bg-white rounded-lg p-4 shadow">
          <label className="text-sm font-semibold text-gray-600">Sales Reference:</label>
            <input
              type="text"
              value={salesRefNo}
              readOnly
              className="input input-bordered w-full bg-gray-50"
            />
          </div>

         {/* Customer Selection */}
         <div className="bg-white rounded-lg p-4 shadow">
         <div className="flex gap-2">
    <div className="flex-1">
      <label className="text-sm font-semibold text-gray-600">Customer:</label>
      <div className="flex gap-2">
        <div className="relative w-full">
          <input
            type="text"
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            placeholder="Search customer"
            className="input input-bordered w-full"
          />
          {searchCustomer && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {customers
                .filter(customer => 
                  customer.name.toLowerCase().includes(searchCustomer.toLowerCase())
                )
                .map(customer => (
                  <div
                    key={customer.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      setSelectedCustomer(customer.id);
                      setSearchCustomer(customer.name);
                    }}
                  >
                    <span>{customer.name}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/people/customers')}
        >
          + New
        </button>
      </div>
    </div>
  </div>
</div>
</div> 

      {/* Product Search */}
      <div className="bg-white rounded-lg p-4 shadow">
      <label className="text-sm font-semibold text-gray-600">Search Products:</label>
  <input
    type="text"
    value={searchProduct}
    onChange={(e) => setSearchProduct(e.target.value)}
    placeholder="Search by product name or Urdu name"
    className="input input-bordered w-full"
  />
  {searchProduct && (
    <div className="overflow-y-auto max-h-60 mt-2 border rounded-lg">
      {products.length === 0 ? (
        <div className="p-2">No products available.</div>
      ) : (
        products
          .filter(product => {
            const productName = product.name || "";
            const productNameUrdu = product.nameInUrdu || "";
            const searchTerm = searchProduct.toLowerCase();
            
            return productName.toLowerCase().includes(searchTerm) || 
                   productNameUrdu.includes(searchTerm);
          })
          .map(product => (
            product.batchCode && product.batchCode.length > 0 ? (
              <div key={product.id} className="p-2 border-b last:border-b-0">
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
    onClick={() => handleOpenAddModal(product, batch)}
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
  )}
</div>

{/* Products Table with better responsiveness */}
<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2 md:p-4 shadow-lg">
  <div className="w-full">
    <div className="overflow-x-auto">
      <table className="table w-full table-auto">
        <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
          <tr>
            <th className="text-white font-semibold text-xs md:text-sm whitespace-nowrap px-2">Product</th>
            <th className="text-white font-semibold text-xs md:text-sm whitespace-nowrap px-2">Batch</th>
            <th className="text-white font-semibold text-xs md:text-sm whitespace-nowrap px-2">Qty</th>
            <th className="text-white font-semibold text-xs md:text-sm whitespace-nowrap px-2">Price</th>
            <th className="text-white font-semibold text-xs md:text-sm whitespace-nowrap px-2">Stock</th>
            <th className="text-white font-semibold text-xs md:text-sm whitespace-nowrap px-2">Disc%</th>
            <th className="text-white font-semibold text-xs md:text-sm whitespace-nowrap px-2">Total</th>
            <th className="text-white font-semibold text-xs md:text-sm whitespace-nowrap px-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {selectedProducts.map(product => (
            <tr key={`${product.id}-${product.batchCode}`} className="hover:bg-blue-50 transition-colors">
              <td className="font-medium text-gray-700 text-xs md:text-sm px-2">{product.name}</td>
              <td className="text-purple-600 font-medium text-xs md:text-sm px-2">{product.batchCode}</td>
              <td className="px-2">
                <input
                  type="number"
                  value={product.SellQuantity}
                  onChange={(e) => handleProductChange(product.id, product.batchCode, 'SellQuantity', e.target.value)}
                  min="0"
                  max={product.batchQuantity}
                  className="input input-bordered input-info w-16 md:w-20 text-center font-bold text-xs md:text-sm p-1"
                />
              </td>
              <td className="px-2">
                <input
                  type="number"
                  value={product.newSellPrice}
                  onChange={(e) => handleSellingPriceChange(product.id, product.batchCode, e.target.value)}
                  className={`input input-bordered w-16 md:w-20 text-center font-bold text-xs md:text-sm p-1 ${
                    validateSellingPrice(product) ? 'input-error' : 'input-success'
                  }`}
                />
              </td>
              <td className="px-2">
                <span className={`px-2 py-1 rounded-full font-medium text-center text-xs md:text-sm ${
                  product.batchQuantity - product.SellQuantity > 10 
                    ? 'bg-green-100 text-green-800'
                    : product.batchQuantity - product.SellQuantity > 5
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.batchQuantity - product.SellQuantity}
                </span>
              </td>
              <td className="px-2">
                <input
                  type="number"
                  value={product.discount}
                  readOnly
                  className="input input-bordered input-warning w-14 md:w-16 text-center font-bold text-xs md:text-sm p-1"
                />
              </td>
              <td className="text-blue-600 font-bold text-xs md:text-sm px-2 whitespace-nowrap">
                Rs. {(product.newSellPrice * product.SellQuantity).toFixed(2)}
              </td>
              <td className="px-2">
                <button
                  type="button"
                  className="btn btn-error btn-xs md:btn-sm hover:btn-error-focus transition-colors whitespace-nowrap"
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
  </div>
</div></div>

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
        <option value="">Select Payment Mode</option>
        <option value="cash">Cash</option>
        <option value="online">Online</option>
        <option value="bank">Bank</option>
        <option value="cheque">Cheque</option>
      </select>
    </div>

    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg mb-6 shadow-md">
      <label className="text-white text-sm font-semibold block mb-1">Total Bill:</label>
      <div className="text-3xl font-bold text-white">
        Rs. {calculateTotalPayment()}
      </div>
    </div>

    <div className="mb-6">
      <label className="text-sm font-semibold text-gray-600 mb-2 block">Amount Paid:</label>
      <input
        type="number"
        value={amountPaid}
        onChange={handleAmountPaidChange}
        className="input input-bordered w-full bg-white shadow-sm hover:border-green-400 transition-colors text-lg font-semibold"
      />
    </div>

    <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-lg mb-8 shadow-md">
      <label className="text-white text-sm font-semibold block mb-1">Credit Amount:</label>
      <div className="text-3xl font-bold text-white">
        Rs. {credit}
      </div>
    </div>

    <button
      type="button"
      onClick={handleSaveSales}
      className="btn btn-primary w-full mb-3 text-lg font-bold hover:scale-105 transition-transform"
    >
      Save Sales
    </button>
    <button
      type="button"
      onClick={handleSaveAndPrintSales}
      className="btn btn-secondary w-full text-lg font-bold hover:scale-105 transition-transform"
    >
      Save and Print
    </button>
  </div>
</div>
    </div>

    {/* Modal */}
    {showAddModal && (
      <AddProductModal
        product={selectedModalProduct}
        batch={selectedBatch}
        onAdd={(product, batch, quantity) => handleAddProduct(product, batch, quantity)}
        onClose={() => setShowAddModal(false)}
      />
    )}
  </div>
  
  )
};

export default NewSales;
