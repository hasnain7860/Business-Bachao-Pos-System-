import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import { FaPrint } from "react-icons/fa";
import languageData from "../assets/languageData.json";

const PurchaseView = () => {
    const context = useAppContext();
    
    // --- Data Contexts ---
    const purchaseData = context?.purchaseContext?.data || [];
    const people = context?.peopleContext?.data || [];
    const units = context?.unitContext?.data || []; // Needed for unit names
    const userAndBusinessDetail = context?.settingContext?.data || [];
    
    // For Ledger Calculation
    const submittedRecords = context?.creditManagementContext?.data || [];
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

    const purchase = purchaseData.find((p) => String(p.id) === String(id)) || null;
    const supplier = people.find((p) => p.id === purchase?.personId) || null;
    const isPrintMode = location.pathname.includes("/print");

    // --- Safe Business Data Access ---
    const businessInfo = userAndBusinessDetail[0]?.business || {};
    const currency = businessInfo.currency || 'Rs.';
    
    // Smart Name Selection
    const displayBusinessName = (isUrdu && businessInfo.businessNameUrdu) 
        ? businessInfo.businessNameUrdu 
        : (businessInfo.businessName || "My Business");

    // --- HELPER: Smart Number Formatting ---
    const formatNum = (value) => {
        const num = parseFloat(value);
        if (isNaN(num)) return "0";
        if (Number.isInteger(num)) return num.toString();
        return parseFloat(num.toFixed(2)).toString();
    };

    // --- SUPPLIER NAME LOGIC ---
    const displaySupplierName = useMemo(() => {
        if (!supplier) return t.unknown_supplier || "Unknown Supplier";
        if (isUrdu && supplier.nameInUrdu && supplier.nameInUrdu.trim() !== '') {
            return supplier.nameInUrdu;
        }
        return supplier.name;
    }, [supplier, t, isUrdu]);

    useEffect(() => {
        if (purchaseData.length > 0) {
            setLoading(false);
        }
    }, [purchaseData]);

    // --- LEDGER LOGIC (PAYABLE TO SUPPLIER) ---
    const { previousBalance, netBalance } = useMemo(() => {
        if (!supplier || !purchase) {
            return { previousBalance: 0, netBalance: parseFloat(purchase?.credit || 0) };
        }
        
        // 1. Total Credit (What we owe them from ALL purchases)
        const totalPurchaseCredit = purchaseData
            .filter(p => p.personId === supplier.id)
            .reduce((acc, p) => acc + (parseFloat(p.credit) || 0), 0);
            
        // 2. Manual Credits (If any manual adjustments exist in ledger)
        // In creditManagement, usually 'credit' means we gave credit to customer. 
        // For suppliers, 'credit' usually means we owe them more.
        const manualPayable = submittedRecords
            .filter(r => r.personId === supplier.id && r.type === 'credit')
            .reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);

        const totalPayable = totalPurchaseCredit + manualPayable;
        
        // 3. Payments (What we paid them)
        const manualPayments = submittedRecords
            .filter(r => r.personId === supplier.id && r.type === 'payment')
            .reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);

        // 4. Returns (What we sent back, reducing what we owe)
        const returnAdjustments = purchaseReturns
            .filter(r => r.people === supplier.id)
            .reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
        
        const totalReductions = manualPayments + returnAdjustments;
        
        // Final Math
        const currentTotalBalance = totalPayable - totalReductions; // Positive means we owe them
        const currentBillCredit = parseFloat(purchase.credit || 0);
        const prevBalance = currentTotalBalance - currentBillCredit;
        
        return { 
            previousBalance: prevBalance, 
            netBalance: currentTotalBalance
        };
    }, [id, supplier, purchase, purchaseData, submittedRecords, purchaseReturns]);


    useEffect(() => {
        if (isPrintMode && !loading && purchase) {
            const originalTitle = document.title;
            document.title = `Purchase - ${purchase?.purchaseRefNo}`;
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
    }, [isPrintMode, loading, purchase, navigate]);

    const handlePrint = () => {
        if (isPrintMode) window.print();
        else navigate(`/purchases/view/${id}/print?lang=${printLang}`);
    };

    // Helper to get Unit Name safely
    const getUnitName = (unitId) => {
        if (!unitId) return "";
        const u = units.find(unit => unit.id === unitId);
        return u ? u.name : "";
    };

    if (loading) return <div className="text-center text-lg p-10">Loading Purchase...</div>;
    if (!purchase) return <div className="text-center text-red-500 text-lg p-10">Purchase not found</div>;

    const totalBill = parseFloat(purchase.totalBill || 0);
    const amountPaid = parseFloat(purchase.totalPayment || 0);
    const currentCredit = parseFloat(purchase.credit || 0);

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
                        font-size: 11px !important;
                        font-weight: 600 !important; 
                        line-height: 1.1 !important;
                    }
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
                    .print-container .grand-total, .print-container .net-balance {
                        font-size: 13px !important;
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
                    
                    table { width: 100%; border-collapse: collapse; }
                    td, th { padding: 3px 1px; vertical-align: top; }
                    .product-row { border-bottom: 1px dashed #777; }
                    .product-row:last-child { border-bottom: none; }
                    
                    .print-logo {
                        width: 50px;
                        height: 50px;
                        object-fit: contain;
                        margin: 0 auto 5px auto;
                        display: block;
                        filter: grayscale(100%) contrast(150%);
                    }

                    #navbar{ display:none !important; }
                    body * { visibility: hidden !important; }
                    .print-container, .print-container * { visibility: visible !important; }
                }
            `}</style>

            <div className={`p-4 ${!isPrintMode ? 'bg-gray-100' : ''}`}>
                
                <div className="no-print flex justify-end mb-4 max-w-md mx-auto">
                    <button onClick={handlePrint} className="btn btn-primary flex items-center gap-2 w-full">
                        <FaPrint /> Print Receipt
                    </button>
                </div>

                {/* --- RECEIPT CONTAINER --- */}
                <div className="print-container w-72 mx-auto p-2 bg-white text-black shadow-lg font-sans">
                    
                    {businessInfo.logo && (
                        <img src={businessInfo.logo} alt="Logo" className="print-logo" />
                    )}

                    {/* Header: Business Info */}
                    <div className="text-center mb-1">
                        <h2 className="font-bold">{displayBusinessName}</h2>
                        {businessInfo.address && <p>{businessInfo.address}</p>}
                        {businessInfo.phoneNo && <p>{businessInfo.phoneNo}</p>}
                    </div>
                    
                    <hr />
                    
                    {/* Invoice Meta Data */}
                    <div>
                        <div className="flex justify-between">
                            <span>{t.ref_no || "Ref"}: {purchase.purchaseRefNo}</span>
                            <span>{new Date(purchase.date).toLocaleDateString()}</span>
                        </div>
                        
                        {/* SUPPLIER NAME */}
                        {supplier && (
                            <div className="mt-1 mb-1 border-b border-gray-300 pb-1">
                                <span className="text-[9px]">{t.supplier_name || "Supplier"}:</span>
                                <span className="customer-name-big">{displaySupplierName}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Items Table */}
                    <table className={`mt-1 ${isUrdu ? 'rtl-table' : 'ltr-table'}`}>
                        <thead>
                            <tr className="border-b border-black text-[10px]">
                                <th className="w-[5%]">#</th> 
                                <th className="w-[45%] text-left">{t.item || "Item"}</th> 
                                <th className="w-[20%] text-center">{t.qty || "Qty"}</th> 
                                <th className="w-[15%] text-right">{t.rate || "Cost"}</th>
                                <th className="w-[15%] text-right">{t.total || "Total"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchase.products.length > 0 ? (
                                purchase.products.map((product, index) => {
                                    // Use 'enteredQty' and 'enteredPurchasePrice' if available to match input exactly
                                    // Otherwise fallback to raw quantity/purchasePrice
                                    const displayQty = product.enteredQty || product.quantity;
                                    const rate = product.enteredPurchasePrice || product.purchasePrice;
                                    
                                    // Determine Unit Name (Base vs Secondary)
                                    // If unitMode exists, check it. Else fallback to transactionUnitId.
                                    let unitLabel = "";
                                    if(product.unitMode === 'secondary' || product.transactionUnitId === product.secondaryUnitId) {
                                        unitLabel = product.secUnitName || getUnitName(product.secondaryUnitId);
                                    } else {
                                        unitLabel = product.baseUnitName || getUnitName(product.baseUnitId);
                                    }

                                    const rowTotal = parseFloat(product.total || (rate * displayQty));

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
                                            <td className="text-right">{formatNum(rowTotal)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="5" className="text-center py-2">No products</td></tr>
                            )}
                        </tbody>
                    </table>
                    
                    <hr className="border-t-2" />
                    
                    {/* Bill Summary */}
                    <div className="space-y-0.5">
                        <div className="flex justify-between font-bold mt-1 grand-total">
                            <span>{t.grand_total || "Total Amount"}:</span>
                            <span>{currency} {formatNum(totalBill)}</span>
                        </div>
                    </div>

                    {/* Supplier Ledger Summary */}
                    {supplier && (
                        <>
                            <hr className="border-t-2 mt-2" />
                            <div className="space-y-0.5">
                                <h4 className="text-center font-bold mb-1 uppercase text-[10px]">{t.account_summary || "Account Summary"}</h4>
                                
                                {previousBalance !== 0 && (
                                    <div className="flex justify-between">
                                        <span className="font-semibold">{previousBalance > 0 ? (t.previous_balance || "Prev Payable") : (t.advance_balance || "Prev Adv")}:</span>
                                        <span>{currency} {formatNum(Math.abs(previousBalance))}</span>
                                    </div>
                                )}

                                <div className="flex justify-between"><span className="font-semibold">{t.current_bill_balance || "Curr Bill"}:</span><span className="font-bold">{currency} {formatNum(currentCredit)}</span></div>
                                <div className="flex justify-between"><span className="font-semibold">{t.paid || "Paid Now"}:</span><span>{currency} {formatNum(amountPaid)}</span></div>
                                
                                <hr />
                                
                                {/* Net Balance */}
                                {netBalance > 0 && (
                                    <div className="flex justify-between font-bold net-balance"><span>{t.net_payable || "Total Payable"}:</span><span>{currency} {formatNum(netBalance)}</span></div>
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

                    {/* FIXED FOOTER */}
                    <div className="footer-brand">
                        <p className="font-bold">Business Bachao - 03314460028</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PurchaseView;
