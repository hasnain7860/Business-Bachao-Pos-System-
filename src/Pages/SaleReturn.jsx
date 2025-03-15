import React, { useState, useEffect } from "react";
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
      const remainingQuantity = product.SellQuantity - parseFloat(alreadyReturned);
      acc[product.id] = 0; // Default return quantity = 0
      acc[`max_${product.id}`] = remainingQuantity; // Store remaining quantity
      acc[`error_${product.id}`] = ""; // Error message state
      return acc;
    }, {})
  );

  const [returnOption, setReturnOption] = useState("payment"); // State for return option
  const [returnAmount, setReturnAmount] = useState(0); // State for return amount
  const [totalReturnPrice, setTotalReturnPrice] = useState(0); // State for total return price

  useEffect(() => {
    // Calculate total return price whenever return quantities change
    const total = sale.products.reduce((sum, product) => {
      const returnQuantity = returnQuantities[product.id] || 0;
      return sum + returnQuantity * product.sellPrice;
    }, 0);
    setTotalReturnPrice(total);
  }, [returnQuantities, sale.products]);

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
      ],
    };

    if (returnOption === "payment") {
      updatedSale.amountPaid = parseFloat(sale.amountPaid) - returnAmount;
    } else if (returnOption === "credit") {
      updatedSale.credit = parseFloat(sale.credit) - returnAmount;
    }

    updateSale(sale.id, updatedSale); // Sale ko update karo
    navigate("/sales"); // Redirect to sales list
  };

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-6">Sale Return</h1>

      <div className="mb-4">
        <p><strong>Sale ID:</strong> {sale.id}</p>
        <p><strong>Total Bill:</strong> {sale.totalBill}</p>
        <p><strong>Amount Paid:</strong> {sale.amountPaid}</p>
        <p><strong>Credit:</strong> {sale.credit}</p>
      </div>

      {sale.products.map((product) => {
        return (
          <div key={product.id} className="mb-4">
            <label className="block text-gray-700 font-semibold">{product.name} (Sold: {returnQuantities[`max_${product.id}`]})</label>
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

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold">Return Option:</label>
        <div>
          <label className="mr-4">
            <input
              type="radio"
              name="returnOption"
              value="payment"
              checked={returnOption === "payment"}
              onChange={() => setReturnOption("payment")}
            />
            Return Payment
          </label>
          <label>
            <input
              type="radio"
              name="returnOption"
              value="credit"
              checked={returnOption === "credit"}
              onChange={() => setReturnOption("credit")}
            />
            Reduce Credit
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold">Return Amount:</label>
        <input
          type="number"
          className="border p-1 w-20 mt-1"
          value={returnAmount}
          onChange={(e) => setReturnAmount(Number(e.target.value))}
          min="0"
          max={sale.amountPaid}
        />
      </div>

      <div className="mb-4">
        <p><strong>Total Return Price:</strong> {totalReturnPrice}</p>
      </div>

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