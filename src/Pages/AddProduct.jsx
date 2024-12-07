
import React, { useState, useEffect } from "react";
import { useAppContext } from "../Appfullcontext";
import { FaPlus, FaSyncAlt } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";

const AddProduct = () => {
  const { id } = useParams(); // Get product ID from URL
  const navigate = useNavigate();
  const context = useAppContext();
  const companies = context.companyContext.companies;
  const brands = context.brandContext.brands;
  const units = context.unitContext.units;
  const addProduct = context.productContext.add;
  const updateProduct = context.productContext.edit;

  const [selectedCompany, setSelectedCompany] = useState();
  const [selectedBrand, setSelectedBrand] = useState();
  const [selectedUnit, setSelectedUnit] = useState();
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [edit, setedit] = useState(false);
  const [preview, setPreview] = useState(""); // For previewing the image

  useEffect(() => {
    if (id) {
      const product = context.productContext.products.find((p) => p.id == id);
      if (product) {
        setProductName(product.productName);
        setSku(product.sku);
        setSelectedCompany(product.companyId);
        setSelectedBrand(product.brandId);
        setSelectedUnit(product.unitId);
        setedit(true);
      }
    }
  }, [edit, id, context.productContext.products]);

  const generateSku = () => {
    setSku(Math.floor(100000 + Math.random() * 900000).toString());
  };

  const handleSaveProduct = () => {
    if (!productName) {
      alert("Product name is required.");
      return;
    }

    const productData = {
      id: edit ? id : Date.now(),
      productName,
      sku,
      companyId: selectedCompany,
      brandId: selectedBrand,
      unitId: selectedUnit,
      productImage,
    };

    if (edit) {
      updateProduct(productData.id, productData);
      alert("Product updated successfully!");
    } else {
      addProduct(productData);
      alert("Product added successfully!");
    }

    // Clear fields if not editing
    if (!edit) {
      setProductName("");
      setSku("");
      setSelectedCompany("");
      setSelectedBrand("");
      setSelectedUnit("");
      setProductImage(null);
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
          <span className="label-text">Product Name:</span>
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

      {/* SKU */}
      <div className="form-control mb-4 flex items-center gap-2">
        <div className="w-full">
          <label className="label">
            <span className="label-text">Product Code (SKU):</span>
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Generate or enter SKU"
            className="input input-bordered w-full"
          />
        </div>
        <button
          type="button"
          onClick={generateSku}
          className="btn btn-outline btn-sm mt-8"
        >
          <FaSyncAlt />
        </button>
      </div>

      {/* Company */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Company:</span>
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
          <span className="label-text">Brand:</span>
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
          <span className="label-text">Unit:</span>
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


