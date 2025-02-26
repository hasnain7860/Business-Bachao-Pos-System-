import React, { useState } from "react";
import { useAppContext } from "../Appfullcontext";
import { useParams, useNavigate } from "react-router-dom";

const SaleReturn = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const context = useAppContext();
  const sales = context.SaleContext.Sales;
  const updateSale = context.SaleContext.edit;

  // Sale ko find karna
  const sale = sales.find((s) => s.id === id);
  if (!sale) {
    return <p className="text-red-500 text-center">Sale not found.</p>;
  }

  // Pehle return hone wali quantity calculate karna
  const getReturnedQuantity = (productId) => {
    return sale.returns
      ? sale.returns.reduce((total, ret) => {
          const returnedProduct = ret.returnedProducts.find((p) => p.id === productId);
          return total + (returnedProduct ? returnedProduct.returnQuantity : 0);
        }, 0)
      : 0;
  };

  // State for return quantities & error messages
  const [returnQuantities, setReturnQuantities] = useState(
    sale.products.reduce((acc, product) => {
      const alreadyReturned = getReturnedQuantity(product.id);
      console.log("already return" + alreadyReturned)
      const remainingQuantity = product.SellQuantity - parseFloat(alreadyReturned);
      acc[product.id] = 0; // Default return quantity = 0
      console.log("reming quantity " + remainingQuantity + "product sell quantity" + product.SellQuantity)
      acc[`max_${product.id}`] = remainingQuantity; // Store remaining quantity
      acc[`error_${product.id}`] = ""; // Error message state
      return acc;
    }, {})
  );

  const handleQuantityChange = (productId, value) => {
    const maxQuantity = returnQuantities[`max_${productId}`];

    if (value > maxQuantity) {
      setReturnQuantities((prev) => ({
        ...prev,
        [productId]: maxQuantity, // Max quantity se zyada allow nahi karega
        [`error_${productId}`]: `Maximum returnable quantity: ${maxQuantity}`, // Error message show karega
      }));
    } else {
      setReturnQuantities((prev) => ({
        ...prev,
        [productId]: value,
        [`error_${productId}`]: "", // Error message hata do agar valid quantity hai
      }));
    }
  };

  const handleReturn = () => {
    const returnedProducts = sale.products
      .filter((product) => returnQuantities[product.id] > 0)
      .map((product) => ({
        id: product.id,
        name: product.name,
        returnQuantity: returnQuantities[product.id],
        sellPrice: product.sellPrice,
        returnPrice: returnQuantities[product.id] * product.sellPrice,
      }));

    if (returnedProducts.length === 0) {
      return; // Agar koi quantity enter nahi ki toh kuch bhi update nahi hoga
    }

    // Total return price calculate
    const totalReturnPrice = returnedProducts.reduce((sum, p) => sum + p.returnPrice, 0);

    // Updated sale object with return details
    const updatedSale = {
      ...sale,
      returns: [
        ...(sale.returns || []), // Pehle ke returns preserve karna
        {
          id: `RET-${Date.now()}`,
          dateTime: new Date().toISOString(),
          returnedProducts,
          returnPrice: totalReturnPrice,
        },
      ]

    };

    updateSale(sale.id ,updatedSale); // Sale ko update karo
    navigate("/sales"); // Redirect to sales list
  };

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-6">Sale Return</h1>

      {sale.products.map((product) => {
        return (
          <div key={product.id} className="mb-4">
            <label className="block text-gray-700 font-semibold">{product.name} (Sold: = {returnQuantities[`max_${product.id}`]})</label>
            <input
              type="number"
              className="border p-1 w-20 mt-1"
              value={returnQuantities[product.id]}
              onChange={(e) => handleQuantityChange(product.id, Number(e.target.value))}
              min="0"
              max={returnQuantities[`max_${product.id}`]}
            />
            {returnQuantities[`error_${product.id}`] && (
              <p className="text-red-500 text-sm">{returnQuantities[`error_${product.id}`]}</p>
            )}
          </div>
        );
      })}

      <div className="flex justify-end mt-4">
        <button className="btn btn-secondary mr-2" onClick={() => navigate("/sales")}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleReturn}>
          Process Return
        </button>
      </div>
    </div>
  );
};

export default SaleReturn;