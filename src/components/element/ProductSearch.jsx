import React from 'react';
import { FaBoxOpen, FaPlus } from 'react-icons/fa';

const ProductSearch = ({
  searchProduct,
  setSearchProduct,
  products,
  handleOpenAddModal,
  isPreorder = false,
  isPurchase = false // NEW PROP: Purchase mode detect karne ke liye
}) => {
  
  // Logic: Name, Urdu Name, or Barcode search
  const filteredProducts = products.filter(product => {
    const productName = product.name || "";
    const productNameUrdu = product.nameInUrdu || "";
    const barcode = product.barcode || "";
    const searchTerm = searchProduct.toLowerCase();

    return productName.toLowerCase().includes(searchTerm) || 
           productNameUrdu.includes(searchTerm) || 
           barcode.includes(searchTerm);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative z-20">
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
            {isPurchase ? "Search Item to Buy" : "Search Item to Sell"}
        </label>
        <div className="relative">
            <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="Scan Barcode or Type Name..."
                className="input input-bordered w-full pl-10"
                autoFocus={true}
            />
            <span className="absolute left-3 top-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
        </div>
      </div>

      {searchProduct && (
        <div className="overflow-y-auto max-h-60 divide-y divide-gray-100">
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm flex flex-col items-center">
                <FaBoxOpen className="w-6 h-6 mb-2 opacity-50"/>
                No products found.
            </div>
          ) : (
            filteredProducts.map(product => {
                // Agar product ke batches hain to batches dikhao, warna product khud dikhao (Purchase ke liye)
                const hasBatches = product.batchCode && product.batchCode.length > 0;
                
                // Purchase Mode mein humein "Out of Stock" se koi matlab nahi.
                // Agar batches nahi hain, tab bhi humein product add karne dena hai.
                if (isPurchase && !hasBatches) {
                    return (
                        <div key={product.id} className="p-3 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center group" onClick={() => handleOpenAddModal(product)}>
                            <div>
                                <div className="font-bold text-gray-800">{product.name}</div>
                                <div className="text-xs text-gray-500">{product.nameInUrdu}</div>
                            </div>
                            <button className="btn btn-sm btn-primary btn-circle">
                                <FaPlus />
                            </button>
                        </div>
                    )
                }

                return (
                  hasBatches ? (
                    <div key={product.id} className="bg-white">
                      {product.batchCode.map((batch, idx) => (
                        <div key={`${product.id}-${idx}`} className="p-3 hover:bg-blue-50 border-l-4 border-transparent hover:border-blue-500 transition-all flex justify-between items-center group">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-sm">{product.name}</span>
                                <span className="badge badge-xs badge-ghost">{batch.batchCode}</span>
                            </div>
                            <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                <span>{product.nameInUrdu}</span>
                                <span className="text-gray-300">|</span>
                                <span className={batch.quantity > 0 ? "text-green-600 font-semibold" : "text-red-400"}>
                                    Stock: {batch.quantity}
                                </span>
                            </div>
                          </div>
                          
                          {/* LOGIC CHANGE: Purchase mein hamesha button dikhao */}
                          {isPurchase || batch.quantity > 0 || isPreorder ? (
                            <button
                              type="button"
                              className="btn btn-xs btn-primary opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                              onClick={() => handleOpenAddModal(product, batch)}
                            >
                              {isPurchase ? "Buy" : "Add"}
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-red-300 uppercase px-2 py-1 border border-red-100 rounded bg-red-50">
                                Out of Stock
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null
                )
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;

