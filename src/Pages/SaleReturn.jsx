
import React, { useState } from 'react';
import { useAppContext } from '../Appfullcontext';
import { FaSearch, FaUndo } from "react-icons/fa";

const SaleReturn = () => {
    const context = useAppContext();
    const sales = context.SaleContext.Sales;
    const [searchRef, setSearchRef] = useState('');
    const [filteredSales, setFilteredSales] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [returnQuantities, setReturnQuantities] = useState({});

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchRef(value);

        if (value) {
            const results = sales.filter(sale => sale.salesRefNo.toLowerCase().includes(value.toLowerCase()));
            setFilteredSales(results);
        } else {
            setFilteredSales([]);
        }
    };

    const handleSelectSale = (sale) => {
        setSelectedSale(sale);
        setFilteredSales([]);
        setReturnQuantities({});
    };

    const handleReturnProduct = (product) => {
        const quantityToReturn = returnQuantities[product.id] || 0;
        
        if (quantityToReturn > 0 && quantityToReturn <= product.SellQuantity) {
            context.ProductContext.addProduct({ ...product, SellQuantity: quantityToReturn });
            setSelectedSale(prevSale => ({
                ...prevSale,
                products: prevSale.products.map(p =>
                    p.id === product.id ? { ...p, SellQuantity: p.SellQuantity - quantityToReturn } : p
                ).filter(p => p.SellQuantity > 0)
            }));
            alert(`${quantityToReturn} x ${product.name} has been returned and added back to inventory.`);
        } else {
            alert('Please enter a valid return quantity.');
        }
    };

    const handleQuantityChange = (productId, quantity) => {
        setReturnQuantities(prevQuantities => ({
            ...prevQuantities,
            [productId]: parseInt(quantity, 10) || 0
        }));
    };

    return (
        <div className="p-4 max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaSearch className="w-5 h-5" /> Sale Return
            </h2>
            <div className="relative mb-4">
                <input 
                    type="text" 
                    placeholder="Enter Sale Reference" 
                    value={searchRef} 
                    onChange={handleSearch}
                    className="input input-bordered w-full pr-10"
                />
                <FaSearch className="absolute right-3 top-2.5 w-5 h-5 text-gray-500" />
            </div>

            {filteredSales.length > 0 && (
                <div className="bg-white shadow rounded-lg p-2 mb-4">
                    {filteredSales.map(sale => (
                        <div 
                            key={sale.salesRefNo} 
                            className="cursor-pointer p-2 hover:bg-gray-100 rounded" 
                            onClick={() => handleSelectSale(sale)}
                        >
                            {sale.salesRefNo}
                        </div>
                    ))}
                </div>
            )}

            {selectedSale && (
                <div className="card bg-base-100 shadow-xl mt-4">
                    <div className="card-body">
                        <h3 className="text-lg font-semibold">Sale Details</h3>
                        <p><strong>Reference:</strong> {selectedSale.salesRefNo}</p>
                        <p><strong>Total Bill:</strong> {selectedSale.totalBill}</p>
                        <p><strong>Amount Paid:</strong> {selectedSale.amountPaid}</p>
                        <p><strong>Credit:</strong> {selectedSale.credit}</p>
                        <p><strong>Date Time:</strong> {new Date(selectedSale.dateTime).toLocaleString()}</p>
                        <h4 className="mt-2 font-semibold">Products:</h4>
                        <ul>
                            {selectedSale.products.map(product => (
                                <li key={product.id} className="flex justify-between items-center border-b py-2">
                                    <span>{product.name} - {product.SellQuantity}</span>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max={product.SellQuantity} 
                                        value={returnQuantities[product.id] || ''} 
                                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                        className="input input-sm input-bordered mr-2 w-16"
                                    />
                                    <button className="btn btn-error btn-sm flex items-center" onClick={() => handleReturnProduct(product)}>
                                        <FaUndo className="w-4 h-4 mr-1" /> Return
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaleReturn;
