import React, { useState, useEffect } from 'react';
import { useAppContext } from "../../Appfullcontext"; 

const AddProductModal = ({ product, batch, onAdd, onClose, defaultPriceMode }) => {
  const context = useAppContext();
  const units = context.unitContext.units; 

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

  // --- BUG FIX: Calculate price based on specific type, NOT current selection ---
  const getPriceByType = (type) => {
    const basePrice = type === 'sell' ? batch.sellPrice : batch.wholeSalePrice;
    // Ensure we handle empty/undefined prices gracefully (fallback to 0)
    const safePrice = basePrice ? Number(basePrice) : 0;
    return unitMode === 'secondary' ? safePrice * conversionRate : safePrice;
  };

  useEffect(() => {
    setQuantity(1);
  }, [unitMode]);

  const handleSubmit = () => {
    if (quantity > 0 && quantity <= maxQtyAllowed) {
      // Base price is always per piece for backend logic
      const basePricePerPiece = selectedPriceType === 'sell' ? batch.sellPrice : batch.wholeSalePrice;
      
      onAdd(
        product, 
        batch, 
        quantity, 
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
            
            {/* RETAILER BUTTON */}
            <button 
              type="button"
              onClick={() => setSelectedPriceType('sell')}
              className={`flex-1 p-3 text-center transition-all duration-200 ${selectedPriceType === 'sell' 
                  ? 'bg-green-500 text-white font-bold' 
                  : 'bg-white hover:bg-gray-100 text-gray-600'}`}
            >
              <span className="text-xs block">Retailer</span>
              {/* Fix: Hardcoded 'sell' ensures this button ALWAYS shows Retail Price */}
              <span className="text-xl">{getPriceByType('sell')}</span>
            </button>

            {/* WHOLESALER BUTTON */}
            <button 
              type="button"
              onClick={() => setSelectedPriceType('wholesale')}
              className={`flex-1 p-3 text-center transition-all duration-200 ${selectedPriceType === 'wholesale' 
                  ? 'bg-green-500 text-white font-bold' 
                  : 'bg-white hover:bg-gray-100 text-gray-600 border-l'}`}
            >
              <span className="text-xs block">Wholesaler</span>
              {/* Fix: Hardcoded 'wholesale' ensures this button ALWAYS shows Wholesale Price */}
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
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
            > - </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(maxQtyAllowed, Math.max(1, Number(e.target.value))))}
              className="input input-bordered w-24 text-center font-bold text-lg"
              min="1"
              max={maxQtyAllowed}
            />
            <button 
              className="btn btn-square btn-sm btn-outline btn-success" 
              onClick={() => setQuantity(prev => Math.min(maxQtyAllowed, prev + 1))}
            > + </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
             Available: {maxQtyAllowed} {unitMode === 'secondary' ? secUnitName : baseUnitName}
          </p>
          {quantity > maxQtyAllowed && (
            <p className="text-red-500 text-sm mt-2 font-medium">Exceeds available stock!</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={quantity > maxQtyAllowed || quantity < 1}
          >
            Add to Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;


