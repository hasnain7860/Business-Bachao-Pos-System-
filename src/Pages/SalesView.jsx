import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import { FaPrint } from "react-icons/fa";

const SalesView = () => {
  const context = useAppContext();
  const salesData = context?.SaleContext?.Sales || [];
  const customers = context?.supplierCustomerContext?.customers || [];
  const userAndBusinessDetail = context?.settingContext?.settings || [];

  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const sale = salesData.find((sale) => sale.id === id) || null;
  console.log(sale);
  const customer = customers.find((c) => c.id === sale?.customerId) || null;
  const isPrintMode = location.pathname.includes("/print");
  useEffect(() => {
    if (salesData.length > 0) {
      setLoading(false);
    }
  }, [salesData]);

  useEffect(() => {
    if (isPrintMode && !loading && sale) {
      const handleAfterPrint = () => {
        navigate(-1);
      };
      window.addEventListener("afterprint", handleAfterPrint);
      
      setTimeout(() => {
        document.title = `Sale - ${sale?.salesRefNo}`;
        
      
        const printOptions = {
          silent: true,
          printBackground: true,
          deviceWidth: '80mm',
        };
        
        window.print(printOptions);
        
      }, 500);

      return () => {
        window.removeEventListener("afterprint", handleAfterPrint);
      };
    }
  }, [isPrintMode, loading, sale, navigate]);
  const handlePrint = () => {
    navigate(`/sales/view/${id}/print`);
  };

  if (loading) {
    return <div className="text-center text-blue-500">Loading...</div>;
  }

  if (!sale) {
    return <div className="text-center text-red-500">Sale not found</div>;
  }

  // 🔵 Calculate Returns
  const totalReturnQuantity = sale.returns?.reduce(
    (sum, ret) =>
      sum + ret.returnedProducts.reduce((s, p) => s + p.returnQuantity, 0),
    0
  );

  const totalReturnAmount = sale.returns?.reduce(
    (sum, ret) => sum + ret.returnPrice,
    0
  );

  const remainingTotalBill = sale.totalBill - totalReturnAmount;
  const totalSoldQuantity = sale.products.reduce(
    (sum, product) => sum + parseInt(product.SellQuantity, 10),
    0
  );
  const remainingQuantity = totalSoldQuantity - totalReturnQuantity;

  return (
  
    
<div className="w-[302px] mx-auto p-2 bg-white text-sm"> 
   {userAndBusinessDetail[0]?.business ? (
        <>
       
<h2 className="text-center font-bold text-base mb-1">
  {userAndBusinessDetail[0].business.businessName}
</h2>
<p className="text-center text-xs mb-1">{userAndBusinessDetail[0].business.email}</p>
<p className="text-center text-xs mb-1">{userAndBusinessDetail[0].business.phoneNo}</p>
<hr className="my-2 border-dashed" />
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

      {/* 🔵 Products Table */}
      <h4 className="text-lg font-semibold mt-4">Products:</h4>
      <div className="overflow-x-auto">
      
<table className="w-full text-xs border-collapse mt-2">
  <thead>
    <tr>
      <th className="py-1 text-left">Item</th>
      <th className="py-1 text-right">Qty</th>
<th className="py-1 text-right">discount</th>
      <th className="py-1 text-right">Price</th>
    </tr>
  </thead>
  <tbody>
    {sale.products.length > 0 ? (
      sale.products.map((product) => {
        const finalTotal = (product.sellPrice * parseInt(product.SellQuantity, 10)) * (1 - product.discount/100);
        return (
          <tr key={product.id}>
            <td className="py-1">{product.name}</td>
            <td className="py-1 text-right">{product.SellQuantity}</td>
<td className="py-1 text-right">{product.discount ? product.discount : 0} </td>
            <td className="py-1 text-right">
              {userAndBusinessDetail[0]?.business?.currency} {finalTotal.toFixed(2)}
            </td>

          </tr>
        );
      })
    ) : (
      <tr>
        <td colSpan="3" className="text-center py-1">No products</td>
      </tr>
    )}
  </tbody>
</table>
      </div>

      {/* 🔴 Sales Returns Section (Only If Returns Exist) */}
      {sale.returns?.length > 0 && (
        <>
          <h4 className="text-lg font-semibold mt-6 text-red-500">Returned Products:</h4>
          <table className="min-w-full border-collapse border border-gray-200 mt-2">
            <thead>
              <tr className="bg-red-100">
                <th className="border border-gray-200 p-2">Product Name</th>
                <th className="border border-gray-200 p-2">Return Quantity</th>
                <th className="border border-gray-200 p-2">Return Price</th>
              </tr>
            </thead>
            <tbody>
              {sale.returns.flatMap((ret) =>
                ret.returnedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-2">{product.name}</td>
                    <td className="border border-gray-200 p-2">{product.returnQuantity}</td>
                    <td className="border border-gray-200 p-2">
                      {userAndBusinessDetail[0]?.business?.currency} {product.returnPrice}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
{/* 🔵 Final Bill Summary */}
<div className="flex justify-between mt-4 font-bold">
  {sale.returns?.length > 0 ? (
    <>
      <span className="text-lg text-red-500">Grand Total:</span>
      <span>{userAndBusinessDetail[0]?.business?.currency} {remainingTotalBill}</span>
    </>
  ) : (
    <>
      <span className="text-lg">Grand Total:</span>
      <span>{userAndBusinessDetail[0]?.business?.currency} {sale.totalBill}</span>
    </>
  )}
</div>


      {!isPrintMode && (
        <button onClick={handlePrint} className="btn btn-primary flex items-center mt-4">
          <FaPrint className="mr-2" /> Print
        </button>
      )}
    </div>
  );
};

export default SalesView;