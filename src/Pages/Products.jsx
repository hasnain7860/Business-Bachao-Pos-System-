import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrashAlt, FaCopy, FaWarehouse } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";
import { useNavigate } from "react-router-dom";

// Setting key for tracking if opening stock has been set
const OPENING_STOCK_KEY = "isOpeningStockSet"; 

const Products = () => {
    const context = useAppContext();
    const navigate = useNavigate();
    
    const products = context.productContext.products;
    const { edit: editProduct, delete: handleDelete } = context.productContext;
    const companies = context.companyContext.companies;
    const { selectedSetting, saveSetting } = context.settingContext;
    const { language } = context;
    
    const [selectedCompany, setSelectedCompany] = useState(""); 
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage, setProductsPerPage] = useState(25); 
    const [searchTerm, setSearchTerm] = useState(""); 
    const [sortOrder, setSortOrder] = useState("asc"); 
    const [message, setMessage] = useState("");
    
    const isOpeningStockSet = selectedSetting[OPENING_STOCK_KEY] === true;

    const calculateTotalStock = (batchCode) => {
        if (!batchCode || batchCode.length === 0) {
            return 0;
        }
        return batchCode.reduce((total, batch) => total + Number(batch.quantity || 0), 0);
    };

    // --- UPDATED FUNCTION: Set Opening Stock with DATE ---
    const handleSetOpeningStock = async () => {
        if (!window.confirm("Are you sure? This will set the CURRENT stock as the OPENING stock. Past purchase records will NOT be shown in the report for this opening balance.")) {
            return;
        }
        
        setMessage("Initializing opening stock... Please wait.");
        let updatedCount = 0;
        const currentDate = new Date().toISOString(); // Save the current timestamp

        for (const product of products) {
            let needsUpdate = false;
            
            const updatedBatchCode = product.batchCode.map(batch => {
                // Only set if not already set
                if (batch.openingStock === undefined || batch.openingStock === null) {
                    needsUpdate = true;
                    return {
                        ...batch,
                        // Set current quantity as Opening
                        openingStock: Number(batch.quantity || 0), 
                        // CRITICAL: Save WHEN we did this. 
                        // Only transactions AFTER this date will be calculated in report columns
                        openingStockDate: currentDate,
                        damageQuantity: 0,
                    };
                }
                // Initialize damage if missing
                if (batch.damageQuantity === undefined || batch.damageQuantity === null) {
                    needsUpdate = true;
                    return { ...batch, damageQuantity: 0 };
                }
                return batch;
            });

            if (needsUpdate) {
                const updatedProduct = {
                    ...product,
                    batchCode: updatedBatchCode
                };
                await editProduct(product.id, updatedProduct);
                updatedCount++;
            }
        }
        
        const updatedSettings = {
            ...selectedSetting,
            [OPENING_STOCK_KEY]: true,
        };
        await saveSetting(updatedSettings);

        setMessage(`Successfully initialized Opening Stock for ${updatedCount} products.`);
    };
    // --- END UPDATED FUNCTION ---

    // ... (Rest of your existing code for Filtering, Sorting, Pagination, Export, Render remains EXACTLY the same) ...
    
    // **Filtering Products Based on Search & Company**
    const filteredProducts = products.filter(product => 
        (selectedCompany ? product.companyId === selectedCompany : true) &&
        (searchTerm ? 
            (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (product.nameInUrdu || '').toLowerCase().includes(searchTerm.toLowerCase()) 
        : true)
    );
    

    // Sorting Products Based on Total Stock
    const sortedProducts = filteredProducts.sort((a, b) => {
        const totalStockA = calculateTotalStock(a.batchCode);
        const totalStockB = calculateTotalStock(b.batchCode);
        return sortOrder === "asc" ? totalStockA - totalStockB : totalStockB - totalStockA;
    });

    // Pagination Logic
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const [selectedBatch, setSelectedBatch] = useState({});

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

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    const renderPageNumbers = () => {
        const maxPageNumbersToShow = 1;
        const halfMaxPageNumbersToShow = Math.floor(maxPageNumbersToShow / 2);
        let startPage = Math.max(1, currentPage - halfMaxPageNumbersToShow);
        let endPage = Math.min(totalPages, currentPage + halfMaxPageNumbersToShow);

        if (currentPage <= halfMaxPageNumbersToShow) {
            endPage = Math.min(totalPages, maxPageNumbersToShow);
        } else if (currentPage + halfMaxPageNumbersToShow >= totalPages) {
            startPage = Math.max(1, totalPages - maxPageNumbersToShow + 1);
        }

        const pageNumbersToShow = pageNumbers.slice(startPage - 1, endPage);

        return (
            <>
                {startPage > 1 && (
                    <>
                        <li className="page-item">
                            <button onClick={() => paginate(1)} className="page-link btn btn-secondary">
                                1
                            </button>
                        </li>
                        {startPage > 2 && <li className="page-item">...</li>}
                    </>
                )}
                {pageNumbersToShow.map((number) => (
                    <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                        <button
                            onClick={() => paginate(number)}
                            className={`page-link btn ${currentPage === number ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            {number}
                        </button>
                    </li>
                ))}
                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <li className="page-item">...</li>}
                        <li className="page-item">
                            <button onClick={() => paginate(totalPages)} className="page-link btn btn-secondary">
                                {totalPages}
                            </button>
                        </li>
                    </>
                )}
            </>
        );
    };

    const handleSort = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    };

    const exportToExcel = () => {
        const flattenedData = filteredProducts.flatMap(product => 
            (product.batchCode || []).map(batch => ({
                ProductName: product.name,
                ProductNameInUrdu: product.nameInUrdu,
                Company: companies.find(c => c.id === product.companyId)?.name || "N/A",
                BatchCode: batch.batchCode,
                Quantity: batch.quantity,
                PurchasePrice: batch.purchasePrice,
                SellPrice: batch.sellPrice,
                RetailPrice: batch.retailPrice
            }))
        );
    
        const worksheet = XLSX.utils.json_to_sheet(flattenedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
        XLSX.writeFile(workbook, "products.xlsx");
    };

    return (
        <div className="p-6">
            {/* Back Button */}
            <div className={`mb-4 flex ${language === "ur" ? "justify-end" : "justify-start"}`}>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-gray-500 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-gray-600 transition duration-200"
                >
                    {language === "ur" ? null : "🔙"}
                    <span>{languageData[language].back}</span>
                    {language === "ur" ? "🔙" : null}
                </button>
            </div>

            <div className={`flex items-center mb-4 ${language === 'ur' ? 'justify-end' : 'justify-start'}`}>
                <h1 className="text-2xl font-semibold">{languageData[language].products}</h1>
            </div>
            
            {/* Conditional Message Display */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.includes('Successfully') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {message}
                </div>
            )}


            <div className={`flex flex-wrap items-center mb-4 ${language === 'ur' ? 'justify-end' : 'justify-start'} gap-4`}>
                {/* Add Product Button */}
                <Link to="/inventory/addProduct">
                    <button className="btn btn-primary">
                        {languageData[language].add_product}
                    </button>
                </Link>
                
                {/* Export to Excel Button */}
                <button onClick={exportToExcel} className="btn btn-secondary">
                    Export to Excel
                </button>
                
                {/* --- Initialize Opening Stock Button --- */}
                {!isOpeningStockSet && products.length > 0 && (
                    <button 
                        onClick={handleSetOpeningStock} 
                        className="btn bg-yellow-500 text-white hover:bg-yellow-600"
                        title="Set current stock as the baseline for the Inventory Report."
                    >
                        <FaWarehouse className="mr-2" /> Initialize Opening Stock
                    </button>
                )}
            </div>

            {/* **Search Input & Filter** */}
            <div className="flex items-center flex-col gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search Product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded w-1/3"
                />
                <select
                    className="form-select p-2 border rounded"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                >
                    <option value="">{languageData[language].all_companies}</option>
                    {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                            {company.name}
                        </option>
                    ))}
                </select>
                <select
                    className="form-select p-2 border rounded"
                    value={productsPerPage}
                    onChange={(e) => setProductsPerPage(Number(e.target.value))}
                >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                </select>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto mt-4">
                <table className="table w-full table-auto border-collapse">
                    <thead>
                        <tr className={language === 'ur' ? 'text-right' : 'text-left'}>
                            {language === 'ur' ? (
                                <>
                                    <th className="p-2 border-b">Delete</th>
                                    <th className="p-2 border-b">Edit</th>
                                    <th className="p-2 border-b">Copy</th>
                                    <th className="p-2 border-b">{languageData[language].retail_price}</th>
                                    <th className="p-2 border-b">{languageData[language].sell_price}</th>
                                    <th className="p-2 border-b">{languageData[language].purchase_price}</th>
                                    <th className="p-2 border-b">total stock Price</th>
                                    <th className="p-2 border-b">{languageData[language].batch_stock}</th>
                                    <th className="p-2 border-b" onClick={handleSort} style={{ cursor: 'pointer' }}>
                                        {languageData[language].total_stock} {sortOrder === "asc" ? "↑" : "↓"}
                                    </th>
                                    <th className="p-2 border-b">{languageData[language].image}</th>
                                    <th className="p-2 border-b">{languageData[language].company}</th>
                                    <th className="p-2 border-b">{languageData[language].product_name_in_urdu}</th>
                                    <th className="p-2 border-b">{languageData[language].product_name}</th>
                                    <th className="p-2 border-b">{languageData[language].no}</th>
                                </>
                            ) : (
                                <>
                                    <th className="p-2 border-b">{languageData[language].no}</th>
                                    <th className="p-2 border-b">{languageData[language].product_name}</th>
                                    <th className="p-2 border-b">{languageData[language].product_name_in_urdu}</th>
                                    <th className="p-2 border-b">{languageData[language].company}</th>
                                    <th className="p-2 border-b">{languageData[language].image}</th>
                                    <th className="p-2 border-b" onClick={handleSort} style={{ cursor: 'pointer' }}>
                                        {languageData[language].total_stock} {sortOrder === "asc" ? "↑" : "↓"}
                                    </th>
                                    <th className="p-2 border-b">{languageData[language].batch_stock}</th>
                                    <th className="p-2 border-b">total stock Price</th>
                                    <th className="p-2 border-b">{languageData[language].purchase_price}</th>
                                    <th className="p-2 border-b">{languageData[language].sell_price}</th>
                                    <th className="p-2 border-b">{languageData[language].retail_price}</th>
                                    <th className="p-2 border-b">Copy</th>
                                    <th className="p-2 border-b">Edit</th>
                                    <th className="p-2 border-b">Delete</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {products && currentProducts.map((product, l) => {
                            const batchIndex = selectedBatch[product.id] || 0;
                            const batch = product.batchCode?.[batchIndex] || {};
                            const totalStock = calculateTotalStock(product.batchCode);
                            const totalstockprice = product?.batchCode?.reduce((total, batch) => {
                                const quantity = Number(batch.quantity || 0);
                                const purchasePrice = Number(batch.purchasePrice || 0);
                                
                                if (isNaN(quantity) || isNaN(purchasePrice)) {
                                    return total;
                                }
                                
                                return total + (quantity * purchasePrice);
                            }, 0) || 0;
                             return (
                                <tr key={product.id} className="hover:bg-gray-100">
                                    {language === 'ur' ? (
                                        <>
                                            <td className="p-2 border-b">
                                                <button
                                                    onClick={() => {
                                                        console.log(`${languageData[language].areYouSureDelete} - Product: ${product.name}`);
                                                        handleDelete(product.id)
                                                    }}
                                                    className="btn btn-danger"
                                                >
                                                    <FaTrashAlt />
                                                </button>
                                            </td>
                                            <td className="p-2 border-b">
                                                <Link to={`/inventory/edit-product/${product.id}`}>
                                                    <button className="btn btn-warning">
                                                        <FaEdit />
                                                    </button>
                                                </Link>
                                            </td>
                                            <td className="p-2 border-b">
                                                <Link to={`/inventory/addProduct/${product.id}?copy=true`}>   
                                                    <button className="btn btn-info">       
                                                        <FaCopy />
                                                    </button>
                                                </Link>
                                            </td>
                                            <td className="p-2 border-b">{batch.retailPrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                            <td className="p-2 border-b">{batch.sellPrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                            <td className="p-2 border-b">{batch.purchasePrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                            <td className="p-2 border-b">{totalstockprice.toFixed(2)}</td>
                                            
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
                                                    <img src={product.productImage} alt={product.name} className="w-10 h-10 object-cover rounded" />
                                                ) : (
                                                    <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded">
                                                        <span className="text-gray-500">🛒</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 border-b">{companies.find((c) => c.id == product.companyId)?.name || "N/A"}</td>
                                            <td className="p-2 border-b">{product.nameInUrdu}</td>
                                            <td className="p-2 border-b">{product.name}</td>
                                            <td className="p-2 border-b">{l + 1}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-2 border-b">{l + 1}</td>
                                            <td className="p-2 border-b">{product.name}</td>
                                            <td className="p-2 border-b">{product.nameInUrdu}</td>
                                            <td className="p-2 border-b">{companies.find((c) => c.id == product.companyId)?.name || "N/A"}</td>
                                            <td className="p-2 border-b">
                                                {product.productImage ? (
                                                    <img src={product.productImage} alt={product.name} className="w-10 h-10 object-cover rounded" />
                                                ) : (
                                                    <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded">
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
                                            <td className="p-2 border-b">{totalstockprice.toFixed(2)}</td>
                                            <td className="p-2 border-b">{batch.purchasePrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                            <td className="p-2 border-b">{batch.sellPrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                            <td className="p-2 border-b">{batch.retailPrice || <span className="text-gray-500">{languageData[language].not_available}</span>}</td>
                                            <td className="p-2 border-b">
                                                <Link to={`/inventory/addProduct/${product.id}?copy=true`}>   
                                                    <button className="btn btn-info">       
                                                        <FaCopy />
                                                    </button>
                                                </Link>
                                            </td>
                                            <td className="p-2 border-b">
                                                <Link to={`/inventory/edit-product/${product.id}`}>
                                                    <button className="btn btn-warning">
                                                        <FaEdit />
                                                    </button>
                                                </Link>
                                            </td>
                                            <td className="p-2 border-b">
                                                <button
                                                    onClick={() => {
                                                        console.log(`${languageData[language].areYouSureDelete} - Product: ${product.name}`);
                                                        handleDelete(product.id)
                                                    }}
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

            {/* Pagination Controls */}
            <div className="flex justify-center mt-4">
                <nav>
                    <ul className="pagination flex space-x-2">
                        <li className="page-item">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                className="page-link btn btn-secondary"
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                        </li>
                        {renderPageNumbers()}
                        <li className="page-item">
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                className="page-link btn btn-secondary"
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default Products;


