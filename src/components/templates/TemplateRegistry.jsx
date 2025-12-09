import React from 'react';
import { FaReceipt, FaFileInvoice } from 'react-icons/fa';

// --- MOCK DATA FOR PREVIEW ---
const previewData = {
  businessName: "My Super Store",
  address: "123 Market Road, Lahore",
  phone: "0300-1234567",
  invoiceNo: "INV-1001",
  date: "12-Dec-2025",
  items: [
    { name: "Milk Pack 1L", qty: 2, price: 250, total: 500 },
    { name: "Bread Large", qty: 1, price: 120, total: 120 },
  ],
  total: 620
};

// --- 1. 80mm Thermal Template Preview ---
export const Preview80mm = ({ config }) => (
  <div className="bg-white text-black p-4 font-mono text-xs shadow-lg mx-auto" style={{ width: '280px', minHeight: '400px' }}>
    {/* Header */}
    <div className="text-center mb-4">
      {config.showLogo && <div className="bg-gray-300 h-12 w-12 mx-auto mb-2 rounded-full flex items-center justify-center">Logo</div>}
      <h2 className="font-bold text-lg">{previewData.businessName}</h2>
      {config.showAddress && <p>{previewData.address}</p>}
      {config.showPhone && <p>{previewData.phone}</p>}
    </div>

    {/* Custom Header Text */}
    {config.headerText && <p className="text-center italic mb-2 border-b pb-2">{config.headerText}</p>}

    {/* Items */}
    <div className="mb-4">
      <div className="flex justify-between font-bold border-b border-black mb-1">
        <span>Item</span>
        <span>Amt</span>
      </div>
      {previewData.items.map((item, i) => (
        <div key={i} className="flex justify-between">
          <span>{item.name} x{item.qty}</span>
          <span>{item.total}</span>
        </div>
      ))}
      <div className="border-t border-black mt-2 pt-1 flex justify-between font-bold text-sm">
        <span>TOTAL</span>
        <span>{previewData.total}</span>
      </div>
    </div>

    {/* Footer */}
    <div className="text-center mt-6 text-[10px]">
      {config.footerText && <p className="mb-2">{config.footerText}</p>}
      {config.showSignature && <div className="mt-4 border-t border-black w-1/2 mx-auto pt-1">Signature</div>}
      <p>Thank you for visiting!</p>
    </div>
  </div>
);

// --- 2. A4 Invoice Template Preview ---
export const PreviewA4 = ({ config }) => (
  <div className="bg-white text-black p-8 font-sans shadow-lg mx-auto relative" style={{ width: '400px', height: '565px', fontSize: '10px' }}>
    {/* Header Section */}
    <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
      <div>
        {config.showLogo && <div className="bg-gray-200 h-16 w-16 mb-2 flex items-center justify-center text-xs">Logo</div>}
        <h1 className="text-xl font-bold text-blue-900">{previewData.businessName}</h1>
        {config.showAddress && <p>{previewData.address}</p>}
        {config.showPhone && <p>{previewData.phone}</p>}
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-light text-gray-400">INVOICE</h2>
        <p># {previewData.invoiceNo}</p>
        <p>{previewData.date}</p>
      </div>
    </div>

    {/* Custom Header */}
    {config.headerText && <div className="bg-gray-100 p-2 mb-4 italic text-center">{config.headerText}</div>}

    {/* Table */}
    <table className="w-full text-left mb-8">
      <thead>
        <tr className="bg-gray-800 text-white">
          <th className="p-1">Description</th>
          <th className="p-1 text-center">Qty</th>
          <th className="p-1 text-right">Price</th>
          <th className="p-1 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {previewData.items.map((item, i) => (
          <tr key={i} className="border-b border-gray-200">
            <td className="p-1">{item.name}</td>
            <td className="p-1 text-center">{item.qty}</td>
            <td className="p-1 text-right">{item.price}</td>
            <td className="p-1 text-right">{item.total}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Totals */}
    <div className="flex justify-end mb-8">
      <div className="w-1/2">
        <div className="flex justify-between border-t border-gray-800 pt-2 font-bold text-sm">
          <span>Grand Total:</span>
          <span>{previewData.total} PKR</span>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="absolute bottom-8 left-8 right-8">
      <div className="flex justify-between items-end">
        <div className="w-2/3">
           {config.footerText && <p className="text-gray-600 italic">{config.footerText}</p>}
        </div>
        {config.showSignature && (
          <div className="text-center">
            <div className="border-b border-black w-24 mb-1"></div>
            <span>Authorized Sign</span>
          </div>
        )}
      </div>
      <div className="text-center text-gray-400 mt-4 text-[8px]">
        System Generated Invoice
      </div>
    </div>
  </div>
);

// --- REGISTRY DEFINITION ---
export const AVAILABLE_TEMPLATES = [
  {
    id: '80mm_thermal',
    name: 'Thermal Receipt (80mm)',
    type: 'thermal',
    component: Preview80mm,
    icon: <FaReceipt />,
    defaultConfig: {
      showLogo: true,
      showAddress: true,
      showPhone: true,
      showSignature: false,
      headerText: 'Welcome to our Store',
      footerText: 'No Returns without Receipt'
    }
  },
  {
    id: 'a4_standard',
    name: 'Standard Invoice (A4)',
    type: 'a4',
    component: PreviewA4,
    icon: <FaFileInvoice />,
    defaultConfig: {
      showLogo: true,
      showAddress: true,
      showPhone: true,
      showSignature: true,
      headerText: '',
      footerText: 'Thank you for your business.'
    }
  }
];