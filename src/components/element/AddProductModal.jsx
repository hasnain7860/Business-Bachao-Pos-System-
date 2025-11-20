import React, { useState } from 'react';

// NEW PROP: defaultPriceMode
const AddProductModal = ({ product, batch, onAdd, onClose, defaultPriceMode }) => {
  const [quantity, setQuantity] = useState(1);
  // Initial state uses the defaultPriceMode passed from NewSales
  const [selectedPriceType, setSelectedPriceType] = useState(defaultPriceMode || 'sell'); 

  const handleSubmit = () => {
    if (quantity > 0 && quantity <= batch.quantity) {
      // Determine the chosen price based on the selected type
      const chosenPrice = selectedPriceType === 'sell' ? batch.sellPrice : batch.wholeSalePrice;

      // Pass the chosen price and type to the onAdd function
      onAdd(product, batch, quantity, chosenPrice, selectedPriceType);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-semibold mb-4 text-blue-800 border-b pb-2">Add '{product.name}' to Sale</h3>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-sm">Batch: <span className="font-bold text-gray-800">{batch.batchCode}</span></p>
          <p className="text-gray-600 text-sm">Available Stock: <span className="font-bold text-gray-800">{batch.quantity}</span></p>
        </div>

        {/* Price Selection UI - Now defaults to global mode */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Sale Price (Global default is pre-selected):
          </label>
          <div className="flex rounded-lg shadow-md overflow-hidden border border-gray-200">
            <button 
              type="button"
              onClick={() => setSelectedPriceType('sell')}
              className={`flex-1 p-3 text-center transition-all duration-200 ${selectedPriceType === 'sell' 
                  ? 'bg-green-500 text-white font-bold' 
                  : 'bg-white hover:bg-gray-100 text-gray-600'}`}
            >
              <span className="text-xs block">Retailer Price</span>
              <span className="text-xl">Rs. {batch.sellPrice}</span>
            </button>
            <button 
              type="button"
              onClick={() => setSelectedPriceType('wholesale')}
              className={`flex-1 p-3 text-center transition-all duration-200 ${selectedPriceType === 'wholesale' 
                  ? 'bg-green-500 text-white font-bold' 
                  : 'bg-white hover:bg-gray-100 text-gray-600 border-l'}`}
            >
              <span className="text-xs block">Wholesaler Price</span>
              <span className="text-xl">Rs. {batch.wholeSalePrice}</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Quantity:
          </label>
          <div className="flex items-center gap-4">
            <button 
              className="btn btn-square btn-sm btn-outline btn-error" 
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
            >
                -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(batch.quantity, Math.max(1, Number(e.target.value))))}
              className="input input-bordered w-24 text-center font-bold text-lg"
              min="1"
              max={batch.quantity}
            />
            <button 
              className="btn btn-square btn-sm btn-outline btn-success" 
              onClick={() => setQuantity(prev => Math.min(batch.quantity, prev + 1))}
            >
                +
            </button>
          </div>
          {quantity > batch.quantity && (
            <p className="text-red-500 text-sm mt-2 font-medium">Quantity cannot exceed available stock ({batch.quantity})</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={quantity > batch.quantity || quantity < 1}
          >
            Add to Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;

