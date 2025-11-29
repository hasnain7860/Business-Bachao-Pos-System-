import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaBoxOpen, FaPlus } from 'react-icons/fa';

const ProductSearch = ({
  searchProduct,
  setSearchProduct,
  products,
  handleOpenAddModal,
  isPreorder = false,
  isPurchase = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  // 1. Flatten the data structure for easier keyboard navigation
  // Instead of nested maps in JSX, we create a linear list of "Selectable Items"
  const flatList = useMemo(() => {
    if (!searchProduct) return [];

    const searchTerm = searchProduct.toLowerCase();
    const filtered = products.filter(product => {
        const productName = product.name || "";
        const productNameUrdu = product.nameInUrdu || "";
        const barcode = product.barcode || "";
        return productName.toLowerCase().includes(searchTerm) || 
               productNameUrdu.includes(searchTerm) || 
               barcode.includes(searchTerm);
    });

    let items = [];
    
    filtered.forEach(product => {
        const hasBatches = product.batchCode && product.batchCode.length > 0;

        // Condition 1: Purchase Mode (Show Product if no batches or explicit logic)
        // OR standard mode where we might want to show product logic (though your original code prioritized batches)
        if (isPurchase && !hasBatches) {
            items.push({
                type: 'product',
                id: `prod-${product.id}`,
                data: product,
                batch: null
            });
        } 
        // Condition 2: Has Batches (Show each batch as a row)
        else if (hasBatches) {
            product.batchCode.forEach((batch, batchIdx) => {
                items.push({
                    type: 'batch',
                    id: `batch-${product.id}-${batchIdx}`,
                    data: product,
                    batch: batch
                });
            });
        }
    });

    return items;
  }, [products, searchProduct, isPurchase]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchProduct]);

  // Scroll to highlighted item logic
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  // Handle Keyboard Navigation
  const handleKeyDown = (e) => {
    if (flatList.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent cursor moving in input
        setSelectedIndex(prev => (prev < flatList.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < flatList.length) {
            const item = flatList[selectedIndex];
            triggerAdd(item);
        }
    }
  };

  const triggerAdd = (item) => {
      // Check stock logic matching your original code
      const isOutOfStock = !isPurchase && !isPreorder && item.type === 'batch' && item.batch.quantity <= 0;
      
      if (isOutOfStock) return; // Prevent adding if out of stock (unless purchase/preorder)

      if (item.type === 'product') {
          handleOpenAddModal(item.data);
      } else {
          handleOpenAddModal(item.data, item.batch);
      }
      
      // Optional: Reset search after add if you want
      // setSearchProduct(""); 
  };

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
                onKeyDown={handleKeyDown} // Attached Key Listener
                placeholder="Scan Barcode or Type Name..."
                className="input input-bordered w-full pl-10"
                autoFocus={true}
                autoComplete="off"
            />
            <span className="absolute left-3 top-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            {/* Helper Text for User */}
            {searchProduct && flatList.length > 0 && (
                <div className="absolute right-2 top-3 text-[10px] text-gray-400 hidden md:block">
                    Use <span className="border rounded px-1">↓</span> <span className="border rounded px-1">↑</span> to select, <span className="border rounded px-1">Enter</span> to add
                </div>
            )}
        </div>
      </div>

      {searchProduct && (
        <div 
            className="overflow-y-auto max-h-60 divide-y divide-gray-100" 
            ref={listRef}
        >
          {flatList.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm flex flex-col items-center">
                <FaBoxOpen className="w-6 h-6 mb-2 opacity-50"/>
                No products found.
            </div>
          ) : (
            flatList.map((item, index) => {
                const product = item.data;
                const batch = item.batch;
                const isSelected = index === selectedIndex;
                
                // Logic derived from your original code
                const isOutOfStock = !isPurchase && !isPreorder && item.type === 'batch' && batch.quantity <= 0;

                return (
                    <div 
                        key={item.id}
                        ref={el => itemRefs.current[index] = el}
                        className={`p-3 cursor-pointer transition-all flex justify-between items-center group border-l-4 
                            ${isSelected ? 'bg-blue-100 border-blue-600' : 'hover:bg-blue-50 border-transparent hover:border-blue-500'}
                        `}
                        onClick={() => triggerAdd(item)}
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 text-sm">
                                    {product.name}
                                </span>
                                {item.type === 'batch' && (
                                    <span className={`badge badge-xs ${isSelected ? 'badge-primary' : 'badge-ghost'}`}>
                                        {batch.batchCode}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                <span>{product.nameInUrdu}</span>
                                {item.type === 'batch' && (
                                    <>
                                        <span className="text-gray-300">|</span>
                                        <span className={batch.quantity > 0 ? "text-green-600 font-semibold" : "text-red-400"}>
                                            Stock: {batch.quantity}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {!isOutOfStock ? (
                            <button
                                type="button"
                                tabIndex="-1" // Prevent Tab focus stopping here
                                className={`btn btn-xs btn-circle ${isSelected ? 'btn-primary opacity-100' : 'btn-ghost opacity-0 group-hover:opacity-100'} transition-opacity`}
                            >
                                <FaPlus />
                            </button>
                        ) : (
                            <span className="text-xs font-bold text-red-300 uppercase px-2 py-1 border border-red-100 rounded bg-red-50">
                                Out of Stock
                            </span>
                        )}
                    </div>
                );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;

