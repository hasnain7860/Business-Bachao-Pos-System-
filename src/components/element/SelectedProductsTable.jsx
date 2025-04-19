import React from 'react';

const SelectedProductsTable = ({
  selectedProducts,
  handleProductChange,
  handleSellingPriceChange,
  validateSellingPrice,
  handleCancelProduct
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2 md:p-4 shadow-lg">
      <div className="w-full overflow-x-auto">
        <table className="table w-full table-auto">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
            <tr>
              {['Product', 'Batch', 'Qty', 'Price', 'Stock', 'Disc%', 'Total', 'Action'].map((heading) => (
                <th key={heading} className="text-white font-semibold text-xs md:text-sm whitespace-nowrap px-2">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedProducts.map(product => (
              <tr key={`${product.id}-${product.batchCode}`} className="hover:bg-blue-50 transition-colors">
                <td className="font-medium text-gray-700 text-xs md:text-sm px-2">{product.name}</td>
                <td className="text-purple-600 font-medium text-xs md:text-sm px-2">{product.batchCode}</td>
                <td className="px-2">
                  <input
                    type="number"
                    value={product.SellQuantity}
                    onChange={(e) => handleProductChange(product.id, product.batchCode, 'SellQuantity', e.target.value)}
                    min="0"
                    max={product.batchQuantity}
                    className="input input-bordered input-info w-16 md:w-20 text-center font-bold text-xs md:text-sm p-1"
                  />
                </td>
                <td className="px-2">
                  <input
                    type="number"
                    value={product.newSellPrice}
                    onChange={(e) => handleSellingPriceChange(product.id, product.batchCode, e.target.value)}
                    className={`input input-bordered w-16 md:w-20 text-center font-bold text-xs md:text-sm p-1 ${
                      validateSellingPrice(product) ? 'input-error' : 'input-success'
                    }`}
                  />
                </td>
                <td className="px-2">
                  <span className={`px-2 py-1 rounded-full font-medium text-center text-xs md:text-sm ${
                    product.batchQuantity - product.SellQuantity > 10 
                      ? 'bg-green-100 text-green-800'
                      : product.batchQuantity - product.SellQuantity > 5
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.batchQuantity - product.SellQuantity}
                  </span>
                </td>
                <td className="px-2">
                  <input
                    type="number"
                    value={product.discount}
                    readOnly
                    className="input input-bordered input-warning w-14 md:w-16 text-center font-bold text-xs md:text-sm p-1"
                  />
                </td>
                <td className="text-blue-600 font-bold text-xs md:text-sm px-2 whitespace-nowrap">
                  Rs. {(product.newSellPrice * product.SellQuantity).toFixed(2)}
                </td>
                <td className="px-2">
                  <button
                    type="button"
                    className="btn btn-error btn-xs md:btn-sm hover:btn-error-focus transition-colors whitespace-nowrap"
                    onClick={() => handleCancelProduct(product.id, product.batchCode)}
                  >
                    Cancel
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

export default SelectedProductsTable;