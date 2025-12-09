import React from "react";

const ReceiptTemplate80mm = ({ data, settings, t, isUrdu, formatNum }) => {
  const { sale, person, businessInfo, calculations } = data;
  const { subtotal, discount, totalBill, previousBalance, netBalance, currentCredit, amountPaid } = calculations;

  // Header/Footer text from Settings (if available), fallback to business defaults
  const headerText = settings?.headerText || "";
  const footerText = settings?.footerText || businessInfo.notes || "";
  
  // Logic: Use Urdu name if mode is Urdu, else English
  const displayBusinessName = (isUrdu && businessInfo.businessNameUrdu) 
      ? businessInfo.businessNameUrdu 
      : (businessInfo.businessName || "My Business");

  const displayCustomerName = () => {
      if (!person) return t.walking_customer || "Walking Customer";
      if (person.nameInUrdu && person.nameInUrdu.trim() !== '') return person.nameInUrdu;
      return person.name;
  };

  const currency = businessInfo.currency || 'Rs.';

  return (
    <>
      <style>{`
        @media print {
            @page { margin: 0; padding: 0; }
            body, html { 
                width: 100%;
                margin: 0;
                padding: 0;
            }
            .print-container { 
                width: 80mm; /* Force 80mm width */
                margin: 0 auto; 
                padding: 2px 5px;
                box-shadow: none; 
                color: #000;
                direction: ${isUrdu ? 'rtl' : 'ltr'} !important;
                text-align: ${isUrdu ? 'right' : 'left'} !important;
            }
            .no-print { display: none !important; }
            
            /* Typography */
            .print-container, .print-container * {
                font-family: 'Noto Nastaliq Urdu', 'Arial', sans-serif;
                font-size: 11px !important; 
                font-weight: 600 !important; 
                line-height: 1.1 !important;
                visibility: visible !important;
            }
            
            /* Headlines */
            .print-container h2 {
                font-size: 16px !important; 
                font-weight: 800 !important;
                margin-bottom: 2px;
            }
            .customer-name-big {
                font-size: 16px !important; 
                font-weight: 900 !important;
                display: block;
                margin-top: 2px;
            }
            
            /* Detailed Sections */
            .print-container .grand-total, .print-container .net-balance {
                font-size: 13px !important;
            }
            .print-container .footer-notes {
                font-size: 9px !important;
                font-weight: 500 !important;
                margin-top: 5px;
                border-top: 1px dotted #000;
                padding-top: 2px;
                text-align: center;
            }
            .print-container .footer-brand {
                font-size: 9px !important; 
                text-align: center;
                margin-top: 5px;
                border-top: 1px solid #000;
                padding-top: 2px;
            }
            
            /* Elements */
            hr {
                border-top: 1px solid #000 !important;
                margin: 3px 0 !important;
            }
            .print-logo {
                width: 50px;
                height: 50px;
                object-fit: contain;
                margin: 0 auto 5px auto;
                display: block;
                filter: grayscale(100%) contrast(150%);
            }
            
            /* Table Styling */
            table { width: 100%; border-collapse: collapse; }
            td, th { padding: 3px 1px; vertical-align: top; }
            .rtl-table th, .rtl-table td { text-align: right; }
            .ltr-table th, .ltr-table td { text-align: left; }
            
            .product-row { border-bottom: 1px dashed #777; }
            .product-row:last-child { border-bottom: none; }

            /* Hide everything else */
            #navbar, #root > div:not(.print-container) { display:none !important; }
            body * { visibility: hidden; }
        }
      `}</style>

      {/* --- RECEIPT CONTAINER --- */}
      <div className="print-container w-72 mx-auto p-2 bg-white text-black shadow-lg font-sans">
          
          {/* Logo Logic: Check settings first, then business info */}
          {(settings?.showLogo !== false && businessInfo.logo) && (
              <img src={businessInfo.logo} alt="Logo" className="print-logo" />
          )}

          {/* Header: Business Info */}
          <div className="text-center mb-1">
              <h2 className="font-bold">{displayBusinessName}</h2>
              {(settings?.showAddress !== false && businessInfo.address) && <p>{businessInfo.address}</p>}
              {(settings?.showPhone !== false && businessInfo.phoneNo) && <p>{businessInfo.phoneNo}</p>}
              {headerText && <p className="text-[10px] mt-1 italic">{headerText}</p>}
          </div>
          
          <hr />
          
          {/* Invoice Meta Data */}
          <div>
              <div className="flex justify-between">
                  <span>{t.ref_no || "Ref"}: {sale.salesRefNo}</span>
                  <span>{new Date(sale.dateTime).toLocaleDateString()}</span>
              </div>
              
              {/* Customer Name */}
              {person && (
                  <div className="mt-1 mb-1 border-b border-gray-300 pb-1">
                      <span className="text-[9px]">{t.customer_name || "Customer"}:</span>
                      <span className="customer-name-big">{displayCustomerName()}</span>
                  </div>
              )}
          </div>
          
          {/* Items Table */}
          <table className={`mt-1 ${isUrdu ? 'rtl-table' : 'ltr-table'}`}>
              <thead>
                  <tr className="border-b border-black text-[10px]">
                      <th className="w-[5%]">#</th> 
                      <th className="w-[40%] text-left">{t.item || "Item"}</th> 
                      <th className="w-[15%] text-center">{t.qty || "Qty"}</th> 
                      <th className="w-[15%] text-right">{t.rate || "Rate"}</th>
                      <th className="w-[10%] text-right text-[9px]">{t.discount || "Dis"}</th>
                      <th className="w-[15%] text-right">{t.total || "Total"}</th>
                  </tr>
              </thead>
              <tbody>
                  {sale.products.length > 0 ? (
                      sale.products.map((product, index) => {
                          const displayQty = product.enteredQty || product.SellQuantity;
                          const rate = parseFloat(product.newSellPrice || product.sellPrice);
                          const unitLabel = product.unitName || '';
                          const rowTotal = rate * parseFloat(displayQty);
                          const itemDiscount = parseFloat(product.discount || 0);

                          return (
                              <tr key={`${product.id}-${index}`} className="product-row">
                                  <td>{index + 1}</td>
                                  <td className="font-bold leading-tight pr-1">
                                      {isUrdu && product.nameInUrdu ? product.nameInUrdu : product.name}
                                  </td>
                                  <td className="text-center whitespace-nowrap">
                                      {formatNum(displayQty)} <span className="text-[9px] font-normal">{unitLabel}</span>
                                  </td>
                                  <td className="text-right">{formatNum(rate)}</td>
                                  <td className="text-right">{itemDiscount > 0 ? formatNum(itemDiscount) : '-'}</td>
                                  <td className="text-right">{formatNum(rowTotal)}</td>
                              </tr>
                          );
                      })
                  ) : (
                      <tr><td colSpan="6" className="text-center py-2">No products</td></tr>
                  )}
              </tbody>
          </table>
          
          <hr className="border-t-2" />
          
          {/* Bill Summary */}
          <div className="space-y-0.5">
              <div className="flex justify-between"><span className="font-semibold">{t.subtotal || "Subtotal"}:</span><span>{currency} {formatNum(subtotal)}</span></div>
              {discount > 0 && (<div className="flex justify-between"><span className="font-semibold">{t.discount || "Discount"}:</span><span>- {currency} {formatNum(discount)}</span></div>)}
              <div className="flex justify-between font-bold mt-1 grand-total"><span>{t.grand_total || "Grand Total"}:</span><span>{currency} {formatNum(totalBill)}</span></div>
              
              {sale.naq && sale.naq !== '' && (
                   <div className="flex justify-between font-bold border-t border-dotted mt-1 pt-1"><span>{t.total_naq || "Total Naq"}:</span> <span>{sale.naq}</span></div>
              )}
          </div>

          {/* Account/Ledger Summary */}
          {person && (
              <>
                  <hr className="border-t-2 mt-2" />
                  <div className="space-y-0.5">
                      <h4 className="text-center font-bold mb-1 uppercase text-[10px]">{t.account_summary || "Account Summary"}</h4>
                      
                      {previousBalance !== 0 && (
                          <div className="flex justify-between">
                              <span className="font-semibold">{previousBalance > 0 ? (t.previous_balance || "Prev Bal") : (t.advance_balance || "Prev Adv")}:</span>
                              <span>{currency} {formatNum(Math.abs(previousBalance))}</span>
                          </div>
                      )}

                      <div className="flex justify-between"><span className="font-semibold">{t.current_bill_balance || "Curr Bill"}:</span><span className="font-bold">{currency} {formatNum(currentCredit)}</span></div>
                      <div className="flex justify-between"><span className="font-semibold">{t.received || "Paid"}:</span><span>{currency} {formatNum(amountPaid)}</span></div>
                      
                      <hr />
                      
                      {/* Net Balance */}
                      {netBalance > 0 && (
                          <div className="flex justify-between font-bold net-balance"><span>{t.net_payable || "Total Due"}:</span><span>{currency} {formatNum(netBalance)}</span></div>
                      )}
                      {netBalance < 0 && (
                          <div className="flex justify-between font-bold net-balance"><span>{t.net_advance || "Total Adv"}:</span><span>{currency} {formatNum(Math.abs(netBalance))}</span></div>
                      )}
                      {netBalance === 0 && (
                          <div className="flex justify-between font-bold net-balance"><span>{t.balance_clear || "Clear"}:</span><span>{currency} 0</span></div>
                      )}
                  </div>
              </>
          )}

          {/* Footer Text */}
          {footerText && (
              <div className="footer-notes">
                  {footerText}
              </div>
          )}

          {/* System Branding (Always there) */}
          <div className="footer-brand">
              <p className="font-bold">Business Bachao - 03314460028</p>
          </div>
      </div>
    </>
  );
};

export default ReceiptTemplate80mm;