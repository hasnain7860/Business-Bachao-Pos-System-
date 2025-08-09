import React, { useState } from 'react';

const AddProductModal = ({ product, batch, onAdd, onClose }) => {
  const [quantity, setQuantity] = useState(1);
  // NEW: State to track which price is selected. 'sell' is default.
  const [selectedPriceType, setSelectedPriceType] = useState('sell'); 

  const handleSubmit = () => {
    if (quantity > 0 && quantity <= batch.quantity) {
      // NEW: Determine the chosen price based on the selected type
      const chosenPrice = selectedPriceType === 'sell' ? batch.sellPrice : batch.wholeSalePrice;

      // NEW: Pass the chosen price and type to the onAdd function
      onAdd(product, batch, quantity, chosenPrice, selectedPriceType);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Add '{product.name}' to Sale</h3>
        
        <div className="mb-4">
          <p className="text-gray-600">Batch: <span className="font-medium text-gray-800">{batch.batchCode}</span></p>
          <p className="text-gray-600">Available Stock: <span className="font-medium text-gray-800">{batch.quantity}</span></p>
        </div>

        {/* NEW: Price Selection UI */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Sale Price:
          </label>
          <div className="flex rounded-md shadow-sm">
            <button 
              type="button"
              onClick={() => setSelectedPriceType('sell')}
              className={`flex-1 p-2 text-sm rounded-l-md transition-colors ${selectedPriceType === 'sell' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Sell Price<br/>
              <span className="text-lg">Rs. {batch.sellPrice}</span>
            </button>
            <button 
              type="button"
              onClick={() => setSelectedPriceType('wholesale')}
              className={`flex-1 p-2 text-sm rounded-r-md transition-colors ${selectedPriceType === 'wholesale' ? 'bg-blue-600 text-white font-bold' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Wholesale Price<br/>
              <span className="text-lg">Rs. {batch.wholeSalePrice}</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Quantity:
          </label>
          <div className="flex items-center gap-2">
            <button className="btn btn-square btn-sm" onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>-</button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(batch.quantity, Math.max(1, Number(e.target.value))))}
              className="input input-bordered w-20 text-center"
              min="1"
              max={batch.quantity}
            />
            <button className="btn btn-square btn-sm" onClick={() => setQuantity(prev => Math.min(batch.quantity, prev + 1))}>+</button>
          </div>
          {quantity > batch.quantity && (
            <p className="text-red-500 text-sm mt-1">Quantity cannot exceed available stock</p>
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
