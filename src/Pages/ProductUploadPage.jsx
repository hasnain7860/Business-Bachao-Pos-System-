import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import * as XLSX from "xlsx";
import languageData from "../assets/languageData.json";

const isValidUUID = (id) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const ProductUploadPage = () => {
    const context = useAppContext();
    const { language } = context;
    const { products, add, edit } = context.productContext;
    
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessages, setErrorMessages] = useState([]);
    const [updatedProducts, setUpdatedProducts] = useState([...products]);
    
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            // defval: null yeh sunishchit karta hai ki khaali cells 'null' ke taur par padhe jaayein, 'undefined' nahi.
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });
    
            let newProducts = [...updatedProducts];
            let errors = [];
            let promises = [];
    
            for (const product of jsonData) {
                // --- VALIDATION ---
                if (!product.id || !isValidUUID(product.id)) {
                    errors.push(`Invalid or missing UUID: ${product.id ?? "N/A"}`);
                    continue;
                }
                if (!product.name) {
                    errors.push(`Missing product name in english for ID: ${product.id}`);
                    continue;
                }
                if (!product.batchCode) {
                    errors.push(`Missing batch code for product: ${product.name} (ID: ${product.id})`);
                    continue;
                }
                // --- END VALIDATION ---
    
                // --- FIREBASE SAFE BATCH OBJECT ---
                // Yahan har optional field ko '??' ke saath default value di gayi hai.
                const batchData = {
                    batchCode: product.batchCode, // Yeh validated hai, null nahi hoga
                    expirationDate: product.expirationDate ?? "N/A",     // SAFE: 'N/A' default
                    purchasePrice: product.purchasePrice ?? 0,        // SAFE: 0 default
                    sellPrice: product.sellPrice ?? 0,            // SAFE: 0 default
                    retailPrice: product.retailPrice ?? 0,          // SAFE: 0 default
                    wholesaleRate: product.wholesaleRate ?? 0,      // SAFE: 0 default
                    quantity: product.quantity ?? 0               // SAFE: 0 default
                };
    
                let existingProductIndex = newProducts.findIndex(p => p.id === product.id);
    
                if (existingProductIndex !== -1) {
                    // --- UPDATE EXISTING PRODUCT ---
                    let existingProduct = newProducts[existingProductIndex];
    
                    if (existingProduct.batchCode.some(b => b.batchCode === batchData.batchCode)) {
                        errors.push(`Batch code '${batchData.batchCode}' already exists for product ${existingProduct.name}`);
                        continue;
                    }
                    
                    // Yahan har optional field '??' ke zariye purani value par fallback karta hai.
                    const updatedProduct = {
                        ...existingProduct, 
                        name: product.name ?? existingProduct.name, // SAFE: Laazmi hai (validated)
                        nameInUrdu: product.nameInUrdu ?? existingProduct.nameInUrdu, // SAFE: fallback to old value
                        companyId: product.companyId ?? existingProduct.companyId,   // SAFE: fallback to old value
                        unitId: product.unitId ?? existingProduct.unitId,       // SAFE: fallback to old value
                        productImage: product.productImage ?? existingProduct.productImage, // SAFE: fallback to old value
                        batchCode: [...existingProduct.batchCode, batchData] // SAFE: 'batchData' upar safe banaya hai
                    };

                    newProducts[existingProductIndex] = updatedProduct;
                    promises.push(edit(product.id, updatedProduct));

                } else {
                    // --- ADD NEW PRODUCT ---
                    // Yahan har optional field '??' ke zariye 'null' par fallback karta hai.
                    const newProduct = {
                        id: product.id,     // Laazmi hai (validated)
                        name: product.name, // Laazmi hai (validated)
                        nameInUrdu: product.nameInUrdu ?? null,   // SAFE: null default
                        companyId: product.companyId ?? null,   // SAFE: null default
                        unitId: product.unitId ?? null,     // SAFE: null default
                        productImage: product.productImage ?? null, // SAFE: null default
                        batchCode: [batchData] // SAFE: 'batchData' upar safe banaya hai
                    };
                    newProducts.push(newProduct);
                    promises.push(add(newProduct));
                }
            }
    
            try {
                await Promise.all(promises);
                setUpdatedProducts(newProducts);
        
                if (errors.length > 0) {
                    setErrorMessages(errors);
                } else {
                    setSuccessMessage(languageData[language].upload_success);
                }
            } catch (error) {
                console.error("Error processing uploads:", error);
                setErrorMessages(["An error occurred while saving data. Check console for details."]);
            }
    
            setTimeout(() => {
                setSuccessMessage("");
                setErrorMessages([]);
            }, 5000);
        };
    
        reader.readAsArrayBuffer(file);
    };
    
    return (
        <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                {languageData[language].upload_products}
            </h2>
    
            {successMessage && <div className="p-4 mb-4 text-green-700 bg-green-100 rounded">{successMessage}</div>}
            {errorMessages.length > 0 && (
                <div className="p-4 mb-4 text-red-700 bg-red-100 rounded">
                    <p className="font-bold">Errors found:</p>
                    <ul className="list-disc list-inside">
                        {errorMessages.map((error, index) => (
                            <li key={index}>⚠ {error}</li>
                        ))}
                    </ul>
                </div>
            )}
    
            <p className="text-gray-600 text-sm mb-4">
                {languageData[language].instructions}
            </p>
            <ul className="text-gray-600 text-sm mb-4 list-disc list-inside">
                <li>{languageData[language].instruction_1}</li>
                <li>{languageData[language].instruction_2}</li>
                <li>
                    {languageData[language].instruction_3} {" "}
                    <a
                        href="https://www.uuidgenerator.net/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                    >
                        {languageData[language].generate_uuid}
                    </a>
                </li>
            </ul>
    
            <div className={`flex items-center mb-4 ${language === 'ur' ? 'justify-end' : 'justify-start'} gap-4`}>
                <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    id="file-upload" 
                />
                <label htmlFor="file-upload" className="btn btn-primary cursor-pointer">
                    {languageData[language].upload_products}
                </label>
    
                <a
                    href="/product.xlsx"
                    download="product.xlsx"
                    className="btn btn-secondary"
                >
                    {languageData[language].download_sample}
                </a>
    
                <Link to="/inventory/addProduct">
                    <button className="btn btn-primary">
                        {languageData[language].add_product}
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default ProductUploadPage;


