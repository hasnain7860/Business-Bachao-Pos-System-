import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import { FaPrint, FaSave } from "react-icons/fa";
import languageData from "../assets/languageData.json";

const SalesView = () => {
    const context = useAppContext();
    
    // --- Universal Store Mapping ---
    const salesData = context?.SaleContext?.data || [];
    const people = context?.peopleContext?.data || [];
    const userAndBusinessDetail = context?.settingContext?.data || [];
    const allPurchases = context?.purchaseContext?.data || [];
    const submittedRecords = context?.creditManagementContext?.data || [];
    const sellReturns = context?.SellReturnContext?.data || [];
    const purchaseReturns = context?.purchaseReturnContext?.data || [];

    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    // --- 1. GET LANGUAGE FROM URL ---
    const [searchParams] = useSearchParams();
    const urlLang = searchParams.get('lang'); 
    
    const printLang = urlLang || context.language || 'en';
    const t = languageData[printLang] || languageData['en'];
    const isUrdu = printLang === 'ur';

    const [loading, setLoading] = useState(true);

    const sale = salesData.find((sale) => sale.id === id) || null;
    const person = people.find((p) => p.id === (sale?.personId || sale?.customerId)) || null;
    const isPrintMode = location.pathname.includes("/print");

    // --- Safe Business Data Access ---
    const businessInfo = userAndBusinessDetail[0]?.business || {};
    const currency = businessInfo.currency || 'Rs.';
    
    // Smart Name Selection: Use Urdu Name if in Urdu Mode & Available, else English
    const displayBusinessName = (isUrdu && businessInfo.businessNameUrdu) 
        ? businessInfo.businessNameUrdu 
        : (businessInfo.businessName || "My Business");

    const [naqCount, setNaqCount] = useState(''); 
    const [saveMessage, setSaveMessage] = useState('');

    // --- HELPER: Smart Number Formatting ---
    const formatNum = (value) => {
        const num = parseFloat(value);
        if (isNaN(num)) return "0";
        if (Number.isInteger(num)) return num.toString();
        return parseFloat(num.toFixed(2)).toString();
    };

    useEffect(() => {
        if (salesData.length > 0) {
            setLoading(false);
            if (sale) setNaqCount(sale.naq || ''); 
        }
    }, [salesData, sale]);

    const { previousBalance, netBalance } = useMemo(() => {
        if (!person || !sale) {
            return { previousBalance: 0, netBalance: parseFloat(sale?.credit || 0) };
        }
        
        const totalSalesCredit = salesData.filter(s => s.personId === person.id).reduce((acc, s) => acc + (parseFloat(s.credit) || 0), 0);
        const manualCredit = submittedRecords.filter(r => r.personId === person.id && r.type === 'credit').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
        const totalReceivable = totalSalesCredit + manualCredit;
        
        const manualPayments = submittedRecords.filter(r => r.personId === person.id && r.type === 'payment').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
        const sellReturnAdjustments = sellReturns.filter(r => r.peopleId === person.id || r.people === person.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
        const totalReductions = manualPayments + sellReturnAdjustments;
        
        const netReceivable = totalReceivable - totalReductions;
        
        const totalPurchaseCredit = allPurchases.filter(p => p.personId === person.id).reduce((acc, p) => acc + (parseFloat(p.credit) || 0), 0);
        const purchaseReturnAdjustments = purchaseReturns.filter(r => r.people === person.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
        const netPayable = totalPurchaseCredit - purchaseReturnAdjustments;
        
        const totalCurrentBalance = netReceivable - netPayable;
        const currentSaleCredit = parseFloat(sale.credit || 0);
        const prevBalance = totalCurrentBalance - currentSaleCredit;
        
        return { 
            previousBalance: prevBalance, 
            netBalance: totalCurrentBalance
        };
    }, [id, person, sale, salesData, allPurchases, submittedRecords, sellReturns, purchaseReturns]);


    useEffect(() => {
        if (isPrintMode && !loading && sale) {
            const originalTitle = document.title;
            document.title = `Sale - ${sale?.salesRefNo}`;
            const handleAfterPrint = () => {
                document.title = originalTitle;
                navigate(-1);
            };
            window.addEventListener("afterprint", handleAfterPrint);
            setTimeout(() => window.print(), 500);
            return () => {
                window.removeEventListener("afterprint", handleAfterPrint);
                document.title = originalTitle;
            };
        }
    }, [isPrintMode, loading, sale, navigate]);

    const handlePrint = () => {
        if (isPrintMode) window.print();
        else navigate(`/sales/view/${id}/print?lang=${printLang}`);
    };

    const handleSaveNaq = async () => {
        if (!sale) return;
        setSaveMessage('Saving...');
        try {
            const updatedSaleData = { ...sale, naq: naqCount || '' };
            await context.SaleContext.edit(sale.id, updatedSaleData);
            setSaveMessage('Naq Saved Successfully!');
        } catch (error) {
            setSaveMessage('Error saving Naq.');
        } finally {
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    if (loading) return <div className="text-center text-lg p-10">Loading Receipt...</div>;
    if (!sale) return <div className="text-center text-red-500 text-lg p-10">Sale not found</div>;

    const discount = parseFloat(sale.discount || 0);
    const subtotal = parseFloat(sale.subtotal || (parseFloat(sale.totalBill || 0) + discount));
    const totalBill = parseFloat(sale.totalBill || 0);
    const amountPaid = parseFloat(sale.amountPaid || 0);
    const currentCredit = parseFloat(sale.credit || 0);

    return (
        <>
            <style>{`
                @media print {
                    @page { margin: 0; padding: 0; }
                    body, html { 
                        width: 80mm; 
                        margin: 0;
                        padding: 0;
                    }
                    .print-container { 
                        width: 100%; 
                        margin: 0; 
                        padding: 2px 5px;
                        box-shadow: none; 
                        color: #000;
                        direction: ${isUrdu ? 'rtl' : 'ltr'} !important;
                        text-align: ${isUrdu ? 'right' : 'left'} !important;
                    }
                    .no-print { display: none; }
                    .print-container, .print-container * {
                        font-family: 'Noto Nastaliq Urdu', 'Arial', sans-serif;
                        font-size: 10px !important; 
                        font-weight: 600 !important; 
                        line-height: 1.2 !important;
                    }
                    .print-container h2 {
                        font-size: 16px !important; 
                        font-weight: 800 !important;
                        margin-bottom: 2px;
                    }
                    .print-container .grand-total, .print-container .net-balance {
                        font-size: 12px !important;
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
                    hr {
                        border-top: 1px solid #000 !important;
                        margin: 3px 0 !important;
                    }
                    .rtl-table th, .rtl-table td { text-align: right; }
                    .ltr-table th, .ltr-table td { text-align: left; }
                    
                    /* Table Styling */
                    table { width: 100%; border-collapse: collapse; }
                    td, th {
                        padding: 3px 1px;
                        vertical-align: top;
                    }
                    /* Line after each product as requested */
                    .product-row {
                        border-bottom: 1px dashed #777;
                    }
                    /* Remove border from last row */
                    .product-row:last-child {
                        border-bottom: none;
                    }
                    
                    /* Logo styling for thermal print */
                    .print-logo {
                        width: 50px;
                        height: 50px;
                        object-fit: contain;
                        margin: 0 auto 5px auto;
                        display: block;
                        filter: grayscale(100%) contrast(150%); /* High contrast for thermal */
                    }

                    #navbar{ display:none !important; }
                    body * { visibility: hidden !important; }
                    .print-container, .print-container * { visibility: visible !important; }
                }
            `}</style>

            <div className={`p-4 ${!isPrintMode ? 'bg-gray-100' : ''}`}>
                
                {/* --- UI Controls (Hidden in Print) --- */}
                <div className="no-print mb-4 p-4 bg-white rounded-lg shadow-md max-w-md mx-auto">
                    <h3 className="text-lg font-bold mb-3 text-center">Update Naq (Bundles)</h3>
                    <div className="flex gap-2 items-center">
                        <label htmlFor="naqInput" className="font-semibold whitespace-nowrap">Total Naq:</label>
                        <input
                            type="text" 
                            id="naqInput"
                            value={naqCount}
                            onChange={(e) => setNaqCount(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="e.g. 5 ctn" 
                        />
                        <button onClick={handleSaveNaq} className="btn btn-success flex items-center gap-2">
                            <FaSave /> Save
                        </button>
                    </div>
                    {saveMessage && <p className="text-center mt-2 text-green-500">{saveMessage}</p>}
                </div>

                <div className="no-print flex justify-end mb-4 max-w-md mx-auto">
                    <button onClick={handlePrint} className="btn btn-primary flex items-center gap-2 w-full"><FaPrint /> Print Receipt</button>
                </div>

                {/* --- RECEIPT CONTAINER --- */}
                <div className="print-container w-72 mx-auto p-2 bg-white text-black shadow-lg font-sans">
                    
                    {/* LOGO ADDED HERE */}
                    {businessInfo.logo && (
                        <img src={businessInfo.logo} alt="Logo" className="print-logo" />
                    )}

                    {/* Header: Business Info */}
                    <div className="text-center mb-1">
                        <h2 className="font-bold">{displayBusinessName}</h2>
                        
                        {/* Address & Phone */}
                        {businessInfo.address && <p>{businessInfo.address}</p>}
                        {businessInfo.phoneNo && <p>{businessInfo.phoneNo}</p>}
                        {businessInfo.email && <p>{businessInfo.email}</p>}
                    </div>
                    
                    <hr />
                    
                    {/* Invoice Meta Data */}
                    <div>
                        <div className="flex justify-between"><span>{t.ref_no || "Ref No"}:</span> <span>{sale.salesRefNo}</span></div>
                        
                        {sale.naq && sale.naq !== '' && (
                             <div className="flex justify-between"><span>{t.total_naq || "Total Naq"}:</span> <span>{sale.naq}</span></div>
                        )}

                        {person && (<div className="flex justify-between"><span>{t.customer_name || "Customer"}:</span> <span>{person.name}</span></div>)}
                        <div className="flex justify-between"><span>{t.date || "Date"}:</span> <span>{new Date(sale.dateTime).toLocaleString()}</span></div>
                    </div>
                    
                    <hr />
                    
                    {/* Items Table - DISCOUNT RESTORED */}
                    <table className={`mt-1 ${isUrdu ? 'rtl-table' : 'ltr-table'}`}>
                        <thead>
                            <tr className="border-b border-black">
                                <th className="w-[5%]">#</th> 
                                <th className="w-[30%]">{t.item || "Item"}</th> {/* Reduced from 35 to 30 */}
                                <th className="w-[12%] text-center">{t.qty || "Qty"}</th> {/* Reduced from 15 to 12 */}
                                <th className="w-[15%] text-right">{t.rate || "Rate"}</th>
                                <th className="w-[13%] text-right text-[9px]">{t.discount || "Disc"}</th>  {/* RESTORED */}
                                <th className="w-[25%] text-right">{t.total || "Total"}</th>
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
                                            <td>
                                                {isUrdu && product.nameInUrdu ? product.nameInUrdu : product.name}
                                                {unitLabel && <span className="font-bold ml-1 text-[8px]">({unitLabel})</span>}
                                            </td>
                                            <td className="text-center">{formatNum(displayQty)}</td>
                                            <td className="text-right">{formatNum(rate)}</td>
                                            <td className="text-right">{itemDiscount > 0 ? formatNum(itemDiscount) : '-'}</td> {/* Data Added */}
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
                        <div className="flex justify-between"><span className="font-semibold">{t.amount_paid || "Paid"}:</span><span>{currency} {formatNum(amountPaid)}</span></div>
                    </div>

                    {/* Customer Ledger Summary */}
                    {person && (
                        <>
                            <hr className="border-t-2" />
                            <div className="space-y-0.5">
                                <h4 className="text-center font-bold mb-1 uppercase">{t.account_summary || "Account Summary"}</h4>
                                
                                {previousBalance > 0 && (
                                    <div className="flex justify-between"><span className="font-semibold">{t.previous_balance || "Prev Bal"}:</span><span>{currency} {formatNum(previousBalance)}</span></div>
                                )}
                                {previousBalance < 0 && (
                                    <div className="flex justify-between"><span className="font-semibold">{t.advance_balance || "Advance"}:</span><span>{currency} {formatNum(Math.abs(previousBalance))}</span></div>
                                )}

                                <div className="flex justify-between"><span className="font-semibold">{t.current_bill_balance || "Curr Due"}:</span><span className="font-bold">{currency} {formatNum(currentCredit)}</span></div>
                                
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

                    {/* Footer Notes (Terms) */}
                    {businessInfo.notes && (
                        <div className="footer-notes">
                            {businessInfo.notes}
                        </div>
                    )}

                    {/* FIXED FOOTER SINGLE LINE */}
                    <div className="footer-brand">
                        <p className="font-bold">Business Bachao - 03314460028</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SalesView;
