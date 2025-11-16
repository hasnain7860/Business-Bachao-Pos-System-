import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import { FaPrint, FaArrowLeft, FaEdit, FaSave } from "react-icons/fa"; // FaEdit aur FaSave add kiye
import languageData from '../assets/languageData.json';

const SalesView = () => {
    const context = useAppContext();
    const { 
        SaleContext, 
        customersContext, 
        settingContext, 
        creditManagementContext, 
        SellReturnContext
    } = context;

    const salesData = SaleContext?.Sales || [];
    // Aapke feedback ke mutabiq 'editSale' function use kar rahe hain
    const editSale = SaleContext?.edit; 
    const customers = customersContext?.customers || [];
    const userAndBusinessDetail = settingContext?.settings || [];
    const submittedRecords = creditManagementContext?.submittedRecords || [];
    const sellReturns = SellReturnContext?.sellReturns || [];

    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // URL se language (V2 logic)
    const urlLang = new URLSearchParams(location.search).get('lang');
    const language = (urlLang === 'ur') ? 'ur' : 'en';
    const isUrdu = language === 'ur';

    const [loading, setLoading] = useState(true);

    const sale = salesData.find((sale) => sale.id === id) || null;
    const customer = customers.find((c) => c.id === sale?.customerId) || null;
    
    const isPrintMode = location.pathname.includes("/print");
    const currency = userAndBusinessDetail[0]?.business?.currency || 'Rs.';

    // --- NAYA STATE CARTONS KE LIYE ---
    const [totalCartons, setTotalCartons] = useState('');
    const [isEditingCartons, setIsEditingCartons] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // --- END NAYA STATE ---
    
    useEffect(() => {
        if (salesData.length > 0) {
            setLoading(false);
            if (sale) {
                // Jab sale load ho, "totalCartons" ko state mein set karo
                setTotalCartons(sale.totalCartons || ''); 
            }
        }
    }, [salesData, sale]); // 'sale' ko dependency mein add kiya

    // --- (V2 Calculation logic - No Change) ---
    const { previousBalance, netBalance } = useMemo(() => {
        if (!customer || !sale) { return { previousBalance: 0, netBalance: parseFloat(sale?.credit || 0) }; }
        let openingBalance = 0;
        const openingBalanceRecord = submittedRecords.find(r => r.partyId === customer.id && r.type === 'opening_balance');
        if (openingBalanceRecord) {
            const amount = parseFloat(openingBalanceRecord.amount || 0);
            const isReceivable = openingBalanceRecord.note?.toLowerCase().includes('receivable');
            openingBalance = isReceivable ? amount : -amount;
        }
        const totalSalesCredit = salesData.filter(s => s.customerId === customer.id).reduce((acc, s) => acc + (parseFloat(s.credit) || 0), 0);
        const totalManualPayments = submittedRecords.filter(r => r.partyId === customer.id && r.type === 'payment').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
        const totalSaleReturnAdjustments = sellReturns.filter(r => r.customerId === customer.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
        const totalCurrentBalance = openingBalance + totalSalesCredit - totalManualPayments - totalSaleReturnAdjustments;
        const currentSaleCredit = parseFloat(sale.credit || 0);
        const prevBalance = totalCurrentBalance - currentSaleCredit;
        return { previousBalance: prevBalance, netBalance: totalCurrentBalance };
    }, [id, customer, sale, salesData, submittedRecords, sellReturns, customers]);

    // --- (V2 Returns logic - No Change) ---
    const relevantReturns = useMemo(() => {
        if (!sale) return [];
        return sellReturns.filter(r => r.salesRef === sale.salesRefNo);
    }, [sale, sellReturns]);

    const { totalAmountReturnedForThisSale, totalCashReturnedForThisSale, totalCreditAdjustmentForThisSale } = useMemo(() => {
        let totalAmount = 0, cashReturn = 0, creditAdjustment = 0;
        relevantReturns.forEach(r => {
            totalAmount += (parseFloat(r.totalAmount) || 0);
            cashReturn += (r.paymentDetails?.cashReturn || 0);
            creditAdjustment += (r.paymentDetails?.creditAdjustment || 0);
        });
        return { totalAmountReturnedForThisSale: totalAmount, totalCashReturnedForThisSale: cashReturn, totalCreditAdjustmentForThisSale: creditAdjustment };
    }, [relevantReturns]);

    // --- (V2 Print effect - No Change) ---
    useEffect(() => {
        if (isPrintMode && !loading && sale) {
            const originalTitle = document.title;
            document.title = `Sale - ${sale.salesRefNo}`;
            const handleAfterPrint = () => {
                document.title = originalTitle;
                navigate(`/sales/view/${id}?lang=${language}`, { replace: true });
            };
            window.addEventListener("afterprint", handleAfterPrint);
            setTimeout(() => window.print(), 500);
            return () => {
                window.removeEventListener("afterprint", handleAfterPrint);
                document.title = originalTitle;
            };
        }
    }, [isPrintMode, loading, sale, navigate, id, language]);

    // --- (V2 Handle Print - No Change) ---
    const handlePrint = () => {
        navigate(`/sales/view/${id}/print?lang=${language}`);
    };

    // --- NAYA FUNCTION: CARTONS SAVE KARNE KE LIYE ---
    const handleSaveCartons = async () => {
        if (!editSale) {
            console.error("CRITICAL: editSale function context se nahi mil raha.");
            // Yahan non-blocking error dikhana behtar hai, par abhi ke liye console
            return;
        }
        if (!sale) {
            console.error("Sale data not loaded, cannot save.");
            return;
        }
        if (isSaving) return;
        setIsSaving(true);
        try {
            // Aapke feedback ke mutabiq: { ...sale, ...newData }
            await editSale(id, { ...sale, totalCartons: totalCartons });
            setIsEditingCartons(false);
        } catch (err) {
            console.error("Failed to save cartons:", err);
            // Yahan user ko error dikhayein
        } finally {
            setIsSaving(false);
        }
    };
    // --- END NAYA FUNCTION ---
    
    if (loading) return <div className="text-center text-lg p-10">Loading Receipt...</div>;
    if (!sale) return <div className="text-center text-red-500 text-lg p-10">Sale not found</div>;

    // --- (V2 Calculations - No Change) ---
    const discount = parseFloat(sale.discount || 0);
    const subtotal = parseFloat(sale.subtotal || (parseFloat(sale.totalBill || 0) + discount));
    const totalBill = parseFloat(sale.totalBill || 0);
    const amountPaid = parseFloat(sale.amountPaid || 0);
    const currentCredit = parseFloat(sale.credit || 0);
    const netBillAfterReturns = totalBill - totalAmountReturnedForThisSale;
    const totalDisplayQuantity = sale.products.reduce((acc, product) => {
        const qty = product.saleUnitDetails ? parseInt(product.saleUnitDetails.displayQuantity, 10) : parseInt(product.SellQuantity, 10);
        return acc + qty;
    }, 0);

    return (
        <>
            <style>{`
                /* --- (V2 Print styles - No Change) --- */
                @media print {
                    @page { size: 80mm auto; margin: 0 !important; }
                    body, html { margin: 0 !important; padding: 0 !important; background-color: #fff !important; }
                    body * { visibility: hidden !important; }
                    .print-container, .print-container * { visibility: visible !important; }
                    .print-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 4px !important; box-shadow: none !important; }
                    .print-container, .print-container * { font-family: 'Arial', sans-serif; font-size: 13px !important; font-weight: 500 !important; line-height: 1.3 !important; color: #000 !important; }
                    .print-container h2 { font-size: 20px !important; font-weight: 700 !important; margin-bottom: 3px; }
                    .print-container .grand-total, .print-container .net-balance { font-size: 16px !important; font-weight: 700 !important; }
                    .print-container .net-bill { font-size: 14px !important; font-weight: 700 !important; }
                    hr { border-top: 1px dashed #000 !important; margin: 5px 0 !important; }
                    .product-row-line { border-bottom: 1px dotted #555; }
                    .summary-box { margin-top: 5px; padding-top: 5px; border-top: 1px solid #000; }
                    .footer-text p { margin: 0; font-size: 11px !important; }
                    .no-print, #navbar { display: none !important; }
                }
            `}</style>

            <div className={`p-4 ${!isPrintMode ? 'bg-gray-100' : ''}`}>
                
                {/* --- YAHAN TABDEELI KI GAYI HAI (NO-PRINT SECTION) --- */}
                {/* Ye poora div print mein automatically hide ho jayega */}
                <div className={`no-print flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mb-4`}>
                    
                    {/* NAYA EDIT BOX (Order 2 mobile pe, Order 1 desktop pe) */}
                    <div className={`bg-white p-3 rounded-lg shadow-md flex items-center gap-3 w-full sm:w-auto ${isUrdu ? 'flex-row-reverse' : ''}`}>
                        <label className="font-semibold whitespace-nowrap">{languageData[language]?.total_cartons || 'Total Cartons (Nag):'}</label>
                        {!isEditingCartons ? (
                            <>
                                <span className="text-lg font-bold">{totalCartons || (languageData[language]?.not_available || 'N/A')}</span>
                                <button onClick={() => setIsEditingCartons(true)} className="btn btn-sm btn-outline btn-circle">
                                    <FaEdit />
                                </button>
                            </>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={totalCartons}
                                    onChange={(e) => setTotalCartons(e.target.value)}
                                    className="input input-bordered input-sm w-full max-w-[150px]"
                                    placeholder={languageData[language]?.carton_placeholder || 'e.g., 5 ctn'}
                                    disabled={isSaving}
                                />
                                <button onClick={handleSaveCartons} className="btn btn-sm btn-primary btn-circle" disabled={isSaving}>
                                    {isSaving ? <span className="loading loading-spinner loading-xs"></span> : <FaSave />}
                                </button>
                            </>
                        )}
                    </div>
                    
                    {/* V2 Ke Buttons (Order 1 mobile pe, Order 2 desktop pe) */}
                    <div className={`flex items-center gap-2 w-full sm:w-auto ${isUrdu ? 'justify-start' : 'justify-end'}`}>
                        <button 
                            onClick={() => navigate(-1)} 
                            className="btn btn-ghost flex items-center gap-2"
                        >
                            <FaArrowLeft /> {languageData[language]?.back || 'Back'}
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <FaPrint /> {languageData[language]?.print_receipt || 'Print Receipt'}
                        </button>
                    </div>
                </div>
                {/* --- END TABDEELI --- */}


                {/* --- (V2 PRINT CONTAINER - Jaisa tha) --- */}
                <div 
                    className={`print-container w-80 mx-auto p-3 bg-white text-black shadow-lg font-sans ${isUrdu ? 'text-right' : 'text-left'}`}
                    dir={isUrdu ? 'rtl' : 'ltr'}
                >
                    {/* --- (V2 Header - No Change) --- */}
                    {userAndBusinessDetail[0]?.business ? (
                        <div className="text-center mb-2">
                            <h2 className="text-xl font-bold">{userAndBusinessDetail[0].business.businessName}</h2>
                            <p className="text-xs">{userAndBusinessDetail[0].business.email}</p>
                            <p className="text-xs">{userAndBusinessDetail[0].business.phoneNo}</p>
                        </div>
                    ) : (
                        <p className="text-center text-red-500">Business details not found</p>
                    )}
                    <hr />
                    {/* --- (V2 Sale Info - No Change) --- */}
                    <div className="text-xs">
                        <div className="flex justify-between"><span>{languageData[language]?.invoice_no || 'Invoice No:'}</span> <span>{sale.salesRefNo}</span></div>
                        {customer && (<div className="flex justify-between"><span>{languageData[language]?.customer || 'Customer:'}</span> <span>{customer.name}</span></div>)}
                        <div className="flex justify-between"><span>{languageData[language]?.date || 'Date:'}</span> <span>{new Date(sale.dateTime).toLocaleString()}</span></div>
                    </div>
                    <hr />
                    {/* --- (V2 Products Table - No Change) --- */}
                    <table className="w-full text-xs mt-2">
                        <thead>
                            <tr className={`border-b border-black ${isUrdu ? 'text-right' : 'text-left'}`}>
                                <th className="py-1 font-semibold">#</th>
                                <th className={`py-1 font-semibold ${isUrdu ? 'text-right' : 'text-left'}`}>{languageData[language]?.item || 'Item'}</th>
                                <th className="py-1 text-center font-semibold">{languageData[language]?.qty || 'Qty'}</th>
                                <th className={`py-1 font-semibold ${isUrdu ? 'text-left' : 'text-right'}`}>{languageData[language]?.rate || 'Rate'}</th>
                                <th className={`py-1 font-semibold ${isUrdu ? 'text-left' : 'text-right'}`}>{languageData[language]?.total || 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.products.length > 0 ? (
                                sale.products.map((product, index) => {
                                    const displayQty = product.saleUnitDetails ? product.saleUnitDetails.displayQuantity : product.SellQuantity;
                                    const unitName = product.saleUnitDetails ? product.saleUnitDetails.unitName : '';
                                    const rate = parseFloat(product.newSellPrice || 0);
                                    const total = rate * parseFloat(displayQty || 0);

                                    return (
                                        <tr key={`${product.id}-${index}`} className="product-row-line border-t border-gray-400 border-dotted">
                                            <td className="py-1">{index + 1})</td>
                                            <td className={`py-1 ${isUrdu ? 'text-right' : 'text-left'}`}>
                                                {isUrdu ? (product.nameInUrdu || product.name) : product.name}
                                            </td>
                                            <td className="py-1 text-center">{displayQty} {unitName}</td>
                                            <td className={`py-1 ${isUrdu ? 'text-left' : 'text-right'}`}>{rate.toFixed(2)}</td>
                                            <td className={`py-1 ${isUrdu ? 'text-left' : 'text-right'}`}>{total.toFixed(2)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="5" className="text-center py-2">No products</td></tr>
                            )}
                        </tbody>
                    </table>
                    
                    <div className="flex justify-between font-semibold text-xs mt-2 pt-1">
                        <span>{languageData[language]?.total_items || 'Total Items:'}</span>
                        <span>{totalDisplayQuantity}</span>
                    </div>

                    {/* --- YAHAN TABDEELI KI GAYI HAI (PRINT CONTAINER KE ANDAR) --- */}
                    {/* Ye line print mein nazar ayegi agar value hai */}
                    {totalCartons && (
                        <div className="flex justify-between font-semibold text-sm mt-2 pt-1 border-t border-dotted border-black">
                            <span>{languageData[language]?.total_cartons || 'Total Cartons (Nag):'}</span>
                            <span>{totalCartons}</span>
                        </div>
                    )}
                    {/* --- END TABDEELI --- */}
                    
                    {/* --- (V2 Returns Table - No Change) --- */}
                    {relevantReturns.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-black">
                            <h4 className="text-center font-bold text-xs mb-1 uppercase">{languageData[language]?.sale_returns_invoice || 'Sale Returns (Against this Invoice)'}</h4>
                            {/* ... poora returns table ... */}
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className={`border-b border-black ${isUrdu ? 'text-right' : 'text-left'}`}>
                                        <th className={`py-1 font-semibold ${isUrdu ? 'text-right' : 'text-left'}`}>{languageData[language]?.item || 'Item'}</th>
                                        <th className="py-1 text-center font-semibold">{languageData[language]?.qty || 'Qty'}</th>
                                        <th className={`py-1 font-semibold ${isUrdu ? 'text-left' : 'text-right'}`}>{languageData[language]?.amount || 'Amount'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {relevantReturns.map(ret => (
                                        ret.returnedProducts.map((product, pIndex) => (
                                            <tr key={`${ret.id}-${pIndex}`} className="product-row-line">
                                                <td className={`py-1 ${isUrdu ? 'text-right' : 'text-left'}`}>
                                                    {isUrdu ? (product.nameInUrdu || product.name) : product.name}
                                                </td>
                                                <td className="py-1 text-center">{product.returnDisplayQty} {product.unitName}</td>
                                                <td className={`py-1 ${isUrdu ? 'text-left' : 'text-right'}`}>{currency} {(product.total || 0).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-black">
                                        <td colSpan="2" className={`py-1 font-bold ${isUrdu ? 'text-left' : 'text-right'}`}>{languageData[language]?.total_returned || 'Total Returned:'}</td>
                                        <td className={`py-1 font-bold ${isUrdu ? 'text-left' : 'text-right'}`}>{currency} {totalAmountReturnedForThisSale.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* --- (V2 Sale Summary - No Change) --- */}
                    <div className="text-xs space-y-1 mt-2 border-t border-black">
                        <div className="flex justify-between"><span className="font-semibold">{languageData[language]?.subtotal || 'Subtotal:'}</span><span>{currency} {subtotal.toFixed(2)}</span></div>
                        {discount > 0 && (<div className="flex justify-between"><span className="font-semibold">{languageData[language]?.discount || 'Discount:'}</span><span>- {currency} {discount.toFixed(2)}</span></div>)}
                        <div className={`flex justify-between mt-1 ${totalAmountReturnedForThisSale > 0 ? 'text-sm font-semibold' : 'text-sm font-bold grand-total'}`}>
                            <span>{totalAmountReturnedForThisSale > 0 ? (languageData[language]?.original_bill || 'Original Bill:') : (languageData[language]?.grand_total || 'Grand Total:')}</span>
                            <span>{currency} {totalBill.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between"><span className="font-semibold">{languageData[language]?.amount_paid_original || 'Amount Paid (Original):'}</span><span>{currency} {amountPaid.toFixed(2)}</span></div>
                        {totalAmountReturnedForThisSale > 0 && (
                            <>
                                <div className="flex justify-between"><span className="font-semibold">{languageData[language]?.total_returned || 'Total Returned:'}</span><span>- {currency} {totalAmountReturnedForThisSale.toFixed(2)}</span></div>
                                <div className="flex justify-between text-base font-bold mt-1 net-bill"><span>{languageData[language]?.net_bill || 'Net Bill:'}</span><span>{currency} {netBillAfterReturns.toFixed(2)}</span></div>
                                {totalCashReturnedForThisSale > 0 && (
                                    <div className={`flex justify-between ${isUrdu ? 'pr-4' : 'pl-4'}`}><span className="font-semibold">{languageData[language]?.cash_returned || 'Cash Returned:'}</span><span>{currency} {totalCashReturnedForThisSale.toFixed(2)}</span></div>
                                )}
                                {totalCreditAdjustmentForThisSale > 0 && (
                                    <div className={`flex justify-between ${isUrdu ? 'pr-4' : 'pl-4'}`}><span className="font-semibold">{languageData[language]?.credit_adjusted || 'Credit Adjusted:'}</span><span>{currency} {totalCreditAdjustmentForThisSale.toFixed(2)}</span></div>
                                )}
                            </>
                        )}
                    </div>

                    {/* --- (V2 Balance Summary - No Change) --- */}
                    {customer && (
                        <div className="summary-box">
                            <h4 className="text-center font-bold text-xs mb-1 uppercase border-b border-black">{languageData[language]?.overall_balance_summary || 'Overall Balance Summary'}</h4>
                            {previousBalance > 0 && (
                                <div className="flex justify-between text-xs"><span className="font-semibold">{languageData[language]?.previous_balance || 'Previous Balance:'}</span><span>{currency} {previousBalance.toFixed(2)}</span></div>
                            )}
                            {previousBalance < 0 && (
                                <div className="flex justify-between text-xs"><span className="font-semibold">{languageData[language]?.your_advance || 'Your Advance:'}</span><span>{currency} {Math.abs(previousBalance).toFixed(2)}</span></div>
                            )}
                            <div className="flex justify-between text-xs"><span className="font-semibold">{languageData[language]?.this_bills_credit || "This Bill's Credit:"}</span><span className="font-bold">{currency} {currentCredit.toFixed(2)}</span></div>
                            <hr className="my-1"/>
                            {netBalance > 0 && (
                                <div className="flex justify-between text-base font-bold net-balance"><span>{languageData[language]?.net_balance_due || 'Net Balance Due:'}</span><span>{currency} {netBalance.toFixed(2)}</span></div>
                            )}
                            {netBalance < 0 && (
                                <div className="flex justify-between text-base font-bold net-balance"><span>{languageData[language]?.total_advance || 'Total Advance:'}</span><span>{currency} {Math.abs(netBalance).toFixed(2)}</span></div>
                            )}
                            {netBalance === 0 && (
                                <div className="flex justify-between text-base font-bold net-balance"><span>{languageData[language]?.balance_cleared || 'Balance Cleared:'}</span><span>{currency} 0.00</span></div>
                            )}
                        </div>
                    )}

                    {/* --- (V2 Footer - No Change) --- */}
                    <hr />
                    <div className="text-center text-xs text-gray-600 footer-text">
                        <p className="font-bold">Powered by: Business Bachao</p>
                        <p className="font-bold">Developed by: Muhammad Hasnain Tariq</p>
                        <p className="font-bold">Contact: 03314460028 (WhatsApp)</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SalesView;


