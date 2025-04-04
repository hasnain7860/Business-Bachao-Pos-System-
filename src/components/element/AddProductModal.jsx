import React, { useState } from 'react';

const AddProductModal = ({ product, batch, onAdd, onClose }) => {
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = () => {
    if (quantity > 0 && quantity <= batch.quantity) {
      onAdd(product, batch, quantity);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-xl font-semibold mb-4">Add Product</h3>
        
        <div className="mb-4">
          <p className="text-gray-600">Product: {product.name}</p>
          <p className="text-gray-600">Batch: {batch.batchCode}</p>
          <p className="text-gray-600">Available Stock: {batch.quantity}</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Quantity:
          </label>
          <div className="flex items-center gap-2">
            <button 
              className="btn btn-square btn-sm"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(batch.quantity, Math.max(1, Number(e.target.value))))}
              className="input input-bordered w-20 text-center"
              min="1"
              max={batch.quantity}
            />
            <button 
              className="btn btn-square btn-sm"
              onClick={() => setQuantity(prev => Math.min(batch.quantity, prev + 1))}
            >
              +
            </button>
          </div>
          {quantity > batch.quantity && (
            <p className="text-red-500 text-sm mt-1">
              Quantity cannot exceed available stock
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button 
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>
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