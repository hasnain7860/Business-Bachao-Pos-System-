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
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
    
            let newProducts = [...updatedProducts];
            let errors = [];
            let promises = [];
    
            for (const product of jsonData) {
                // --- VALIDATION ---
                if (!product.id || !isValidUUID(product.id)) {
                    errors.push(`Invalid or missing UUID: ${product.id || "N/A"}`);
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
    
                const batchData = {
                    batchCode: product.batchCode,
                    expirationDate: product.expirationDate || "N/A",
                    purchasePrice: product.purchasePrice || 0,
                    sellPrice: product.sellPrice || 0,
                    retailPrice: product.retailPrice || 0,
                    wholesaleRate: product.wholesaleRate || 0, // <-- YAHAN ADD KIYA HAI
                    quantity: product.quantity || 0
                };
    
                let existingProductIndex = newProducts.findIndex(p => p.id === product.id);
    
                if (existingProductIndex !== -1) {
                    // --- LOGIC FIX: PRODUCT UPDATE ---
                    let existingProduct = newProducts[existingProductIndex];
    
                    if (existingProduct.batchCode.some(b => b.batchCode === batchData.batchCode)) {
                        errors.push(`Batch code '${batchData.batchCode}' already exists for product ${existingProduct.name}`);
                        continue;
                    }
                    
                    const updatedProduct = {
                        ...existingProduct, 
                        name: product.name || existingProduct.name,
                        nameInUrdu: product.nameInUrdu || existingProduct.nameInUrdu, 
                        companyId: product.companyId || existingProduct.companyId,
                        unitId: product.unitId || existingProduct.unitId,
                        productImage: product.productImage || existingProduct.productImage,
                        batchCode: [...existingProduct.batchCode, batchData]
                    };

                    newProducts[existingProductIndex] = updatedProduct;
                    promises.push(edit(product.id, updatedProduct));
                    // --- END LOGIC FIX ---

                } else {
                    // --- LOGIC FIX: NEW PRODUCT ---
                    const newProduct = {
                        id: product.id,
                        name: product.name,
                        nameInUrdu: product.nameInUrdu || null,
                        companyId: product.companyId || null,
                        unitId: product.unitId || null,
                        productImage: product.productImage || null,
                        batchCode: [batchData]
                    };
                    newProducts.push(newProduct);
                    promises.push(add(newProduct));
                    // --- END LOGIC FIX ---
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


