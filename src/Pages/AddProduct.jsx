import React, { useState, useEffect } from "react";
import { useAppContext } from "../Appfullcontext";
import { FaPlus, FaSyncAlt, FaBarcode } from "react-icons/fa";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';

// Main component for adding or updating a product
const AddProduct = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isCopy = searchParams.get("copy") === "true";
  const navigate = useNavigate();
  const context = useAppContext();

  // Destructuring context values
  const companies = context.companyContext.companies;
  const units = context.unitContext.units;
  const addProduct = context.productContext.add;
  const updateProduct = context.productContext.edit;

  // State for product details
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [productName, setProductName] = useState("");
  const [productNameInUrdu, setProductNameInUrdu] = useState("");
  const [barcode, setBarcode] = useState("");
  const [edit, setEdit] = useState(false);

  // State for batch details
  const [batchCode, setBatchCode] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [wholeSalePrice, setWholeSalePrice] = useState(""); // NEW: Wholesale price state
  const [retailPrice, setRetailPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [batches, setBatches] = useState([]);

  // Effect to load product data when editing or copying
  useEffect(() => {
    if (id) {
      const product = context.productContext.products.find((p) => p.id == id);

      if (product) {
        setProductName(product.name || "");
        setProductNameInUrdu(product.nameInUrdu || "");
        setSelectedCompany(product.companyId || "");
        setSelectedUnit(product.unitId || "");
        setBarcode(product.barcode || "");

        if (isCopy) {
          const nextBatchNumber = batches.length + 1;
          const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
          setBatchCode(newBatchCode);
          setEdit(false);
        } else {
          if (product.batchCode) {
            setBatches(product.batchCode);
          } else {
             const nextBatchNumber = batches.length + 1;
             const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
             setBatchCode(newBatchCode);
          }
          setEdit(true);
        }
      }
    } else {
      const nextBatchNumber = batches.length + 1;
      const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
      setBatchCode(newBatchCode);
    }
  }, [id, isCopy, context.productContext.products, batches.length]);

  // Effect to populate form when a batch is selected in edit mode
  useEffect(() => {
    if (selectedBatch) {
      const batch = batches.find((b) => b.batchCode === selectedBatch);
      if (batch) {
        setExpirationDate(batch.expirationDate);
        setPurchasePrice(batch.purchasePrice);
        setSellPrice(batch.sellPrice);
        setWholeSalePrice(batch.wholeSalePrice || ""); // NEW: Load wholesale price
        setRetailPrice(batch.retailPrice);
        setQuantity(batch.quantity);
      }
    }
  }, [selectedBatch, batches]);

  // Function to handle adding a new batch to the list
  const handleAddNewBatch = () => {
    // UPDATED: Retail price removed from validation
    if (!purchasePrice || !sellPrice || !wholeSalePrice || !quantity) {
      alert("Please fill all the required fields (Purchase, Sell, Wholesale, Quantity) for the current batch first");
      return;
    }

    const batchData = {
      batchCode: batchCode,
      expirationDate: expirationDate || "",
      purchasePrice: purchasePrice,
      sellPrice: sellPrice,
      wholeSalePrice: wholeSalePrice, // NEW: Add wholesale price to batch data
      retailPrice: retailPrice,
      quantity: quantity
    };

    setBatches([...batches, batchData]);
    const nextBatchNumber = batches.length + 2;
    const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
    setBatchCode(newBatchCode);

    // Clear the form fields for the next batch
    setExpirationDate("");
    setPurchasePrice("");
    setSellPrice("");
    setWholeSalePrice(""); // NEW: Clear wholesale price field
    setRetailPrice("");
    setQuantity("");
  };

  const handleGenerateBarcode = () => {
    const newBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    setBarcode(newBarcode);
  };

  const handleSaveProduct = () => {
    if (!productName || !selectedUnit ) {
      alert("Please fill all required fields, including the barcode.");
      return;
    }
    if (Number(sellPrice) < Number(purchasePrice)) {
      alert("Selling price cannot be less than purchase price");
      return;
    }
    if (!purchasePrice) {
      alert("Purchase price must be provided for the batch");
      return;
    }

    const currentBatchData = {
      batchCode: edit ? selectedBatch : batchCode,
      expirationDate: expirationDate || "",
      purchasePrice: purchasePrice || "",
      sellPrice: sellPrice || "",
      wholeSalePrice: wholeSalePrice || "", // NEW: Add wholesale price to final batch data
      retailPrice: retailPrice || "",
      quantity: quantity || "",
    };

    let updatedBatches;
    if (edit) {
      updatedBatches = batches.map((batch) =>
        batch.batchCode === selectedBatch ? currentBatchData : batch
      );
    } else {
      updatedBatches = [...batches, currentBatchData];
    }

    const productData = {
      id: isCopy ? uuidv4() : edit ? id : uuidv4(),
      name: productName || "",
      nameInUrdu: productNameInUrdu || "",
      companyId: selectedCompany || "",
      unitId: selectedUnit,
      barcode: barcode,
      batchCode: updatedBatches,
    };

    if (edit) {
      updateProduct(productData.id, productData);
      alert("Product updated successfully!");
    } else {
      addProduct(productData);
      alert("Product added successfully!");
    }
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-center mb-8 text-indigo-700 border-b pb-4">
          {edit ? "✏️ Update Product" : "➕ Add New Product"}
        </h2>

        {/* ... Product Details Section (No changes here) ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name (English) */}
            <div className="form-control">
                <label className="label"><span className="label-text font-semibold text-gray-700">Product Name (English)*</span></label>
                <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Enter product name" className="input input-bordered w-full bg-gray-50 focus:bg-white transition-colors duration-200 focus:border-indigo-500" required />
            </div>
            {/* Product Name (Urdu) */}
            <div className="form-control">
                <label className="label"><span className="label-text font-semibold text-gray-700">Product Name (Urdu)</span></label>
                <input type="text" value={productNameInUrdu} onChange={(e) => setProductNameInUrdu(e.target.value)} placeholder="اردو میں نام درج کریں" className="input input-bordered w-full bg-gray-50 focus:bg-white transition-colors duration-200 focus:border-indigo-500"  />
            </div>
            {/* Company */}
            <div className="form-control">
                <label className="label"><span className="label-text font-semibold text-gray-700">Company*</span></label>
                <div className="flex items-center gap-2">
                    <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="select select-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500">
                        <option value="">Select a Company</option>
                        {companies.map((company) => (<option key={company.id} value={company.id}>{company.name}</option>))}
                    </select>
                    <button type="button" className="btn btn-primary btn-sm hover:bg-indigo-600" onClick={() => navigate("/inventory/Company")}>New</button>
                </div>
            </div>
            {/* Unit */}
            <div className="form-control">
                <label className="label"><span className="label-text font-semibold text-gray-700">Unit*</span></label>
                <div className="flex items-center gap-2">
                    <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="select select-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500">
                        <option value="">Select a Unit</option>
                        {units.map((unit) => (<option key={unit.id} value={unit.id}>{unit.name}</option>))}
                    </select>
                    <button type="button" className="btn btn-primary btn-sm hover:bg-indigo-600" onClick={() => navigate("/inventory/units")}>New</button>
                </div>
            </div>
            {/* Barcode Section */}
            <div className="form-control col-span-full">
                <label className="label"><span className="label-text font-semibold text-gray-700">Product Barcode</span></label>
                <div className="flex items-center gap-2">
                    <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or enter barcode" className="input input-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500"/>
                    <button type="button" onClick={handleGenerateBarcode} className="btn btn-secondary gap-2" title="Generate a new barcode"><FaBarcode /> Generate</button>
                </div>
            </div>
        </div>


        {/* Batch Section */}
        <div className="col-span-full bg-indigo-50 p-6 rounded-lg my-6 border border-indigo-100">
          <h3 className="font-semibold text-xl text-gray-800 mb-4">Batch Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Batch Code and Expiration Date (No changes here) */}
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold text-gray-700">{edit ? "Select Batch Code" : "New Batch Code"}</span></label>
              {edit ? ( <select value={selectedBatch || ""} onChange={(e) => setSelectedBatch(e.target.value)} className="select select-bordered w-full bg-white focus:border-indigo-500"><option value="">Select a Batch to Edit</option>{batches.map((batch) => (<option key={batch.batchCode} value={batch.batchCode}>{batch.batchCode}</option>))}</select>) : (<input type="text" value={batchCode} readOnly className="input input-bordered w-full bg-gray-200 cursor-not-allowed"/>)}
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold text-gray-700">Expiration Date</span></label>
              <input type="date" value={expirationDate || ""} onChange={(e) => setExpirationDate(e.target.value)} className="input input-bordered w-full bg-white focus:border-indigo-500"/>
            </div>

             {/* Purchase Price */}
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold text-gray-700">Purchase Price*</span></label>
              <input required type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="Enter purchase price" className="input input-bordered w-full bg-white focus:border-indigo-500"/>
            </div>

            {/* Sell Price */}
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold text-gray-700">Sell Price*</span></label>
              <input required type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="Enter sell price" className="input input-bordered w-full bg-white focus:border-indigo-500"/>
            </div>

            {/* NEW: Wholesale Price */}
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold text-gray-700">Wholesale Price*</span></label>
              <input required type="number" value={wholeSalePrice} onChange={(e) => setWholeSalePrice(e.target.value)} placeholder="Enter wholesale price" className="input input-bordered w-full bg-white focus:border-indigo-500"/>
            </div>

            {/* UPDATED: Retail Price (now optional) */}
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold text-gray-700">Retail Price (Optional)</span></label>
              <input type="number" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} placeholder="Enter retail price" className="input input-bordered w-full bg-white focus:border-indigo-500"/>
            </div>

            {/* Quantity */}
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold text-gray-700">Quantity*</span></label>
              <input required type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Enter quantity" className="input input-bordered w-full bg-white focus:border-indigo-500"/>
            </div>
          </div>

          {/* Add Batch Button (only for new products) */}
          {!edit && (
            <div className="mt-4">
              <button type="button" onClick={handleAddNewBatch} className="btn btn-primary btn-block gap-2" disabled={!purchasePrice || !sellPrice || !wholeSalePrice || !quantity}><FaPlus /> Add This Batch to List</button>
            </div>
          )}
        </div>

        {/* List of Added Batches (only for new products) */}
        {!edit && batches.length > 0 && (
          <div className="col-span-full mb-6">
            <h3 className="font-semibold text-lg text-gray-700 mb-2">Added Batches List</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="table table-compact w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3">Batch Code</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3">Purchase Price</th>
                    <th className="p-3">Sell Price</th>
                    <th className="p-3">Wholesale Price</th> {/* NEW Column */}
                    <th className="p-3">Retail Price</th>
                    <th className="p-3">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">{batch.batchCode}</td>
                      <td className="p-3">{batch.expirationDate ? new Date(batch.expirationDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-3">{batch.purchasePrice}</td>
                      <td className="p-3">{batch.sellPrice}</td>
                      <td className="p-3">{batch.wholeSalePrice}</td> {/* NEW Cell */}
                      <td className="p-3">{batch.retailPrice}</td>
                      <td className="p-3">{batch.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mt-8">
            <button type="button" onClick={handleSaveProduct} className="btn btn-primary flex-1 hover:bg-indigo-600 transition-colors duration-200 text-lg py-3">{edit ? "💾 Update Product" : "➕ Save Product"}</button>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-outline hover:bg-gray-100 flex-1 transition-colors duration-200 text-lg py-3">← Back</button>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
