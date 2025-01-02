
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useAppContext } from '../Appfullcontext';
import * as XLSX from 'xlsx';

const Products = () => {
    const context = useAppContext();
    const products = context.productContext.products;
    const addProduct = context.productContext.add;
    const handleDelete = context.productContext.delete;

    const [uploadMessage, setUploadMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    let idCounter = 0;

    const generateUniqueId = () => {
        return (Date.now() + idCounter++).toString(); // Ensure uniqueness by adding a counter 
    };

    const generateSku = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file.name); // Store the selected file name
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

            // Process jsonData to format it as required
            const formattedData = jsonData.map((item) => {
                const name = item.name || ""; // Default to empty string if undefined

                // Check if name is present, return early if not
                if (!name) {
                    return null; // Return null for items without a valid name
                }

                return {
                    brandId: item.brandId ? item.brandId.toString() : '',
                    companyId: item.companyId ? item.companyId.toString() : '',
                    id: generateUniqueId(), // Generate id using Date.now()
                    name: name, // Use the valid name
                    productImage: null,
                    purchasePrice: item.purchasePrice ? item.purchasePrice.toString() : '',
                    retailPrice: item.retailPrice ? item.retailPrice.toString() : '',
                    sellPrice: item.sellPrice ? item.sellPrice.toString() : '',
                    sku: generateSku(), // Generate SKU
                    unitId: item.unitId ? item.unitId.toString() : ''
                };
            }).filter(item => item !== null); // Remove null entries

            // If formattedData is empty, return early
            if (formattedData.length === 0) {
                setUploadMessage("No valid products found - all entries are missing names.");
                return; // Exit if no valid products
            }

            // Call addProduct with the formatted data
            formattedData.forEach((product) => addProduct(product));
            setUploadMessage("Products uploaded successfully!");
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">Products</h1>

            {/* File Upload for Products */}
            <div className="flex items-center mb-4">
                <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    id="file-upload" 
                />
                <label htmlFor="file-upload" className="btn btn-primary cursor-pointer">
                    Upload Products
                </label>
            </div>

            {uploadMessage && (
                <div className="mb-4 text-green-600">
                    {uploadMessage}
                </div>
            )}

            {/* Add Product Button */}
            <Link to="/inventory/addProduct">
                <button className="btn btn-primary mb-4">Add Product</button>
            </Link>

            {/* Responsive Product List Table */}
            <div className="overflow-x-auto">
                <table className="table w-full table-auto border-collapse">
                    <thead>
                        <tr className="text-left">
                            <th className="p-2 border-b">Product Name</th>
                            <th className="p-2 border-b">Image</th>
                            <th className="p-2 border-b">Stock</th>
                            <th className="p-2 border-b">Purchase Price</th>
                            <th className="p-2 border-b">Sell Price</th>
                            <th className="p-2 border-b">Retail Price</th>
                            <th className="p-2 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products && products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-100">
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
                                <td className="p-2 border-b">
                                    {product.quantity > 0 ? product.quantity : <span className="text-red-500">Out of Stock</span>}
                                </td>
                                <td className="p-2 border-b">
                                    {product.purchasePrice ? `$${product.purchasePrice}` : <span className="text-gray-500">Not Available</span>}
                                </td>
                                <td className="p-2 border-b">
                                    {product.sellPrice ? `$${product.sellPrice}` : <span className="text-gray-500">Not Available</span>}
                                </td>
                                <td className="p-2 border-b">
                                    {product.retailPrice ? `$${product.retailPrice}` : <span className="text-gray-500">Not Available</span>}
                                </td>
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Products;
