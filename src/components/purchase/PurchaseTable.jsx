import React from 'react';
import { FaTrash } from 'react-icons/fa';

const PurchaseTable = ({ products, onUpdateProduct, onRemoveProduct }) => {

    const handleFieldChange = (index, field, value) => {
        onUpdateProduct(index, field, value);
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2 sm:p-4 shadow-lg">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="table w-full table-auto min-w-[1200px]">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <tr>
                            <th className="px-2 py-2">Item</th>
                            <th className="px-2 py-2 w-24">Unit</th>
                            <th className="px-2 py-2 w-20">Qty</th>
                            <th className="px-2 py-2 w-24">Cost</th>
                            <th className="px-2 py-2 w-24">Total</th>
                            <th className="px-2 py-2 w-24">Sell</th>
                            <th className="px-2 py-2 w-24">W.Sale</th>
                            <th className="px-2 py-2 w-24">Retail</th>
                            <th className="px-2 py-2 w-32">Expiry</th>
                            <th className="px-2 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {products.length > 0 ? (products.map((product, index) => (
                        <tr key={product.id + index} className="hover:bg-blue-50 border-b">
                            {/* Name */}
                            <td className="px-2 py-3">
                                <div className="font-bold text-sm">{product.name}</div>
                                <div className="text-[10px] text-gray-500">Batch: {product.batchCode}</div>
                            </td>

                            {/* Unit Mode */}
                            <td className="px-2 py-3">
                                {product.hasSecondary ? (
                                    <select 
                                        value={product.unitMode} 
                                        onChange={(e) => handleFieldChange(index, 'unitMode', e.target.value)}
                                        className="select select-bordered select-xs w-full font-bold text-blue-700"
                                    >
                                        <option value="base">{product.baseUnitName}</option>
                                        <option value="secondary">{product.secUnitName}</option>
                                    </select>
                                ) : (
                                    <span className="badge badge-ghost">{product.baseUnitName}</span>
                                )}
                            </td>

                            {/* Qty */}
                            <td className="px-2 py-3">
                                <input type="number" className="input input-bordered input-sm w-full font-bold" value={product.enteredQty} onChange={(e) => handleFieldChange(index, 'enteredQty', e.target.value)} />
                            </td>

                            {/* Cost */}
                            <td className="px-2 py-3">
                                <input type="number" className="input input-bordered input-sm w-full" value={product.enteredPurchasePrice} onChange={(e) => handleFieldChange(index, 'enteredPurchasePrice', e.target.value)} />
                            </td>

                            {/* Total */}
                            <td className="px-2 py-3">
                                <div className="font-bold text-blue-600">{product.total?.toFixed(0)}</div>
                            </td>

                            {/* Prices (Editable) */}
                            <td className="px-2 py-3"><input type="number" className="input input-bordered input-sm w-full" value={product.sellPrice} onChange={(e) => handleFieldChange(index, 'sellPrice', e.target.value)} /></td>
                            <td className="px-2 py-3"><input type="number" className="input input-bordered input-sm w-full" value={product.wholeSalePrice} onChange={(e) => handleFieldChange(index, 'wholeSalePrice', e.target.value)} /></td>
                            <td className="px-2 py-3"><input type="number" className="input input-bordered input-sm w-full" value={product.retailPrice} onChange={(e) => handleFieldChange(index, 'retailPrice', e.target.value)} /></td>
                            
                            {/* Expiry */}
                            <td className="px-2 py-3">
                                <input type="date" className="input input-bordered input-sm w-full text-xs" value={product.expirationDate || ''} onChange={(e) => handleFieldChange(index, 'expirationDate', e.target.value)} />
                            </td>

                            {/* Remove */}
                            <td className="px-2 py-3 text-center">
                                <button className="btn btn-ghost btn-xs text-red-500" onClick={() => onRemoveProduct(index)}><FaTrash /></button>
                            </td>
                        </tr>))) : (
                            <tr><td colSpan="10" className="text-center py-10 text-gray-400">Search products to add to invoice</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PurchaseTable;

