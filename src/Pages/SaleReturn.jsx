import React, { useState } from 'react';
import { useAppContext } from '../Appfullcontext';
import { FaSearch, FaUndo } from "react-icons/fa";

const SaleReturn = () => {
    const context = useAppContext();
    const sales = context.SaleContext.Sales;
    const [searchRef, setSearchRef] = useState('');
    const [filteredSales, setFilteredSales] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    
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
    };

    const handleReturnProduct = (product) => {
        context.ProductContext.addProduct(product);
        setSelectedSale(prevSale => ({
            ...prevSale,
            products: prevSale.products.filter(p => p.id !== product.id)
        }));
        alert(`${product.name} has been returned and added back to inventory.`);
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
                        <h4 className="mt-2 font-semibold">Products:</h4>
                        <ul>
                            {selectedSale.products.map(product => (
                                <li key={product.id} className="flex justify-between items-center border-b py-2">
                                    <span>{product.name} - {product.SellQuantity}</span>
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
