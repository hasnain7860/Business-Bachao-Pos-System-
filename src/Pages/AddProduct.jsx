
import React, { useState, useEffect } from "react";
import { useAppContext } from "../Appfullcontext";
import { FaPlus, FaSyncAlt } from "react-icons/fa";
import { useParams, useNavigate,useSearchParams  } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
const AddProduct = () => {
  const { id } = useParams(); 
  const [searchParams] = useSearchParams();
  const isCopy = searchParams.get("copy") === "true";
  const navigate = useNavigate();
  const context = useAppContext();
  const companies = context.companyContext.companies;
 
  const units = context.unitContext.units;
  const addProduct = context.productContext.add;
  const updateProduct = context.productContext.edit;

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [productName, setProductName] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [productNameInUrdu, setProductNameInUrdu] = useState(null);
  const [edit, setEdit] = useState(false);
  const [preview, setPreview] = useState(""); // For previewing the image

  const [batchCode, setBatchCode] = useState(""); // For new batch code
  const [selectedBatch, setSelectedBatch] = useState(null); // For selected batch in update
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [quantity, setQuantity] = useState("");
const [expirationDate, setExpirationDate] = useState()
  const [batches, setBatches] = useState([]); // Array to store batch details

  useEffect(() => {
    if (id) {
      const product = context.productContext.products.find((p) => p.id == id);

      if (product) {
 console.log(product)
        setProductName(product.name || "");
        setProductNameInUrdu(product.nameInUrdu || "");
        setSelectedCompany(product.companyId || "");
      
        setSelectedUnit(product.unitId || "");
       

   if (isCopy) {
    const nextBatchNumber = batches.length + 1;
    const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
    setBatchCode(newBatchCode);
          setEdit(false); // Edit mode disable karna hoga
        } else {
          if(!product.batchCode){
            const nextBatchNumber = batches.length + 1;
            const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
            setBatchCode(newBatchCode);
          }else{
              setBatches(product.batchCode); // Set batches from product
             }

          setEdit(true);
        }
  
  }
    } else {
      // Calculate the next batch code for a new product
      const nextBatchNumber = batches.length + 1;
      const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
      setBatchCode(newBatchCode);
    }
  }, [id,isCopy, context.productContext.products, batches.length]);

  useEffect(() => {
    if (selectedBatch) {
      // Find the batch details for the selected batch code
      const batch = batches.find((b) => b.batchCode === selectedBatch);
      if (batch) {
        setExpirationDate(batch.expirationDate)
        setPurchasePrice(batch.purchasePrice);
        setSellPrice(batch.sellPrice);
        setRetailPrice(batch.retailPrice);
        setQuantity(batch.quantity);
      }
    }
  }, [selectedBatch, batches]);
// Add this after the existing state declarations
const [showNewBatchForm, setShowNewBatchForm] = useState(false);

// Add this function before the return statement
const handleAddNewBatch = () => {
  if (!purchasePrice || !sellPrice || !retailPrice || !quantity) {
    alert("Please fill all the required fields for the current batch first");
    return;
  }

  const batchData = {
    batchCode: batchCode,
    expirationDate: expirationDate || "",
    purchasePrice: purchasePrice,
    sellPrice: sellPrice,
    retailPrice: retailPrice,
    quantity: quantity
  };

  setBatches([...batches, batchData]);

  // Generate new batch code
  const nextBatchNumber = batches.length + 2;
  const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
  setBatchCode(newBatchCode);

  // Clear the form fields
  setExpirationDate("");
  setPurchasePrice("");
  setSellPrice("");
  setRetailPrice("");
  setQuantity("");
};
  const handleSaveProduct = () => {
    if (!productName || !productNameInUrdu || !selectedCompany || !selectedUnit) {
      alert("Please fill all required fields.");
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

    const batchData = {
  
      batchCode: edit ? selectedBatch : batchCode,
      expirationDate : expirationDate || "",
      purchasePrice : purchasePrice || "",
      sellPrice : sellPrice || "" , 
      retailPrice : retailPrice || "",
      quantity : quantity || "",
    };

    let updatedBatches;
    if (edit) {
      // Update existing batch
      updatedBatches = batches.map((batch) =>
        batch.batchCode === selectedBatch ? batchData : batch
      );
    } else {
      // Add new batch
      updatedBatches = [...batches, batchData];
    }

    const productData = {
      id: isCopy ? uuidv4() : edit ? id : uuidv4(),
      name: productName,
      nameInUrdu: productNameInUrdu,
      companyId: selectedCompany,
     
      unitId: selectedUnit,
      productImage,
      batchCode: updatedBatches, // Save batches
    };

    if (edit) {
      updateProduct(productData.id, productData);
      alert("Product updated successfully!");
      navigate(-1);
      return;
    } else {
      console.log("Saving data log: " + JSON.stringify(productData));
      addProduct(productData);
      alert("Product added successfully!");
      navigate(-1);
      return;
    }

    // Clear fields if not editing
    if (!edit) {
      setProductName("");
      setProductNameInUrdu("");
      setSelectedCompany("");
      setSelectedUnit("");
      setProductImage(null);
      setPurchasePrice("");
      setSellPrice("");
      setRetailPrice("");
      setQuantity("");
      setExpirationDate("");
    }
  };

  
  // Handle image selection
  // const handleImageChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     setProductImage(file);
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setPreview(reader.result); // Convert file to base64 string for preview
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  // // Handle image removal
  // const handleRemoveImage = () => {
  //   setProductImage(null);
  //   setPreview("");
  // };

  // Filter brands based on selected company
 
// ...existing imports and initial code...

return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
    <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
      <h2 className="text-3xl font-bold text-center mb-8 text-indigo-700 border-b pb-4">
        {edit ? "✏️ Update Product" : "➕ Add New Product"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name in English */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold text-gray-700">Product Name (English)*</span>
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
            className="input input-bordered w-full bg-gray-50 focus:bg-white transition-colors duration-200 focus:border-indigo-500"
            required
          />
        </div>

        {/* Product Name in Urdu */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold text-gray-700">Product Name (Urdu)*</span>
          </label>
          <input
            type="text"
            value={productNameInUrdu}
            onChange={(e) => setProductNameInUrdu(e.target.value)}
            placeholder="اردو میں نام درج کریں"
            className="input input-bordered w-full bg-gray-50 focus:bg-white transition-colors duration-200 focus:border-indigo-500"
            required
          />
        </div>

        {/* Company */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold text-gray-700">Company*</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="select select-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500"
            >
              <option value="">Select a Company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary btn-sm hover:bg-indigo-600"
              onClick={() => navigate("/inventory/Company")}
            >
              New
            </button>
          </div>
        </div>

        {/* Unit */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold text-gray-700">Unit*</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="select select-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500"
            >
              <option value="">Select a Unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary btn-sm hover:bg-indigo-600"
              onClick={() => navigate("/inventory/units")}
            >
              New
            </button>
          </div>
        </div>










{/* Batch Section */}
<div className="col-span-full bg-gray-50 p-4 rounded-lg mb-4">
  <div className="flex justify-between items-center mb-4">
    <h3 className="font-semibold text-lg text-gray-700">Batch Information</h3>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Batch Code */}
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold text-gray-700">
          {edit ? "Batch Code" : "New Batch Code"}
        </span>
      </label>
      <div className="flex items-center gap-2">
        {edit ? (
          <select
            value={selectedBatch || ""}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="select select-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500"
          >
            <option value="">Select a Batch</option>
            {batches.map((batch) => (
              <option key={batch.batchCode} value={batch.batchCode}>
                {batch.batchCode}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              type="text"
              value={batchCode}
              readOnly
              className="input input-bordered w-full bg-gray-100"
            />
          </>
        )}
      </div>
    </div>

    {/* Expiration Date */}
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold text-gray-700">Expiration Date</span>
      </label>
      <input
        type="date"
        value={expirationDate || ""}
        onChange={(e) => setExpirationDate(e.target.value)}
        className="input input-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500"
      />
    </div>
  </div>

  {/* Add Batch Button */}
  {!edit && (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleAddNewBatch}
        className="btn btn-primary btn-block gap-2"
        disabled={!purchasePrice || !sellPrice || !retailPrice || !quantity || !expirationDate}
      >
        <FaPlus /> Add Batch
      </button>
    </div>
  )}
</div>

{/* Batches List */}
{!edit && batches.length > 0 && (
  <div className="col-span-full">
    <h3 className="font-semibold text-lg text-gray-700 mb-2">Added Batches</h3>
    <div className="overflow-x-auto">
      <table className="table table-compact w-full">
        <thead>
          <tr>
            <th>Batch Code</th>
            <th>Expiry Date</th>
            <th>Purchase Price</th>
            <th>Sell Price</th>
            <th>Retail Price</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.batchCode}>
              <td>{batch.batchCode}</td>
              <td>{new Date(batch.expirationDate).toLocaleDateString()}</td>
              <td>{batch.purchasePrice}</td>
              <td>{batch.sellPrice}</td>
              <td>{batch.retailPrice}</td>
              <td>{batch.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}





















     





        {/* Prices Section */}
        <div className="col-span-full bg-gray-50 p-4 rounded-lg space-y-4 mt-4">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Price Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Purchase Price */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Purchase Price*</span>
              </label>
              <input
                required
                type="text"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Enter price"
                className="input input-bordered w-full bg-white focus:border-indigo-500"
              />
            </div>

            {/* Sell Price */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Sell Price*</span>
              </label>
              <input
                required
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="Enter price"
                className="input input-bordered w-full bg-white focus:border-indigo-500"
              />
            </div>

            {/* Retail Price */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700">Retail Price*</span>
              </label>
              <input
                required
                type="number"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                placeholder="Enter price"
                className="input input-bordered w-full bg-white focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Quantity */}
        <div className="col-span-full">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-gray-700">Quantity*</span>
            </label>
            <input
              required
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="input input-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <button
          type="button"
          onClick={handleSaveProduct}
          className="btn btn-primary flex-1 hover:bg-indigo-600 transition-colors duration-200"
        >
          {edit ? "💾 Update Product" : "➕ Add Product"}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-outline hover:bg-gray-100 flex-1 transition-colors duration-200"
        >
          ← Back
        </button>
      </div>
    </div>
  </div>
);

// ...rest of the component
};

export default AddProduct;
