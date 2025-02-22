
import React, { useState, useEffect } from "react";
import { useAppContext } from "../Appfullcontext";
import { FaPlus, FaSyncAlt } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
const AddProduct = () => {
  const { id } = useParams(); // Get product ID from URL
  const navigate = useNavigate();
  const context = useAppContext();
  const companies = context.companyContext.companies;
  const brands = context.brandContext.brands;
  const units = context.unitContext.units;
  const addProduct = context.productContext.add;
  const updateProduct = context.productContext.edit;

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [productName, setProductName] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [edit, setEdit] = useState(false);
  const [preview, setPreview] = useState(""); // For previewing the image

  const [batchCode, setBatchCode] = useState(""); // For new batch code
  const [selectedBatch, setSelectedBatch] = useState(null); // For selected batch in update
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const [batches, setBatches] = useState([]); // Array to store batch details

  useEffect(() => {
    if (id) {
      const product = context.productContext.products.find((p) => p.id == id);

      if (product) {
        setProductName(product.name || "");
        setSelectedCompany(product.companyId || "");
        setSelectedBrand(product.brandId || "");
        setSelectedUnit(product.unitId || "");
        if(!product.batchCode){
      const nextBatchNumber = batches.length + 1;
      const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
      setBatchCode(newBatchCode);
    }else{
        setBatches(product.batchCode ); // Set batches from product
        setEdit(true);
    }  }
    } else {
      // Calculate the next batch code for a new product
      const nextBatchNumber = batches.length + 1;
      const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
      setBatchCode(newBatchCode);
    }
  }, [id, context.productContext.products, batches.length]);

  useEffect(() => {
    if (selectedBatch) {
      // Find the batch details for the selected batch code
      const batch = batches.find((b) => b.batchCode === selectedBatch);
      if (batch) {
        setPurchasePrice(batch.purchasePrice);
        setSellPrice(batch.sellPrice);
        setRetailPrice(batch.retailPrice);
        setQuantity(batch.quantity);
      }
    }
  }, [selectedBatch, batches]);

  const handleSaveProduct = () => {
    if (!productName || !selectedCompany || !selectedBrand || !selectedUnit) {
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
      purchasePrice,
      sellPrice,
      retailPrice,
      quantity,
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
      id: edit ? id : uuidv4(),
      name: productName,
      companyId: selectedCompany,
      brandId: selectedBrand,
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
      setSelectedCompany("");
      setSelectedBrand("");
      setSelectedUnit("");
      setProductImage(null);
      setPurchasePrice("");
      setSellPrice("");
      setRetailPrice("");
      setQuantity("");
    }
  };

  
  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result); // Convert file to base64 string for preview
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setProductImage(null);
    setPreview("");
  };

  // Filter brands based on selected company
  const filteredBrands = brands.filter(
    (brand) => brand.companyId == selectedCompany
  );

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-lg p-6 mt-10">
      <h2 className="text-2xl font-bold text-center mb-6">
        {edit ? "Update Product" : "Add Product"}
      </h2>

      {/* Product Name */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Product Name*:</span>
        </label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Enter product name"
          className="input input-bordered w-full"
          required
        />
      </div>

      {/* Company */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Company*:</span>
        </label>
        <div className="flex items-center gap-2">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="select select-bordered w-full"
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
            className="btn btn-outline btn-sm"
            onClick={() => navigate("/inventory/Company")}
          >
            New
          </button>
        </div>
      </div>

      {/* Brand */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Brand*:</span>
        </label>
        <div className="flex items-center gap-2">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
       
            className="select select-bordered w-full"
          >
            <option value="">Select a Brand</option>
            {filteredBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate("/inventory/brands")}
          >
            New
          </button>
        </div>
      </div>

      {/* Unit */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Unit*:</span>
        </label>
        <div className="flex items-center gap-2">
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="select select-bordered w-full"
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
            className="btn btn-outline btn-sm"
            onClick={() => (window.location.href = "/unit")}
          >
            New
          </button>
        </div>
      </div>

      {/* Batch Code */}
      {edit ? (
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Batch Code:</span>
          </label>
          <select
            value={selectedBatch || ""}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="">Select a Batch</option>
            {batches.map((batch) => (
              <option key={batch.batchCode} value={batch.batchCode}>
                {batch.batchCode}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">New Batch Code:</span>
          </label>
          <input
            type="text"
            value={batchCode}
            readOnly
            className="input input-bordered w-full"
          />
        </div>
      )}

      {/* Purchase Price */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Purchase Price *:</span>
        </label>
        <input
        required
          type="number"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          placeholder="Enter purchase price"
          className="input input-bordered w-full"
        />
      </div>

      {/* Sell Price */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Sell Price *:</span>
        </label>
        <input
        required
          type="number"
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
          placeholder="Enter sell price"
          className="input input-bordered w-full"
        />
      </div>

      {/* Retail Price */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Retail Price *:</span>
        </label>
        <input
        required
          type="number"
          value={retailPrice}
          onChange={(e) => setRetailPrice(e.target.value)}
          placeholder="Enter retail price"
          className="input input-bordered w-full"
        />
      </div>

      {/* Quantity */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Quantity *:</span>
        </label>
        <input
        required
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
          className="input input-bordered w-full"
        />
      </div>

      {/* Product Image Upload */}
      <div className="product-image-upload">
        <label className="block mb-2 text-sm font-medium">
          Upload Product Image
        </label>
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Product Preview"
              className="w-32 h-32 object-cover rounded-md border mb-2"
            />
            <button
              type="button"
              className="btn btn-sm btn-error"
              onClick={handleRemoveImage}
            >
              Remove
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input file-input-bordered file-input-primary w-full max-w-xs"
          />
        )}
      </div>

      {/* Add or Update Product Button */}
      <div className="form-control mt-6">
        <button
          type="button"
          onClick={handleSaveProduct}
          className="btn btn-primary w-full"
        >
          {edit ? "Update Product" : "Add Product"}
        </button>
      </div>

      {/* Back Button */}
      <div className="form-control mt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-outline w-full"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default AddProduct;
