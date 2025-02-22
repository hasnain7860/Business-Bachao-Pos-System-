import React, { useState } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { useAppContext } from '../Appfullcontext';
import { v4 as uuidv4 } from 'uuid';

const NewPurchases = () => {
  const context = useAppContext();
  const suppliers = context.supplierCustomerContext.suppliers;
  const products = context.productContext.products;
  const companies = context.companyContext.companies;
  const brands = context.brandContext.brands;
  const units = context.unitContext.units;
  const updateProduct = context.productContext.edit;
  const addPurchase = context.purchaseContext.add;

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [totalPayment, setTotalPayment] = useState(0);
  const [credit, setCredit] = useState(0);
  const [batchCodes, setBatchCodes] = useState({});

  const handleAddSupplier = () => {
    window.location.href = '/people/suppliers';
  };

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
        quantity: 0,
      };

      const newProduct = {
        id: product.id,
        name: product.name,
        companyId: product.companyId || '',
        brandId: product.brandId || '',
        unitId: product.unitId || '',
        sellPrice: batchInfo.sellPrice,
        retailPrice: batchInfo.retailPrice,
        purchasePrice: batchInfo.purchasePrice,
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
    setTotalPayment(parseFloat(e.target.value) || 0);
    calculateCredit();
  };

  const handleAddPurchase = () => {
    const supplier = suppliers.find((s) => s.id == selectedSupplier);
    const uniqueId = uuidv4();
    console.log(JSON.stringify(selectedProducts) + "selected product jk ")
    const newPurchase = {
      id: uniqueId,
      supplierName: supplier ? supplier.name : '',
      date: currentDate,
      paymentMode,
      products: selectedProducts.map((p) => ({
        id: p.id || "0",
        name: p.name,
        quantity: p.quantity,
        purchasePrice: p.purchasePrice,
        sellPrice: p.sellPrice,
        retailPrice: p.retailPrice,
        batchCode: p.batchCode,
      })),
      totalPayment,
      credit,
      totalBill: calculateTotalBill(),
    };

    selectedProducts.forEach((product) => {
  const existingProduct = products.find((p) => p.id === product.id);
  if (existingProduct) {
    let batches = existingProduct.batchCode || [];
    const currentBatch = batches.find(b => b.batchCode === product.batchCode);
    
    // Check for existing purchase price match
    const purchasePriceMatch = batches.find((batch) => batch.purchasePrice === product.purchasePrice);
    
    if (purchasePriceMatch) {
      // Find the index of the matched batch
      const matchedBatchIndex = batches.findIndex(batch => batch.batchCode === purchasePriceMatch.batchCode);
      
      // Update the matched batch in the batches array
      if (matchedBatchIndex !== -1) {
        batches[matchedBatchIndex].purchasePrice = product.purchasePrice;
        batches[matchedBatchIndex].sellPrice = product.sellPrice;
        batches[matchedBatchIndex].retailPrice = product.retailPrice;
        
        console.log(batches[matchedBatchIndex].quantity + "batches quantiy ")
        batches[matchedBatchIndex].quantity =  Number(Number(batches[matchedBatchIndex].quantity) + Number(product.quantity)) ; // Update quantity
     console.log(batches[matchedBatchIndex].quantity + "batches quantiy ") 
      }
    } else {
      // Create a new batch if no match found
      const nextBatchNumber = batches.length + 1;
      const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
      const newBatch = {
        batchCode: newBatchCode,
        purchasePrice: product.purchasePrice,
        sellPrice: product.sellPrice,
        retailPrice: product.retailPrice,
        quantity: Number(product.quantity),
      };
      batches = [...batches, newBatch]; // Add the new batch to the array
    }

    // Update the product with the modified batches array
    updateProduct(product.id, { ...existingProduct, batchCode: batches });
  }
});



    addPurchase(newPurchase);
    setSelectedProducts([]);
    alert('Purchase added successfully!');
  };

  const filteredProducts = products.filter((product) =>
    product.name && product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-6">New Purchase</h1>

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
          <button className="btn btn-primary btn-sm flex items-center" onClick={handleAddSupplier}>
            <AiOutlinePlus className="mr-1" /> Add Supplier
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">Purchase Date</label>
        <input type="date" className="input input-bordered w-full" max={currentDate} />
      </div>

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
              {product.name}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Company</th>
              <th>Brand</th>
              <th>Units</th>
              <th>Batch Code</th>
              <th>Per Sell Price</th>
              <th>Per Retail Price</th>
              <th>Per Purchase Price</th>
              <th>Purchase Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.length > 0 ? (
              selectedProducts.map((product, index) => {
                const company = companies.find((c) => c.id === product.companyId);
                const brand = brands.find((b) => b.id === product.brandId);
                const unit = units.find((u) => u.id === product.unitId);
                const productBatches = batchCodes[product.id] || [];

                return (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{company ? company.name : 'Unknown Company'}</td>
                    <td>{brand ? brand.name : 'Unknown Brand'}</td>
                    <td>{unit ? unit.name : 'Unknown Unit'}</td>
                    <td>
                      <select
                        value={product.batchCode}
                        onChange={(e) => updateBatchCode(index, e.target.value)}
                        className="select select-bordered input-sm"
                      >
                        {productBatches.map((batch) => (
                          <option key={batch.batchCode} value={batch.batchCode}>
                            {batch.batchCode}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        placeholder="Per Sell Price"
                        value={product.sellPrice}
                        onChange={(e) =>
                          updateProductField(index, 'sellPrice', parseFloat(e.target.value) || '')
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
                          updateProductField(index, 'retailPrice', parseFloat(e.target.value) || '')
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
                          updateProductField(index, 'purchasePrice', parseFloat(e.target.value) || '')
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
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="text-center text-gray-500">
                  No products added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">Total Payment</label>
        <input
          type="number"
          className="input input-bordered w-full mb-2"
          placeholder="Total Payment to Supplier"
          value={totalPayment}
          onChange={handleTotalPaymentChange}
        />
        <label className="block text-gray-700 font-medium mb-2">Credit</label>
        <input
          type="number"
          className="input input-bordered w-full"
          placeholder="Credit Amount"
          value={credit}
          readOnly
        />
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold">Total Bill: ${calculateTotalBill().toFixed(2)}</h2>
      </div>

      <button className="btn btn-success w-full" onClick={handleAddPurchase}>
        Add Purchase
      </button>
    </div>
  );
};

export default NewPurchases;
