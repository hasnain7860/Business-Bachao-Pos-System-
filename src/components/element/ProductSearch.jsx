import React from 'react';

const ProductSearch = ({
  searchProduct,
  setSearchProduct,
  products,
  handleOpenAddModal
}) => {
  const filteredProducts = products.filter(product => {
    const productName = product.name || "";
    const productNameUrdu = product.nameInUrdu || "";
    const searchTerm = searchProduct.toLowerCase();

    return productName.toLowerCase().includes(searchTerm) || 
           productNameUrdu.includes(searchTerm);
  });

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <label className="text-sm font-semibold text-gray-600">Search Products:</label>
      <input
        type="text"
        value={searchProduct}
        onChange={(e) => setSearchProduct(e.target.value)}
        placeholder="Search by product name or Urdu name"
        className="input input-bordered w-full"
      />

      {searchProduct && (
        <div className="overflow-y-auto max-h-60 mt-2 border rounded-lg">
          {products.length === 0 ? (
            <div className="p-2">No products available.</div>
          ) : (
            filteredProducts.map(product =>
              product.batchCode && product.batchCode.length > 0 ? (
                <div key={product.id} className="p-2 border-b last:border-b-0">
                  <div className="pl-4">
                    {product.batchCode.map(batch => (
                      <div key={batch.batchCode} className="flex justify-between items-center py-1">
                        <span>
                          {product.name || "Unnamed Product"} ({product.nameInUrdu || "نام نہیں"}) - 
                          Batch: {batch.batchCode} - Stock: {batch.quantity}
                        </span>
                        {batch.quantity > 0 ? (
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => handleOpenAddModal(product, batch)}
                          >
                            Add Batch
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-xs btn-outline"
                            disabled
                          >
                            Out of Stock
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;