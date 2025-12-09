import React, { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTimes, FaPrint, FaArrowLeft } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import { useAppContext } from '../../Appfullcontext.jsx';

const TemplateViewer = () => {
  const { id } = useParams(); // Get ID from URL
  const navigate = useNavigate();
  const componentRef = useRef();
  
  // --- 1. Get Data from Context ---
  const { settingContext } = useAppContext();
  const { data: allSettings } = settingContext;

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (allSettings && allSettings.length > 0) {
      const currentSettings = allSettings[0];
      const foundTemplate = currentSettings.templates?.find(t => t.id === id);
      
      if (foundTemplate) {
        setTemplate(foundTemplate);
      } else {
        // Handle "Template Not Found"
        console.error("Template ID not found in settings");
      }
      setLoading(false);
    }
  }, [allSettings, id]);

  // --- 2. Mock Data for Preview (Required to visualize the layout) ---
  const sampleData = {
    businessName: "Super Mart & Store",
    address: "Shop #5, Main Market, Lahore",
    phone: "0300-1234567",
    invNumber: "INV-10023",
    date: "25-Oct-2025",
    customer: "Ali Khan (Walk-in)",
    items: [
      { name: "Milk Pack 1L", qty: 2, price: 220, total: 440 },
      { name: "Bread Large", qty: 1, price: 150, total: 150 },
      { name: "Eggs Dozen", qty: 1, price: 300, total: 300 },
    ],
    subtotal: 890,
    discount: 40,
    total: 850
  };

  // --- 3. Print Function ---
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Receipt-${template?.name || 'Preview'}`,
  });

  // --- 4. Render Logic Sections ---
  const renderSection = (section) => {
    if (!section.enabled) return null;

    switch (section.id) {
      case 'logo':
        return (
          <div key="logo" className="flex justify-center mb-2">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500 border border-dashed border-gray-400">
               LOGO
            </div>
          </div>
        );
      case 'business_info':
        return (
          <div key="biz" className="text-center mb-2">
            <h2 className="font-bold text-lg leading-tight">{sampleData.businessName}</h2>
            <p className="text-xs mt-1">{sampleData.address}</p>
            <p className="text-xs">Ph: {sampleData.phone}</p>
          </div>
        );
      case 'header_text':
        return template.headerText ? (
          <div key="head" className="text-center text-xs italic my-2 px-4 whitespace-pre-wrap">
            {template.headerText}
          </div>
        ) : null;
      case 'invoice_meta':
        return (
          <div key="meta" className="flex justify-between border-b border-black pb-1 mb-1 text-xs">
            <span className="font-bold">#{sampleData.invNumber}</span>
            <span>{sampleData.date}</span>
          </div>
        );
      case 'customer_info':
        return (
          <div key="cust" className="text-xs border-b border-black pb-1 mb-1">
            <span className="font-bold">Bill To:</span> {sampleData.customer}
          </div>
        );
      case 'items_table':
        return (
          <div key="items" className="w-full mb-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-black">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-right w-8">Qty</th>
                  <th className="py-1 text-right w-12">Amt</th>
                </tr>
              </thead>
              <tbody>
                {sampleData.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1 pr-1">{item.name}</td>
                    <td className="text-right align-top">{item.qty}</td>
                    <td className="text-right align-top">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'totals_area':
        return (
          <div key="totals" className="flex flex-col items-end mt-2 pt-2 border-t border-dashed border-black text-xs">
            <div className="flex justify-between w-32">
              <span>Subtotal:</span>
              <span>{sampleData.subtotal}</span>
            </div>
            <div className="flex justify-between w-32">
              <span>Disc:</span>
              <span>-{sampleData.discount}</span>
            </div>
            <div className="flex justify-between w-32 font-bold text-sm mt-1 border-t border-black pt-1">
              <span>Total:</span>
              <span>{sampleData.total}</span>
            </div>
          </div>
        );
      case 'footer_text':
        return template.footerText ? (
          <div key="foot" className="text-center text-xs mt-4 px-2 whitespace-pre-wrap">
            {template.footerText}
          </div>
        ) : null;
      case 'barcode':
        return (
          <div key="bar" className="mt-4 flex flex-col items-center">
             <div className="h-8 w-2/3 bg-black"></div>
             <span className="text-[10px] mt-1">{sampleData.invNumber}</span>
          </div>
        );
      case 'signature':
        return (
          <div key="sig" className="mt-8 flex justify-end">
            <div className="border-t border-black w-32 text-center text-xs pt-1">
              Auth Signature
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // --- 5. Styles Logic ---
  const getPaperWidth = () => {
    if (!template) return '80mm';
    switch(template.paperSize) {
        case '58mm': return '58mm';
        case '80mm': return '80mm';
        case 'A4': return '210mm';
        case 'A5': return '148mm';
        default: return '80mm';
    }
  };

  const containerStyle = {
    width: getPaperWidth(),
    minHeight: '100mm',
    padding: '10px',
    backgroundColor: 'white',
    fontFamily: template?.fontFamily === 'mono' ? 'monospace' : template?.fontFamily === 'serif' ? 'serif' : 'sans-serif',
    fontSize: template?.fontSize || '12px',
    color: 'black',
    margin: '0 auto'
  };

  // --- 6. Render ---

  if (loading) return <div className="p-10 text-center">Loading Template...</div>;
  
  if (!template) return (
    <div className="p-10 text-center flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-red-500">Template Not Found</h2>
        <p>The template ID "{id}" does not exist.</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">Go Back</button>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      
      {/* Top Bar */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn btn-circle btn-sm btn-ghost">
                <FaArrowLeft />
            </button>
            <div>
                <h1 className="font-bold text-xl">{template.name}</h1>
                <p className="text-xs text-gray-500">
                    Preview Mode • {template.paperSize} • {template.fontFamily}
                </p>
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={handlePrint} className="btn btn-primary btn-sm gap-2">
                <FaPrint /> Print Test
            </button>
            <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm gap-2">
                <FaTimes /> Close
            </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-gray-500 p-8 flex justify-center items-start">
        <div className="shadow-2xl transition-all duration-300 origin-top" ref={componentRef} style={containerStyle}>
            {/* Custom CSS Injection */}
            {template.customCSS && (
                <style>{template.customCSS}</style>
            )}
            
            {/* Render Sections */}
            <div className="flex flex-col">
                {template.sections.map(section => renderSection(section))}
            </div>
        </div>
      </div>

    </div>
  );
};

export default TemplateViewer;


