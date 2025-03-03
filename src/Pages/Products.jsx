
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";

const Products = () => {
    const context = useAppContext();
    const products = context.productContext.products;
    const addProduct = context.productContext.add;
    const edit = context.productContext.edit;
    const handleDelete = context.productContext.delete;
    const userAndBusinessDetail = context.settingContext.settings;
    const {language} = context;
    const [uploadMessage, setUploadMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState({});
console.log(products)
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file.name);
            const confirmUpload = window.confirm(`Are you sure you want to upload the file: ${file.name}?`);
            if (confirmUpload) {
                handleFileUpload(file);
            }
        }
    };

    const handleFileUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            const formattedData = jsonData.map((item) => {
                const uniqueId = uuidv4();
                const name = item.name || "";
                if (!name) return null;

                return {
                    brandId: item.brandId ? item.brandId.toString() : '',
                    companyId: item.companyId ? item.companyId.toString() : '',
                    id: uniqueId,
                    name: name,
                    productImage: null,
                    batchCode: item.batchCode || [],
                    unitId: item.unitId ? item.unitId.toString() : '',
                };
            }).filter(item => item !== null);

            if (formattedData.length === 0) {
                setUploadMessage("No valid products found - all entries are missing names.");
                return;
            }

            formattedData.forEach((product) => addProduct(product));
            setUploadMessage("Products uploaded successfully!");
        };
        reader.readAsArrayBuffer(file);
    };

    const handleBatchChange = (productId, batchIndex) => {
        setSelectedBatch((prevState) => ({
            ...prevState,
            [productId]: batchIndex,
        }));
    };

    const renderBatchOptions = (batchCode) => {
        if (!batchCode || batchCode.length === 0) {
            return <option value="">Batch Not Available</option>;
        }
        return batchCode.map((batch, index) => (
            <option key={index} value={index}>
                {batch.batchCode}
            </option>
        ));
    };

    const calculateTotalStock = (batchCode) => {
        if (!batchCode || batchCode.length === 0) {
            return 0;
        }
        return batchCode.reduce((total, batch) => total + Number(batch.quantity || 0), 0);
    };

    return (
        <div className="p-6">
    <div className={`flex items-center mb-4 ${language === 'ur' ? 'justify-end' : 'justify-start'}`}>
    <h1 className="text-2xl font-semibold">{languageData[language].products}</h1>
</div>

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

    <Link to="/inventory/addProduct">
        <button className="btn btn-primary">
            {languageData[language].add_product}
        </button>
    </Link>
</div>



    
            {/* Products Table */}
            <div className="overflow-x-auto">
    <table className="table w-full table-auto border-collapse">
        <thead>
            <tr className={language === 'ur' ? 'text-right' : 'text-left'}>
                {language === 'ur' ? (
                    <>
                        <th className="p-2 border-b">{languageData[language].actions}</th>
                        <th className="p-2 border-b">{languageData[language].retail_price}</th>
                        <th className="p-2 border-b">{languageData[language].sell_price}</th>
                        <th className="p-2 border-b">{languageData[language].purchase_price}</th>
                        <th className="p-2 border-b">{languageData[language].batch_stock}</th>
                        <th className="p-2 border-b">{languageData[language].total_stock}</th>
                        <th className="p-2 border-b">{languageData[language].image}</th>
                        <th className="p-2 border-b">{languageData[language].product_name}</th>
                        <th className="p-2 border-b">{languageData[language].no}</th>
                    </>
                ) : (
                    <>
                        <th className="p-2 border-b">{languageData[language].no}</th>
                        <th className="p-2 border-b">{languageData[language].product_name}</th>
                        <th className="p-2 border-b">{languageData[language].image}</th>
                        <th className="p-2 border-b">{languageData[language].total_stock}</th>
                        <th className="p-2 border-b">{languageData[language].batch_stock}</th>
                        <th className="p-2 border-b">{languageData[language].purchase_price}</th>
                        <th className="p-2 border-b">{languageData[language].sell_price}</th>
                        <th className="p-2 border-b">{languageData[language].retail_price}</th>
                        <th className="p-2 border-b">{languageData[language].actions}</th>
                    </>
                )}
            </tr>
        </thead>
        <tbody>
            {products && products.map((product, l) => {
                const batchIndex = selectedBatch[product.id] || 0;
                const batch = product.batchCode?.[batchIndex] || {};
                const totalStock = calculateTotalStock(product.batchCode);

                return (
                    <tr key={product.id} className="hover:bg-gray-100">
                        {language === 'ur' ? (
                            <>
                                <td className="p-2 border-b">
                                    <Link to={`/inventory/edit-product/${product.id}`}>
                                        <button className="btn btn-warning mr-2">
                                            <FaEdit />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="btn btn-danger"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </td>
                                <td className="p-2 border-b">{batch.retailPrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                <td className="p-2 border-b">{batch.sellPrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                <td className="p-2 border-b">{batch.purchasePrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                <td className="p-2 border-b">
                                    <select 
                                        onChange={(e) => handleBatchChange(product.id, e.target.value)}
                                        value={batchIndex}
                                        className="form-select"
                                    >
                                        {renderBatchOptions(product.batchCode)}
                                    </select>
                                    <div>{batch.quantity || languageData[language].batch_not_available}</div>
                                </td>
                                <td className="p-2 border-b">{totalStock}</td>
                                <td className="p-2 border-b">
                                    {product.productImage ? (
                                        <img src={product.productImage} alt={product.name} className="w-10 h-10 object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 flex items-center justify-center bg-gray-200">
                                            <span className="text-gray-500">🛒</span>
                                        </div>
                                    )}
                                </td>
                                <td className="p-2 border-b">{product.name}</td>
                                <td className="p-2 border-b">{l + 1}</td>
                            </>
                        ) : (
                            <>
                                <td className="p-2 border-b">{l + 1}</td>
                                <td className="p-2 border-b">{product.name}</td>
                                <td className="p-2 border-b">
                                    {product.productImage ? (
                                        <img src={product.productImage} alt={product.name} className="w-10 h-10 object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 flex items-center justify-center bg-gray-200">
                                            <span className="text-gray-500">🛒</span>
                                        </div>
                                    )}
                                </td>
                                <td className="p-2 border-b">{totalStock}</td>
                                <td className="p-2 border-b">
                                    <select 
                                        onChange={(e) => handleBatchChange(product.id, e.target.value)}
                                        value={batchIndex}
                                        className="form-select"
                                    >
                                        {renderBatchOptions(product.batchCode)}
                                    </select>
                                    <div>{batch.quantity || languageData[language].batch_not_available}</div>
                                </td>
                                <td className="p-2 border-b">{batch.purchasePrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                <td className="p-2 border-b">{batch.sellPrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                <td className="p-2 border-b">{batch.retailPrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                <td className="p-2 border-b">
                                    <Link to={`/inventory/edit-product/${product.id}`}>
                                        <button className="btn btn-warning mr-2">
                                            <FaEdit />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="btn btn-danger"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </td>
                            </>
                        )}
                    </tr>
                );
            })}
        </tbody>
    </table>
</div>


        </div>
    );
    
};

export default Products;
