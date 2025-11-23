import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";
import { FaTrash, FaSave, FaExclamationTriangle, FaCheckCircle, FaDownload, FaFileUpload } from 'react-icons/fa';

const ProductUploadPage = () => {
    const context = useAppContext();
    const { language } = context;
    const { products, add, edit } = context.productContext;
    const { companies } = context.companyContext; 
    const { units } = context.unitContext;       
    
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessages, setErrorMessages] = useState([]);
    
    const [previewData, setPreviewData] = useState([]); 
    const [isPreviewMode, setIsPreviewMode] = useState(false); 
    const [isProcessing, setIsProcessing] = useState(false);

    // --- 1. DOWNLOAD SAMPLE ---
    const handleDownloadSample = () => {
        const headers = [
            "Product Name (English)", "Product Name (Urdu)", "Company Name", 
            "Base Unit (e.g. Pcs)", "Secondary Unit (e.g. Ctn)", "Conversion Rate", 
            "Batch Code", "Expiry Date (YYYY-MM-DD)", 
            "Purchase Price", "Sell Price", "Wholesale Price", "Retail Price", "Quantity"
        ];
        const dummyData = [
            ["Super Biscuit", "سپر بسکٹ", companies[0]?.name || "General", units[0]?.name || "Pcs", "", "", "BATCH-001", "2025-12-31", 50, 60, 55, 65, 100]
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, ...dummyData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Product_Upload_Template.xlsx");
    };

    // --- 2. PARSE EXCEL ---
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" }); 
    
            let tempPreview = [];
            const companyMap = new Map(companies.map(c => [c.name.toLowerCase().trim(), c.id]));
            const unitMap = new Map(units.map(u => [u.name.toLowerCase().trim(), u.id]));

            for (const [index, row] of jsonData.entries()) {
                const rowNum = index + 2;
                const pName = (row["Product Name (English)"] || "").toString().trim();
                if (!pName) continue; 

                const existingProduct = products.find(p => p.name.toLowerCase() === pName.toLowerCase());
                const status = existingProduct ? "UPDATE" : "NEW";

                const companyNameRaw = (row["Company Name"] || "").toString().trim();
                const baseUnitNameRaw = (row["Base Unit (e.g. Pcs)"] || "").toString().trim();
                const secUnitNameRaw = (row["Secondary Unit (e.g. Ctn)"] || "").toString().trim();

                const companyId = companyMap.get(companyNameRaw.toLowerCase()) || "";
                const unitId = unitMap.get(baseUnitNameRaw.toLowerCase()) || "";
                const secUnitId = secUnitNameRaw ? (unitMap.get(secUnitNameRaw.toLowerCase()) || "") : null;

                const isUnitMissing = !unitId;
                const isBatchMissing = !(row["Batch Code"]);
                
                tempPreview.push({
                    tempId: uuidv4(), 
                    rowNum,
                    status, 
                    name: pName,
                    nameInUrdu: (row["Product Name (Urdu)"] || "").toString().trim(),
                    companyName: companyNameRaw, 
                    companyId: companyId,        
                    baseUnitName: baseUnitNameRaw, 
                    unitId: unitId,                
                    secUnitName: secUnitNameRaw,
                    secUnitId: secUnitId,
                    conversionRate: Number(row["Conversion Rate"]) || null,
                    batchCode: (row["Batch Code"] || "").toString().trim(),
                    expirationDate: (row["Expiry Date (YYYY-MM-DD)"] || "").toString(),
                    purchasePrice: Number(row["Purchase Price"]) || 0,
                    sellPrice: Number(row["Sell Price"]) || 0,
                    wholeSalePrice: Number(row["Wholesale Price"]) || 0,
                    retailPrice: Number(row["Retail Price"]) || 0,
                    quantity: Number(row["Quantity"]) || 0,
                    isUnitMissing,
                    isBatchMissing
                });
            }
            setPreviewData(tempPreview);
            setIsPreviewMode(true);
            event.target.value = null; 
        };
        reader.readAsArrayBuffer(file);
    };

    // --- 3. EDIT HANDLERS ---
    const handlePreviewChange = (id, field, value) => {
        setPreviewData(prev => prev.map(item => {
            if (item.tempId === id) {
                let updated = { ...item, [field]: value };
                if (field === 'baseUnitName') {
                    const unitMap = new Map(units.map(u => [u.name.toLowerCase().trim(), u.id]));
                    const newId = unitMap.get(value.toLowerCase().trim());
                    updated.unitId = newId || "";
                    updated.isUnitMissing = !newId;
                }
                return updated;
            }
            return item;
        }));
    };

    const removePreviewRow = (id) => {
        setPreviewData(prev => prev.filter(item => item.tempId !== id));
    };

    // --- 4. FINAL UPLOAD (UPDATED LOGIC FOR UPDATES) ---
    const handleFinalUpload = async () => {
        const hasErrors = previewData.some(p => p.isUnitMissing || p.isBatchMissing);
        if (hasErrors) {
            setErrorMessages(["Please fix rows marked in RED before uploading."]);
            return;
        }

        setIsProcessing(true);
        let promises = [];
        let processedCount = 0;

        const processedMap = new Map();

        // Group Data
        for (const item of previewData) {
            const qty = Number(item.quantity) || 0;
            const batchData = {
                batchCode: item.batchCode,
                expirationDate: item.expirationDate || "N/A",
                purchasePrice: Number(item.purchasePrice),
                sellPrice: Number(item.sellPrice),
                wholeSalePrice: Number(item.wholeSalePrice),
                retailPrice: Number(item.retailPrice),
                quantity: qty,
                openingStock: qty, 
                openingStockDate: new Date().toISOString(), 
                damageQuantity: 0
            };

            const key = item.name.toLowerCase().trim();
            if (processedMap.has(key)) {
                processedMap.get(key).batches.push(batchData);
            } else {
                processedMap.set(key, { ...item, batches: [batchData] });
            }
        }

        // --- DATABASE SYNC ---
        for (const [keyName, data] of processedMap) {
            const dbProduct = products.find(p => p.name.toLowerCase() === keyName);

            if (dbProduct) {
                // --- UPDATE EXISTING PRODUCT ---
                // Logic Change: Don't filter out existing batches. Instead, merge them.
                
                let updatedBatches = [...dbProduct.batchCode]; // Copy existing
                let isModified = false;

                data.batches.forEach(uploadBatch => {
                    // Check if this batch already exists in DB
                    const existingBatchIndex = updatedBatches.findIndex(b => b.batchCode === uploadBatch.batchCode);

                    if (existingBatchIndex !== -1) {
                        // --- BATCH EXISTS: UPDATE & ADD QUANTITY ---
                        const existingBatch = updatedBatches[existingBatchIndex];
                        
                        // Calculate New Quantity (Old + New)
                        const newQuantity = Number(existingBatch.quantity) + Number(uploadBatch.quantity);

                        updatedBatches[existingBatchIndex] = {
                            ...existingBatch,
                            // Update Prices to latest
                            expirationDate: uploadBatch.expirationDate,
                            purchasePrice: uploadBatch.purchasePrice,
                            sellPrice: uploadBatch.sellPrice,
                            wholeSalePrice: uploadBatch.wholeSalePrice,
                            retailPrice: uploadBatch.retailPrice,
                            
                            // Update Quantity
                            quantity: newQuantity
                        };
                        isModified = true;
                    } else {
                        // --- BATCH IS NEW: ADD IT ---
                        updatedBatches.push(uploadBatch);
                        isModified = true;
                    }
                });
                
                if (isModified) {
                    const updatedProduct = {
                        ...dbProduct,
                        nameInUrdu: dbProduct.nameInUrdu || data.nameInUrdu,
                        companyId: dbProduct.companyId || data.companyId,
                        batchCode: updatedBatches
                    };
                    promises.push(edit(dbProduct.id, updatedProduct));
                    processedCount++;
                }

            } else {
                // --- CREATE NEW PRODUCT ---
                const newProduct = {
                    id: uuidv4(),
                    name: data.name,
                    nameInUrdu: data.nameInUrdu || "",
                    companyId: data.companyId || null,
                    unitId: data.unitId, 
                    secondaryUnitId: data.secUnitId || null,
                    conversionRate: data.conversionRate || null,
                    productImage: null,
                    barcode: Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),
                    batchCode: data.batches
                };
                promises.push(add(newProduct));
                processedCount++;
            }
        }

        try {
            await Promise.all(promises);
            setSuccessMessage(`Successfully processed ${processedCount} products!`);
            setPreviewData([]);
            setIsPreviewMode(false);
        } catch (error) {
            console.error(error);
            setErrorMessages(["Critical Error: Database update failed."]);
        }
        setIsProcessing(false);
        setTimeout(() => { setSuccessMessage(""); setErrorMessages([]); }, 10000);
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {isPreviewMode ? "Step 2: Review Data" : "Step 1: Upload Excel"}
                </h2>
                <Link to="/inventory/addProduct" className="text-blue-600 hover:underline">Add Single Product</Link>
            </div>

            {successMessage && <div className="alert alert-success mb-4 shadow-lg">{successMessage}</div>}
            {errorMessages.length > 0 && (
                <div className="alert alert-error mb-4 shadow-lg">
                    <div className="flex flex-col">{errorMessages.map((e, i) => <span key={i}>{e}</span>)}</div>
                </div>
            )}

            {!isPreviewMode && (
                <div className="bg-white p-10 shadow-xl rounded-2xl border border-gray-200 text-center max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-6">
                        <button onClick={handleDownloadSample} className="btn btn-outline btn-info gap-2 w-full sm:w-auto">
                            <FaDownload /> Download Smart Template
                        </button>
                        <div className="w-full h-px bg-gray-200 relative my-2">
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-400 text-sm">THEN</span>
                        </div>
                        <div className="form-control w-full max-w-xs mx-auto">
                            <label className="label cursor-pointer flex flex-col items-center gap-4 p-6 border-2 border-dashed border-green-400 rounded-xl hover:bg-green-50 transition-colors">
                                <FaFileUpload className="text-4xl text-green-500" />
                                <span className="text-gray-600 font-semibold">Click to Upload Excel File</span>
                                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {isPreviewMode && (
                <div className="bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <div className="badge badge-primary badge-lg">{previewData.length} Rows</div>
                            {previewData.some(p => p.isUnitMissing) && <div className="badge badge-error badge-lg gap-2"><FaExclamationTriangle /> Fix Unit Errors</div>}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setIsPreviewMode(false); setPreviewData([]); }} className="btn btn-ghost text-gray-500">Cancel</button>
                            <button onClick={handleFinalUpload} disabled={isProcessing} className={`btn btn-success text-white gap-2 ${isProcessing ? 'loading' : ''}`}>
                                <FaSave /> Confirm & Upload
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[70vh]">
                        <table className="table table-xs w-full">
                            <thead className="sticky top-0 bg-gray-200 z-10 text-gray-700">
                                <tr>
                                    <th className="w-10">#</th>
                                    <th>Status</th>
                                    <th>Product Name</th>
                                    <th>Batch Code</th>
                                    <th>Unit (Required)</th>
                                    <th>Company</th>
                                    <th>Purchase</th>
                                    <th>Sale</th>
                                    <th>Qty</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, idx) => (
                                    <tr key={row.tempId} className="hover:bg-blue-50 group">
                                        <th>{idx + 1}</th>
                                        <td>
                                            {row.status === 'NEW' ? 
                                                <span className="badge badge-sm badge-success">NEW</span> : 
                                                <span className="badge badge-sm badge-warning">UPDATE</span>
                                            }
                                        </td>
                                        <td><input type="text" className="input input-bordered input-xs w-32 font-bold" value={row.name} onChange={(e) => handlePreviewChange(row.tempId, 'name', e.target.value)}/></td>
                                        <td><input type="text" className={`input input-bordered input-xs w-24 ${row.isBatchMissing ? 'input-error' : ''}`} value={row.batchCode} onChange={(e) => handlePreviewChange(row.tempId, 'batchCode', e.target.value)} placeholder="Required"/></td>
                                        <td>
                                            <div className="flex flex-col">
                                                <input type="text" className={`input input-bordered input-xs w-20 ${row.isUnitMissing ? 'input-error bg-red-50' : 'input-success'}`} value={row.baseUnitName} onChange={(e) => handlePreviewChange(row.tempId, 'baseUnitName', e.target.value)} placeholder="Match Settings"/>
                                                {row.isUnitMissing && <span className="text-[9px] text-red-500 font-bold">Not Found</span>}
                                            </div>
                                        </td>
                                        <td><span className="text-xs text-gray-500">{row.companyName || '-'}</span></td>
                                        <td><input type="number" className="input input-bordered input-xs w-16" value={row.purchasePrice} onChange={(e) => handlePreviewChange(row.tempId, 'purchasePrice', e.target.value)} /></td>
                                        <td><input type="number" className="input input-bordered input-xs w-16" value={row.sellPrice} onChange={(e) => handlePreviewChange(row.tempId, 'sellPrice', e.target.value)} /></td>
                                        <td><input type="number" className="input input-bordered input-xs w-16 font-bold text-blue-700" value={row.quantity} onChange={(e) => handlePreviewChange(row.tempId, 'quantity', e.target.value)} /></td>
                                        <td className="text-center"><button onClick={() => removePreviewRow(row.tempId)} className="btn btn-ghost btn-xs text-red-500 opacity-50 group-hover:opacity-100"><FaTrash /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductUploadPage;


