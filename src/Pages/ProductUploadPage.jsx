import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";
import { FaTrash, FaSave, FaExclamationTriangle, FaDownload, FaFileUpload } from 'react-icons/fa';

const ProductUploadPage = () => {
    const context = useAppContext();
    const { language } = context;

    // --- CRITICAL FIX: Universal Store Mapping ---
    // Universal store 'data' return karta hai.
    // Humne alias use kiye taake neeche code change na karna pade.
    const { data: productsData, add, edit } = context.productContext;
    const { data: companiesData } = context.companyContext; 
    const { data: unitsData } = context.unitContext;       
    
    // --- SAFETY CHECK ---
    // Agar data abhi fetch ho raha hai to empty array use karo taake crash na ho
    const products = productsData || [];
    const companies = companiesData || [];
    const units = unitsData || [];

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
        
        // Safety check: agar companies/units empty hain to generic text use karo
        const sampleCompany = companies.length > 0 ? companies[0].name : "General";
        const sampleUnit = units.length > 0 ? units[0].name : "Pcs";

        const dummyData = [
            ["Super Biscuit", "سپر بسکٹ", sampleCompany, sampleUnit, "", "", "BATCH-001", "2025-12-31", 50, 60, 55, 65, 100]
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
            
            // Create maps for faster lookup (Lowercased keys for case-insensitive match)
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
                    // Re-check Unit ID if user types a new unit name
                    const u = units.find(unit => unit.name.toLowerCase().trim() === value.toLowerCase().trim());
                    updated.unitId = u ? u.id : "";
                    updated.isUnitMissing = !u;
                }
                return updated;
            }
            return item;
        }));
    };

    const removePreviewRow = (id) => {
        setPreviewData(prev => prev.filter(item => item.tempId !== id));
    };

    // --- 4. FINAL UPLOAD ---
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

        // Group Data by Product Name
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
                let updatedBatches = [...(dbProduct.batchCode || [])]; // Safety check
                let isModified = false;

                data.batches.forEach(uploadBatch => {
                    const existingBatchIndex = updatedBatches.findIndex(b => b.batchCode === uploadBatch.batchCode);

                    if (existingBatchIndex !== -1) {
                        // Merge Quantity and Update Prices
                        const existingBatch = updatedBatches[existingBatchIndex];
                        const newQuantity = Number(existingBatch.quantity || 0) + Number(uploadBatch.quantity || 0);

                        updatedBatches[existingBatchIndex] = {
                            ...existingBatch,
                            expirationDate: uploadBatch.expirationDate,
                            purchasePrice: uploadBatch.purchasePrice,
                            sellPrice: uploadBatch.sellPrice,
                            wholeSalePrice: uploadBatch.wholeSalePrice,
                            retailPrice: uploadBatch.retailPrice,
                            quantity: newQuantity
                        };
                        isModified = true;
                    } else {
                        // New Batch
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
        setTimeout(() => { setSuccessMessage(""); setErrorMessages([]); }, 5000);
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {isPreviewMode ? "Step 2: Review Data" : "Step 1: Upload Excel"}
                </h2>
                <Link to="/inventory/addProduct" className="text-blue-600 hover:underline">Add Single Product</Link>
            </div>

            {successMessage && <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-lg">{successMessage}</div>}
            {errorMessages.length > 0 && (
                <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
                    {errorMessages.map((e, i) => <div key={i}>{e}</div>)}
                </div>
            )}

            {!isPreviewMode && (
                <div className="bg-white p-10 shadow-xl rounded-2xl border border-gray-200 text-center max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-6">
                        <button onClick={handleDownloadSample} className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
                            <FaDownload /> Download Smart Template
                        </button>
                        <div className="w-full h-px bg-gray-200 relative my-2">
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-400 text-sm">THEN</span>
                        </div>
                        <label className="cursor-pointer flex flex-col items-center gap-4 p-6 border-2 border-dashed border-green-400 rounded-xl hover:bg-green-50 transition-colors w-full">
                            <FaFileUpload className="text-4xl text-green-500" />
                            <span className="text-gray-600 font-semibold">Click to Upload Excel File</span>
                            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>
                </div>
            )}

            {isPreviewMode && (
                <div className="bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">{previewData.length} Rows</span>
                            {previewData.some(p => p.isUnitMissing) && (
                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold flex items-center gap-2">
                                    <FaExclamationTriangle /> Fix Unit Errors
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setIsPreviewMode(false); setPreviewData([]); }} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                            <button onClick={handleFinalUpload} disabled={isProcessing} className={`flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <FaSave /> {isProcessing ? 'Processing...' : 'Confirm & Upload'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[70vh]">
                        <table className="min-w-full text-xs">
                            <thead className="sticky top-0 bg-gray-200 z-10 text-gray-700 uppercase">
                                <tr>
                                    <th className="p-3 text-left">#</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-left">Product Name</th>
                                    <th className="p-3 text-left">Batch Code</th>
                                    <th className="p-3 text-left">Unit (Required)</th>
                                    <th className="p-3 text-left">Company</th>
                                    <th className="p-3 text-left">Purchase</th>
                                    <th className="p-3 text-left">Sale</th>
                                    <th className="p-3 text-left">Qty</th>
                                    <th className="p-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {previewData.map((row, idx) => (
                                    <tr key={row.tempId} className="hover:bg-blue-50 group">
                                        <td className="p-3 font-bold">{idx + 1}</td>
                                        <td className="p-3">
                                            {row.status === 'NEW' ? 
                                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] font-bold">NEW</span> : 
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-bold">UPDATE</span>
                                            }
                                        </td>
                                        <td className="p-3"><input type="text" className="border rounded p-1 w-32 font-bold" value={row.name} onChange={(e) => handlePreviewChange(row.tempId, 'name', e.target.value)}/></td>
                                        <td className="p-3"><input type="text" className={`border rounded p-1 w-24 ${row.isBatchMissing ? 'border-red-500 bg-red-50' : ''}`} value={row.batchCode} onChange={(e) => handlePreviewChange(row.tempId, 'batchCode', e.target.value)} placeholder="Required"/></td>
                                        <td className="p-3">
                                            <div className="flex flex-col">
                                                <input type="text" className={`border rounded p-1 w-24 ${row.isUnitMissing ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`} value={row.baseUnitName} onChange={(e) => handlePreviewChange(row.tempId, 'baseUnitName', e.target.value)} placeholder="Match Settings"/>
                                                {row.isUnitMissing && <span className="text-[9px] text-red-500 font-bold">Not Found</span>}
                                            </div>
                                        </td>
                                        <td className="p-3"><span className="text-gray-500">{row.companyName || '-'}</span></td>
                                        <td className="p-3"><input type="number" className="border rounded p-1 w-16" value={row.purchasePrice} onChange={(e) => handlePreviewChange(row.tempId, 'purchasePrice', e.target.value)} /></td>
                                        <td className="p-3"><input type="number" className="border rounded p-1 w-16" value={row.sellPrice} onChange={(e) => handlePreviewChange(row.tempId, 'sellPrice', e.target.value)} /></td>
                                        <td className="p-3"><input type="number" className="border rounded p-1 w-16 font-bold text-blue-700" value={row.quantity} onChange={(e) => handlePreviewChange(row.tempId, 'quantity', e.target.value)} /></td>
                                        <td className="p-3 text-center"><button onClick={() => removePreviewRow(row.tempId)} className="text-red-500 hover:text-red-700"><FaTrash /></button></td>
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

