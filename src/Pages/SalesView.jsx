import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import { FaPrint } from "react-icons/fa"; 

const SalesView = () => {
  // 🟢 Always call Hooks at the top level in the same order
  const context = useAppContext();
  const salesData = context?.SaleContext?.Sales || [];
  const customers = context?.supplierCustomerContext?.customers || [];
  const userAndBusinessDetail = context?.settingContext?.settings || [];
  
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🟢 Initialize all Hooks at the top to prevent reordering
  const [loading, setLoading] = useState(true);

  // 🟢 Find sale outside useEffect to maintain hook order
  const sale = salesData.find((sale) => sale.id === id) || null;
  const customer = customers.find((c) => c.id === sale?.customerId) || null;
  const isPrintMode = location.pathname.includes("/print");

  // ✅ Ensure useEffect() is called in the same order
  useEffect(() => {
    if (salesData.length > 0) {
      setLoading(false);
    }
  }, [salesData]);

  useEffect(() => {
    if (isPrintMode) {
      window.print();
    }
  }, [isPrintMode]); // Removed id from dependency to keep order stable

  const handlePrint = () => {
    navigate(`/sales/view/${id}/print`);
  };

  if (loading) {
    return <div className="text-center text-blue-500">Loading...</div>;
  }

  if (!sale) {
    return <div className="text-center text-red-500">Sale not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      {userAndBusinessDetail[0]?.business ? (
        <>
          <h2 className="text-2xl font-bold text-center mb-4">
            {userAndBusinessDetail[0].business.businessName}
          </h2>
          <p className="text-center">{userAndBusinessDetail[0].business.email}</p>
          <p className="text-center">{userAndBusinessDetail[0].business.phoneNo}</p>
          <hr className="my-4" />
        </>
      ) : (
        <p className="text-center text-red-500">Business details not found</p>
      )}

      <h3 className="text-xl font-semibold mb-2">Bill Details</h3>
      <p><strong>Sales Reference No:</strong> {sale.salesRefNo}</p>
      {sale.customerId && (
        <p><strong>Customer Name:</strong> {customer?.name || "N/A"}</p>
      )}
      <p><strong>Date:</strong> {new Date(sale.dateTime).toLocaleString()}</p>
      <p><strong>Total Bill:</strong> {userAndBusinessDetail[0]?.business?.currency} {sale.totalBill}</p>

      <h4 className="text-lg font-semibold mt-4">Products:</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-200 mt-2">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 p-2">Product Name</th>
              <th className="border border-gray-200 p-2">Sell Price</th>
              <th className="border border-gray-200 p-2">Quantity Sold</th>
              <th className="border border-gray-200 p-2">Discount</th>
              <th className="border border-gray-200 p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(sale.products) && sale.products.length > 0 ? (
              sale.products.map((product) => {
                const sellingPrice = product.sellPrice;
                const quantity = parseInt(product.SellQuantity, 10);
                const discountPercentage = product.discount;
                const totalSellingPrice = sellingPrice * quantity;
                const discountAmount = totalSellingPrice * (discountPercentage / 100);
                const finalTotal = totalSellingPrice - discountAmount;

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-2">{product.name}</td>
                    <td className="border border-gray-200 p-2">
                      {userAndBusinessDetail[0]?.business?.currency} {sellingPrice}
                    </td>
                    <td className="border border-gray-200 p-2">{quantity}</td>
                    <td className="border border-gray-200 p-2">{discountPercentage} %</td>
                    <td className="border border-gray-200 p-2">
                      {userAndBusinessDetail[0]?.business?.currency} {finalTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 p-2">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-4 font-bold">
        <span className="text-lg">Grand Total:</span>
        <span>{userAndBusinessDetail[0]?.business?.currency} {sale.totalBill}</span>
      </div>

      <div className="flex justify-between items-center mt-6">
        {!isPrintMode && (
          <button onClick={handlePrint} className="btn btn-primary flex items-center">
            <FaPrint className="mr-2" /> Print
          </button>
        )}
      </div>

      <div className="mt-6 text-center">
        <p><strong>Owner Signature:</strong></p>
        <p className="border-t border-gray-400 mt-2 pt-2">
          {userAndBusinessDetail[0]?.user?.signature || "N/A"}
        </p>
      </div>
    </div>
  );
};

export default SalesView;