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
              {['no.','Product', 'Batch', 'Qty', 'Price', 'Stock Left', 'Disc%', 'Total', 'Action'].map((heading) => (
                <th key={heading} className="text-white font-semibold text-xs md:text-sm whitespace-nowrap px-2">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* CRITICAL CHANGE: 
              We create a copy of the array with [...selectedProducts] and then .reverse() it.
              This ensures the last item added (at the end of the array) shows up at the top of the table.
            */}
            {[...selectedProducts].reverse().map((product, i) => {
              
              // Logic to check if stock is low based on Pieces
              const remainingStock = product.batchQuantity - product.SellQuantity;
              
              return (
              <tr key={`${product.id}-${product.batchCode}`} className="hover:bg-blue-50 transition-colors">
                  {/* Row number is generated based on the reversed index, so the top item is always '1' */}
                  <td className="font-medium text-gray-700 text-xs md:text-sm px-2">{i+1}</td>
                  
                  {/* Product Name + Unit Indicator */}
                  <td className="font-medium text-gray-700 text-xs md:text-sm px-2">
                      {product.name}
                      <div className="text-[10px] text-gray-500">
                          Mode: {product.unitMode === 'secondary' ? 'Secondary (Carton)' : 'Base (Piece)'}
                      </div>
                  </td>
                  
                  <td className="text-purple-600 font-medium text-xs md:text-sm px-2">{product.batchCode}</td>
                  
                  {/* QUANTITY INPUT (Entered Qty) */}
                  <td className="px-2">
                    <div className="flex items-center">
                        <input
                            type="number"
                            // Show user entered value (e.g. 1 Ctn)
                            value={product.enteredQty} 
                            onChange={(e) => handleProductChange(product.id, product.batchCode, 'enteredQty', e.target.value)}
                            min="0"
                            className={`input input-bordered input-info w-16 md:w-20 text-center font-bold text-xs md:text-sm p-1 ${
                                remainingStock < 0 ? 'border-red-500 focus:border-red-500' : ''
                            }`}
                        />
                        <span className="ml-1 text-xs font-bold bg-gray-200 px-1 rounded">
                            {product.unitName || 'Pcs'}
                        </span>
                    </div>
                  </td>

                  {/* PRICE INPUT (Per Unit) */}
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

                  {/* STOCK INDICATOR (Shows Remaining Pieces) */}
                  <td className="px-2">
                    <span className={`px-2 py-1 rounded-full font-medium text-center text-xs md:text-sm whitespace-nowrap ${
                        remainingStock > 10 
                        ? 'bg-green-100 text-green-800'
                        : remainingStock > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                        {remainingStock} Pcs
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
                  
                  {/* TOTAL Calculation */}
                  <td className="text-blue-600 font-bold text-xs md:text-sm px-2 whitespace-nowrap">
                    {/* Calculation: EnteredQty * PricePerUnit */}
                    Rs. {(Number(product.newSellPrice) * Number(product.enteredQty)).toFixed(2)}
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
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SelectedProductsTable;

