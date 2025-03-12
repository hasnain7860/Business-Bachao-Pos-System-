import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import languageData from "../assets/languageData.json";
import { useNavigate } from "react-router-dom";

const Products = () => {
    const context = useAppContext();
    const navigate = useNavigate();
    const products = context.productContext.products;
    const companies = context.companyContext.companies;
    const addProduct = context.productContext.add;
    const edit = context.productContext.edit;
    const handleDelete = context.productContext.delete;
    const userAndBusinessDetail = context.settingContext.settings;
    const { language } = context;
    const [selectedCompany, setSelectedCompany] = useState(""); // Company Filter ke liye
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(10); // Har page par kitne products dikhane hain

    // Company Filter Function
    const filteredProducts = selectedCompany
        ? products.filter((product) => product.companyId === selectedCompany)
        : products;

    // Pagination Logic
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const [uploadMessage, setUploadMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
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

    const calculateTotalStock = (batchCode) => {
        if (!batchCode || batchCode.length === 0) {
            return 0;
        }
        return batchCode.reduce((total, batch) => total + Number(batch.quantity || 0), 0);
    };

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    const renderPageNumbers = () => {
        const maxPageNumbersToShow = 2;
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

            <div className={`flex items-center mb-4 ${language === 'ur' ? 'justify-end' : 'justify-start'} gap-4`}>
                {/* Add Product Button */}
                <Link to="/inventory/addProduct">
                    <button className="btn btn-primary">
                        {languageData[language].add_product}
                    </button>
                </Link>
            </div>

            {/* Company Filter Dropdown */}
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

            {/* Products Table */}
            <div className="overflow-x-auto mt-4">
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
                        {products && currentProducts.map((product, l) => {
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
                                                    <img src={product.productImage} alt={product.name} className="w-10 h-10 object-cover rounded" />
                                                ) : (
                                                    <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded">
                                                        <span className="text-gray-500">🛒</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 border-b">{companies.find((c) => c.id === product.companyId)?.name || "N/A"}</td>
                                            <td className="p-2 border-b">{product.nameInUrdu}</td>
                                            <td className="p-2 border-b">{product.name}</td>
                                            <td className="p-2 border-b">{l + 1}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-2 border-b">{l + 1}</td>
                                            <td className="p-2 border-b">{product.name}</td>
                                            <td className="p-2 border-b">{product.nameInUrdu}</td>
                                            <td className="p-2 border-b">{companies.find((c) => c.id === product.companyId)?.name || "N/A"}</td>
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
