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
    const products = context.productContext.products;
    const addProduct = context.productContext.add;
    const editProduct = context.productContext.edit;
   
    const [successMessage, setSuccessMessage] = useState("");
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
            let success = false;
            let errorMessages = [];
            let promises = [];
    
            for (const product of jsonData) {
                if (!isValidUUID(product.id)) {
                    console.error(`Invalid UUID: ${product.id}`);
                    continue;
                }
    
                const batchData = {
                    batchCode: product.batchCode,
                    expirationDate: product.expirationDate,
                    purchasePrice: product.purchasePrice,
                    sellPrice: product.sellPrice,
                    retailPrice: product.retailPrice,
                    quantity: product.quantity
                };
    
                let existingProductIndex = newProducts.findIndex(p => p.id === product.id);
    
                if (existingProductIndex !== -1) {
                    let existingProduct = newProducts[existingProductIndex];
    
                    // **Check if batchCode already exists**
                    if (existingProduct.batchCode.some(b => b.batchCode === batchData.batchCode)) {
                        errorMessages.push(`Batch code '${batchData.batchCode}' already exists for product ${existingProduct.name}`);
                        continue; // Skip this product
                    }
    
                    // **Update batchCode list**
                    existingProduct.batchCode = [...existingProduct.batchCode, batchData];
                    newProducts[existingProductIndex] = existingProduct;
                    promises.push(editProduct(product.id, existingProduct));
                } else {
                    // **New Product Case**
                    const newProduct = {
                        id: product.id,
                        name: product.name || "Unknown Product",
                        companyId: product.companyId || null,
                        brandId: product.brandId || null,
                        unitId: product.unitId || null,
                        productImage: product.productImage || null,
                        batchCode: [batchData]
                    };
                    newProducts.push(newProduct);
                    promises.push(addProduct(newProduct));
                }
            }
    
            // Wait for all async operations to complete
            await Promise.all(promises);
    
            // Update state after processing
            setUpdatedProducts(newProducts);
    
            if (errorMessages.length > 0) {
                setSuccessMessage(errorMessages.join("\n"));
            } else {
                setSuccessMessage(languageData[language].upload_success);
            }
    
            setTimeout(() => setSuccessMessage(""), 5000);
        };
    
        reader.readAsArrayBuffer(file);
    };
    
    

    return (
        <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                {languageData[language].upload_products}
            </h2>

            {successMessage && (
                <div className="p-4 mb-4 text-green-700 bg-green-100 rounded">
                {successMessage}
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
