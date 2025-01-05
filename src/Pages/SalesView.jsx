
import React, { useEffect } from "react";
import { useParams, useLocation } from 'react-router-dom';
import { useAppContext } from "../Appfullcontext";
import { FaPrint, FaArrowLeft } from 'react-icons/fa'; 
import { useNavigate } from 'react-router-dom'; 

const SalesView = () => {
  const context = useAppContext();
  const salesData = context.SaleContext.Sales;
  const { salesRefNo } = useParams();
  const location = useLocation();
  const navigate = useNavigate(); 
  const userAndBusinessDetail = context.settingContext.settings;

console.log(salesData)
  // Find the sale by ID
  const sale = salesData.find(sale => sale.salesRefNo === salesRefNo);

console.log(sale)
  if (!sale) {
    return <div className="text-center text-red-500">Sale not found</div>;
  }

  // Calculate grand total
  const grandTotal = sale.products.reduce((total, product) => total + product.total, 0);
  const isPrintMode = location.pathname.includes('/print');

  // Effect to trigger print dialog when in print mode
  useEffect(() => {
    if (isPrintMode) {
      window.print(); // Automatically open the print dialog
      // Optionally navigate back after printing
      // navigate(`/sales/view/${id}`); // Uncomment if needed
    }
  }, [isPrintMode, salesRefNo]);

  const handlePrint = () => {
    // Navigate to the print route
    navigate(`/sales/view/${salesRefNo}/print`);
  };
  
  
  


  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-4">{userAndBusinessDetail[0].business.businessName}</h2>
      <p className="text-center">{userAndBusinessDetail[0].business.email}</p>
      <p className="text-center">{userAndBusinessDetail[0].business.phoneNo}</p>
      <hr className="my-4" />
      
      <h3 className="text-xl font-semibold mb-2">Bill Details</h3>
      <p><strong>Sales Reference No:</strong> {sale.salesRefNo}</p>
      <p><strong>Customer ID:</strong> {sale.customerId}</p>
      <p><strong>Date:</strong> {new Date(sale.dateTime).toLocaleString()}</p>
      <p><strong>Total Bill:</strong> {userAndBusinessDetail[0].business.currency} {sale.totalBill}</p>

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

{sale.products.map(product => {
  const sellingPrice = product.sellPrice;
  const quantity = parseInt(product.SellQuantity, 10);
  const discountPercentage = product.discount;

  // Calculate total selling price
  const totalSellingPrice = sellingPrice * quantity;

  // Calculate discount amount
  const discountAmount = totalSellingPrice * (discountPercentage / 100);

  // Calculate final total
  const finalTotal = totalSellingPrice - discountAmount;

  return (
    <tr key={product.id} className="hover:bg-gray-50">
      <td className="border border-gray-200 p-2">{product.name}</td>
      <td className="border border-gray-200 p-2">{userAndBusinessDetail[0].business.currency} {sellingPrice}</td>
      <td className="border border-gray-200 p-2">{quantity}</td>
      <td className="border border-gray-200 p-2">{discountPercentage} %</td>
      <td className="border border-gray-200 p-2">{userAndBusinessDetail[0].business.currency} {finalTotal.toFixed(2)}</td>
    </tr>
  );
})}

          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-4 font-bold">
        <span className="text-lg">Grand Total:</span>
        <span>{userAndBusinessDetail[0].business.currency} {sale.totalBill}</span>
      </div>

      <div className="flex justify-between items-center mt-6">
        {!isPrintMode && (
          <button 
            onClick={handlePrint} 
            className="btn btn-primary flex items-center">
            <FaPrint className="mr-2" /> Print
          </button>
        )}
      </div>

      <div className="mt-6 text-center">
        <p><strong>Owner Signature:</strong></p>
        <p className="border-t border-gray-400 mt-2 pt-2">{userAndBusinessDetail[0].user.signature}</p>
      </div>
    </div>
  );
};

export default SalesView;
