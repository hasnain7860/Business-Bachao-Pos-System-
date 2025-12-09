import React, { useState, useEffect } from "react";
import { useAppContext } from "../Appfullcontext";
import { FaPlus, FaBarcode } from "react-icons/fa";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';

const AddProduct = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isCopy = searchParams.get("copy") === "true";
  const navigate = useNavigate();
  const context = useAppContext();

  const companies = context.companyContext.data || [];
  const units = context.unitContext.data || [];
  const products = context.productContext.data || []; 
  
  const addProduct = context.productContext.add;
  const updateProduct = context.productContext.edit;

  // State for product details
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(""); 
  
  // --- New Field: Alert Quantity ---
  const [alertQuantity, setAlertQuantity] = useState(""); 

  // --- Secondary Unit Logic ---
  const [hasSecondaryUnit, setHasSecondaryUnit] = useState(false); 
  const [selectedSecondaryUnit, setSelectedSecondaryUnit] = useState(""); 
  const [conversionRate, setConversionRate] = useState(""); 
  // ----------------------------

  const [productName, setProductName] = useState("");
  const [productNameInUrdu, setProductNameInUrdu] = useState("");
  const [barcode, setBarcode] = useState("");
  const [edit, setEdit] = useState(false);

  // State for batch details
  const [batchCode, setBatchCode] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [wholeSalePrice, setWholeSalePrice] = useState(""); 
  const [retailPrice, setRetailPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    if (id) {
      const product = products.find((p) => p.id == id);

      if (product) {
        setProductName(product.name || "");
        setProductNameInUrdu(product.nameInUrdu || "");
        setSelectedCompany(product.companyId || "");
        setSelectedUnit(product.unitId || "");
        setBarcode(product.barcode || "");
        
        // Load Alert Quantity
        setAlertQuantity(product.alertQuantity || "");

        // --- Check for Secondary Unit Data ---
        if (product.secondaryUnitId && product.conversionRate) {
            setHasSecondaryUnit(true);
            setSelectedSecondaryUnit(product.secondaryUnitId);
            setConversionRate(product.conversionRate);
        } else {
            setHasSecondaryUnit(false);
            setSelectedSecondaryUnit("");
            setConversionRate("");
        }

        if (isCopy) {
          const nextBatchNumber = batches.length + 1;
          const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
          setBatchCode(newBatchCode);
          setEdit(false);
        } else {
          if (product.batchCode && Array.isArray(product.batchCode)) {
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
  }, [id, isCopy, products, batches.length]);

  useEffect(() => {
    if (selectedBatch) {
      const batch = batches.find((b) => b.batchCode === selectedBatch);
      if (batch) {
        setExpirationDate(batch.expirationDate);
        setPurchasePrice(batch.purchasePrice);
        setSellPrice(batch.sellPrice);
        setWholeSalePrice(batch.wholeSalePrice || ""); 
        setRetailPrice(batch.retailPrice);
        setQuantity(batch.quantity);
      }
    }
  }, [selectedBatch, batches]);

  const handleAddNewBatch = () => {
    if (!purchasePrice || !sellPrice || !wholeSalePrice || quantity === "") {
      alert("Please fill all the required fields");
      return;
    }

    // --- CHECK 1: Prevent Negative Quantity ---
    if (Number(quantity) < 0) {
        alert("Quantity cannot be negative (Less than 0).");
        return;
    }

    const batchData = {
      batchCode: batchCode,
      expirationDate: expirationDate || "",
      purchasePrice: Number(purchasePrice),
      sellPrice: Number(sellPrice),
      wholeSalePrice: Number(wholeSalePrice),
      retailPrice: Number(retailPrice) || 0,
      quantity: Number(quantity),
      openingStock: Number(quantity),
      openingStockDate: new Date().toISOString(),
      damageQuantity: 0
    };

    setBatches([...batches, batchData]);
    const nextBatchNumber = batches.length + 2;
    const newBatchCode = `BATCH-${String(nextBatchNumber).padStart(3, '0')}`;
    setBatchCode(newBatchCode);

    setExpirationDate("");
    setPurchasePrice("");
    setSellPrice("");
    setWholeSalePrice(""); 
    setRetailPrice("");
    setQuantity("");
  };

  const handleGenerateBarcode = () => {
    const newBarcode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    setBarcode(newBarcode);
  };

  const handleSaveProduct = async () => {
    if (!productName || !selectedUnit ) {
      alert("Please fill all required fields (Name & Base Unit).");
      return;
    }
    
    // --- Validation for Secondary Unit ---
    if (hasSecondaryUnit) {
        if (!selectedSecondaryUnit || !conversionRate || Number(conversionRate) <= 1) {
            alert("Please select Secondary Unit and a valid Conversion Rate (>1).");
            return;
        }
        if (selectedUnit === selectedSecondaryUnit) {
            alert("Base Unit and Secondary Unit cannot be the same.");
            return;
        }
    }

    if (Number(sellPrice) < Number(purchasePrice)) {
      alert("Selling price cannot be less than purchase price");
      return;
    }

    // --- CHECK 2: Prevent Negative Quantity on Save ---
    if (quantity !== "" && Number(quantity) < 0) {
        alert("Quantity cannot be negative.");
        return;
    }

    const existingBatch = edit ? batches.find(b => b.batchCode === selectedBatch) : null;

    let updatedBatches = [...batches];
    
    if (edit && selectedBatch) {
         const currentBatchData = {
            batchCode: selectedBatch,
            expirationDate: expirationDate || "",
            purchasePrice: Number(purchasePrice),
            sellPrice: Number(sellPrice),
            wholeSalePrice: Number(wholeSalePrice),
            retailPrice: Number(retailPrice) || 0,
            quantity: Number(quantity),
            openingStock: existingBatch?.openingStock !== undefined ? existingBatch.openingStock : Number(quantity || 0),
            openingStockDate: existingBatch?.openingStockDate || new Date().toISOString(),
            damageQuantity: existingBatch?.damageQuantity !== undefined ? existingBatch.damageQuantity : 0,
        };
        updatedBatches = batches.map((batch) =>
            batch.batchCode === selectedBatch ? currentBatchData : batch
        );
    } 
    else if (!edit && purchasePrice && quantity !== "") {
        const firstBatch = {
            batchCode: batchCode,
            expirationDate: expirationDate || "",
            purchasePrice: Number(purchasePrice),
            sellPrice: Number(sellPrice),
            wholeSalePrice: Number(wholeSalePrice),
            retailPrice: Number(retailPrice) || 0,
            quantity: Number(quantity),
            openingStock: Number(quantity),
            openingStockDate: new Date().toISOString(),
            damageQuantity: 0
        };
        updatedBatches = [...batches, firstBatch];
    }

    if(updatedBatches.length === 0) {
        alert("Please add at least one batch (Price/Qty details).");
        return;
    }

    const productData = {
      id: isCopy ? uuidv4() : edit ? id : uuidv4(),
      name: productName || "",
      nameInUrdu: productNameInUrdu || "",
      companyId: selectedCompany || "",
      unitId: selectedUnit,
      
      // Save Alert Quantity (default to 0 if empty)
      alertQuantity: alertQuantity ? Number(alertQuantity) : 0,

      secondaryUnitId: hasSecondaryUnit ? selectedSecondaryUnit : null,
      conversionRate: hasSecondaryUnit ? Number(conversionRate) : null,
      
      barcode: barcode,
      batchCode: updatedBatches,
    };

    if (edit && !isCopy) {
      await updateProduct(productData.id, productData);
      alert("Product updated successfully!");
    } else {
      await addProduct(productData);
      alert("Product added successfully!");
    }
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-center mb-8 text-indigo-700 border-b pb-4">
          {edit && !isCopy ? "✏️ Update Product" : "➕ Add New Product"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
                <label className="label"><span className="label-text font-semibold text-gray-700">Product Name (English)*</span></label>
                <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Enter product name" className="input input-bordered w-full bg-gray-50 focus:bg-white transition-colors duration-200 focus:border-indigo-500" required />
            </div>
            <div className="form-control">
                <label className="label"><span className="label-text font-semibold text-gray-700">Product Name (Urdu)</span></label>
                <input type="text" value={productNameInUrdu} onChange={(e) => setProductNameInUrdu(e.target.value)} placeholder="اردو میں نام درج کریں" className="input input-bordered w-full bg-gray-50 focus:bg-white transition-colors duration-200 focus:border-indigo-500"  />
            </div>
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

            {/* --- Unit Configuration --- */}
            <div className="col-span-full bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-600 mb-3">Unit Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Base Unit */}
                    <div className="form-control">
                        <label className="label"><span className="label-text font-semibold text-gray-700">Base Unit (e.g. Pcs)*</span></label>
                        <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="select select-bordered w-full bg-white focus:border-indigo-500">
                            <option value="">Select Base Unit</option>
                            {units.map((unit) => (<option key={unit.id} value={unit.id}>{unit.name}</option>))}
                        </select>
                    </div>

                    {/* Toggle Secondary Unit */}
                    <div className="form-control flex flex-row items-center mt-8 gap-3">
                         <input 
                            type="checkbox" 
                            className="checkbox checkbox-primary"
                            checked={hasSecondaryUnit}
                            onChange={(e) => setHasSecondaryUnit(e.target.checked)}
                         />
                         <span className="label-text font-semibold">Enable Secondary Unit (e.g. Carton)</span>
                    </div>

                    {/* Secondary Unit Fields (Conditional) */}
                    {hasSecondaryUnit && (
                        <>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-semibold text-gray-700">Secondary Unit</span></label>
                                <select value={selectedSecondaryUnit} onChange={(e) => setSelectedSecondaryUnit(e.target.value)} className="select select-bordered w-full bg-white focus:border-indigo-500">
                                    <option value="">Select Second Unit</option>
                                    {units.map((unit) => (<option key={unit.id} value={unit.id}>{unit.name}</option>))}
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-semibold text-gray-700">Conversion Rate</span></label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">1 {units.find(u => u.id === selectedSecondaryUnit)?.name || "Sec.Unit"} = </span>
                                    <input 
                                        type="number" 
                                        value={conversionRate} 
                                        onChange={(e) => setConversionRate(e.target.value)} 
                                        placeholder="Qty" 
                                        className="input input-bordered w-24 text-center bg-white focus:border-indigo-500"
                                    />
                                    <span className="text-sm text-gray-500">{units.find(u => u.id === selectedUnit)?.name || "Base Unit"}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text font-semibold text-gray-700">Product Barcode</span></label>
                <div className="flex items-center gap-2">
                    <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or enter barcode" className="input input-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500"/>
                    <button type="button" onClick={handleGenerateBarcode} className="btn btn-secondary gap-2"><FaBarcode /> Generate</button>
                </div>
            </div>

            {/* --- Alert Quantity Input --- */}
            <div className="form-control">
                <label className="label"><span className="label-text font-semibold text-gray-700">Alert Quantity (Optional)</span></label>
                <input 
                    type="number" 
                    min="0"
                    value={alertQuantity} 
                    onChange={(e) => setAlertQuantity(e.target.value)} 
                    placeholder="Low stock warning at..." 
                    className="input input-bordered w-full bg-gray-50 focus:bg-white focus:border-indigo-500"
                />
            </div>
        </div>

        {/* Batch Section */}
        <div className="col-span-full bg-indigo-50 p-6 rounded-lg my-6 border border-indigo-100">
             <div className="alert alert-info shadow-sm mb-4">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span className="text-xs">Note: Always enter <b>Quantity</b>, <b>Prices</b> according to the <b>Base Unit ({units.find(u => u.id === selectedUnit)?.name || "Selected Unit"})</b>.</span>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 <div className="form-control">
                  <label className="label"><span className="label-text font-semibold text-gray-700">{edit ? "Select Batch Code" : "New Batch Code"}</span></label>
                  {edit ? ( <select value={selectedBatch || ""} onChange={(e) => setSelectedBatch(e.target.value)} className="select select-bordered w-full bg-white focus:border-indigo-500"><option value="">Select a Batch to Edit</option>{batches.map((batch) => (<option key={batch.batchCode} value={batch.batchCode}>{batch.batchCode}</option>))}</select>) : (<input type="text" value={batchCode} readOnly className="input input-bordered w-full bg-gray-200 cursor-not-allowed"/>)}
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold text-gray-700">Expiration Date</span></label>
                  <input type="date" value={expirationDate || ""} onChange={(e) => setExpirationDate(e.target.value)} className="input input-bordered w-full bg-white focus:border-indigo-500"/>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold text-gray-700">Purchase Price*</span></label>
                  <input required type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="Base Unit Price" className="input input-bordered w-full bg-white focus:border-indigo-500"/>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold text-gray-700">Sell Price*</span></label>
                  <input required type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="Base Unit Price" className="input input-bordered w-full bg-white focus:border-indigo-500"/>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold text-gray-700">Wholesale Price*</span></label>
                  <input required type="number" value={wholeSalePrice} onChange={(e) => setWholeSalePrice(e.target.value)} placeholder="Base Unit Price" className="input input-bordered w-full bg-white focus:border-indigo-500"/>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold text-gray-700">Retail Price (Optional)</span></label>
                  <input type="number" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} placeholder="Base Unit Price" className="input input-bordered w-full bg-white focus:border-indigo-500"/>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold text-gray-700">Quantity*</span></label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    placeholder="Total Base Units (e.g. Total Pcs)" 
                    className="input input-bordered w-full bg-white focus:border-indigo-500"
                  />
                </div>

             </div>

             {!edit && (
                <div className="mt-4">
                  <button type="button" onClick={handleAddNewBatch} className="btn btn-primary btn-block gap-2" disabled={!purchasePrice || !sellPrice || !wholeSalePrice || quantity === ""}><FaPlus /> Add This Batch to List</button>
                </div>
              )}
        </div>
        
        {/* List of Batches Table */}
        {!edit && batches.length > 0 && (
          <div className="col-span-full mb-6">
             <div className="overflow-x-auto border rounded-lg">
              <table className="table table-compact w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3">Batch Code</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Purchase</th>
                    <th className="p-3">Sell</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">{batch.batchCode}</td>
                      <td className="p-3">{batch.quantity}</td>
                      <td className="p-3">{batch.purchasePrice}</td>
                      <td className="p-3">{batch.sellPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mt-8">
            <button type="button" onClick={handleSaveProduct} className="btn btn-primary flex-1 hover:bg-indigo-600 transition-colors duration-200 text-lg py-3">{edit && !isCopy ? "💾 Update Product" : "➕ Save Product"}</button>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-outline hover:bg-gray-100 flex-1 transition-colors duration-200 text-lg py-3">← Back</button>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
