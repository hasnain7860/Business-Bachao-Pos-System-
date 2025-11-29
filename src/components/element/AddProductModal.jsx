import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from "../../Appfullcontext"; 

const AddProductModal = ({ product, batch, onAdd, onClose, defaultPriceMode }) => {
  const context = useAppContext();
  const units = context.unitContext.units; 
  
  // Ref for auto-focus
  const inputRef = useRef(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedPriceType, setSelectedPriceType] = useState(defaultPriceMode || 'sell');
  const [unitMode, setUnitMode] = useState('base'); 
  
  const hasSecondary = product.secondaryUnitId && product.conversionRate > 1;
  const conversionRate = hasSecondary ? Number(product.conversionRate) : 1;

  const baseUnitName = units.find(u => u.id === product.unitId)?.name || "Pcs";
  const secUnitName = hasSecondary ? (units.find(u => u.id === product.secondaryUnitId)?.name || "Ctn") : "";

  const maxQtyAllowed = unitMode === 'secondary' 
    ? Math.floor(batch.quantity / conversionRate) 
    : batch.quantity;

  const getPriceByType = (type) => {
    const basePrice = type === 'sell' ? batch.sellPrice : batch.wholeSalePrice;
    const safePrice = basePrice ? Number(basePrice) : 0;
    return unitMode === 'secondary' ? safePrice * conversionRate : safePrice;
  };

  // Reset quantity when unit mode changes
  useEffect(() => {
    setQuantity(1);
  }, [unitMode]);

  // Auto-focus logic: Focus and Select All text on mount
  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, []);

  // Handle Input Change (Typing)
  const handleQuantityChange = (e) => {
    const val = e.target.value;

    // 1. Allow empty string so user can clear the input
    if (val === "") {
        setQuantity("");
        return;
    }

    // 2. Parse number
    const numVal = parseInt(val, 10);
    if (isNaN(numVal)) return;

    // 3. Strict Max Limit Enforcement (as requested)
    if (numVal > maxQtyAllowed) {
        setQuantity(maxQtyAllowed);
    } else {
        setQuantity(numVal);
    }
  };

  // Handle Keyboard Navigation (Arrow Keys + Enter)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        setQuantity(prev => {
            const current = prev === "" ? 0 : Number(prev);
            if (current >= maxQtyAllowed) return maxQtyAllowed;
            return current + 1;
        });
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setQuantity(prev => {
            const current = prev === "" ? 0 : Number(prev);
            if (current <= 1) return 1;
            return current - 1;
        });
    } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
    }
  };

  const handleSubmit = () => {
    // Validate before submitting (Convert empty string to 0 for check)
    const finalQty = quantity === "" ? 0 : Number(quantity);

    if (finalQty > 0 && finalQty <= maxQtyAllowed) {
      const basePricePerPiece = selectedPriceType === 'sell' ? batch.sellPrice : batch.wholeSalePrice;
      
      onAdd(
        product, 
        batch, 
        finalQty, 
        basePricePerPiece, 
        selectedPriceType,
        unitMode, 
        conversionRate, 
        unitMode === 'secondary' ? secUnitName : baseUnitName 
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-semibold mb-2 text-blue-800 border-b pb-2">
          Add '{product.name}'
        </h3>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm flex justify-between items-center">
            <span>Batch: <b>{batch.batchCode}</b></span>
            <span className="text-gray-600">
                Stock: <b>{batch.quantity} {baseUnitName}</b> 
                {hasSecondary && <span className="text-xs text-gray-500 ml-1">({Math.floor(batch.quantity/conversionRate)} {secUnitName})</span>}
            </span>
        </div>

        {hasSecondary && (
             <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700 mb-2">Select Unit:</label>
             <div className="flex bg-gray-200 rounded-lg p-1">
               <button
                 onClick={() => setUnitMode('base')}
                 className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                    unitMode === 'base' ? 'bg-white text-blue-700 shadow' : 'text-gray-500'
                 }`}
               >
                 {baseUnitName}
               </button>
               <button
                 onClick={() => setUnitMode('secondary')}
                 className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                    unitMode === 'secondary' ? 'bg-white text-blue-700 shadow' : 'text-gray-500'
                 }`}
               >
                 {secUnitName} (x{conversionRate})
               </button>
             </div>
           </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Price ({unitMode === 'secondary' ? `Per ${secUnitName}` : `Per ${baseUnitName}`}):
          </label>
          <div className="flex rounded-lg shadow-md overflow-hidden border border-gray-200">
            
            <button 
              type="button"
              onClick={() => setSelectedPriceType('sell')}
              className={`flex-1 p-3 text-center transition-all duration-200 ${selectedPriceType === 'sell' 
                  ? 'bg-green-500 text-white font-bold' 
                  : 'bg-white hover:bg-gray-100 text-gray-600'}`}
            >
              <span className="text-xs block">Retailer</span>
              <span className="text-xl">{getPriceByType('sell')}</span>
            </button>

            <button 
              type="button"
              onClick={() => setSelectedPriceType('wholesale')}
              className={`flex-1 p-3 text-center transition-all duration-200 ${selectedPriceType === 'wholesale' 
                  ? 'bg-green-500 text-white font-bold' 
                  : 'bg-white hover:bg-gray-100 text-gray-600 border-l'}`}
            >
              <span className="text-xs block">Wholesaler</span>
              <span className="text-xl">{getPriceByType('wholesale')}</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Quantity ({unitMode === 'secondary' ? secUnitName : baseUnitName}):
          </label>
          <div className="flex items-center gap-4">
            <button 
              className="btn btn-square btn-sm btn-outline btn-error" 
              onClick={() => setQuantity(prev => {
                  const val = prev === "" ? 0 : Number(prev);
                  return Math.max(1, val - 1);
              })}
              tabIndex="-1" // Prevent Tab focus
            > - </button>
            
            <input
              ref={inputRef}
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              onKeyDown={handleKeyDown}
              className="input input-bordered w-24 text-center font-bold text-lg"
              min="1"
              max={maxQtyAllowed}
              placeholder="1"
            />
            
            <button 
              className="btn btn-square btn-sm btn-outline btn-success" 
              onClick={() => setQuantity(prev => {
                  const val = prev === "" ? 0 : Number(prev);
                  return Math.min(maxQtyAllowed, val + 1);
              })}
              tabIndex="-1" // Prevent Tab focus
            > + </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
             Available: {maxQtyAllowed} {unitMode === 'secondary' ? secUnitName : baseUnitName}
          </p>
          {Number(quantity) === maxQtyAllowed && (
            <p className="text-orange-500 text-xs mt-1 text-center font-bold">Max Stock Reached</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={quantity === "" || quantity < 1 || quantity > maxQtyAllowed}
          >
            Add to Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;

