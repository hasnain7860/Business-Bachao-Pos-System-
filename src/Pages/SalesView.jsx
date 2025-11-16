import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import { FaPrint, FaArrowLeft, FaEdit, FaSave } from "react-icons/fa";
import languageData from '../assets/languageData.json';

const SalesView = () => {
    // --- (Context and State setup - No Change) ---
    const context = useAppContext();
    const { 
        SaleContext, 
        peopleContext, 
        settingContext, 
        creditManagementContext, 
        SellReturnContext,
        purchaseContext, 
        purchaseReturnContext 
    } = context;

    const salesData = SaleContext?.Sales || [];
    const editSale = SaleContext?.edit; 
    const people = peopleContext?.people || []; 
    const userAndBusinessDetail = settingContext?.settings || [];
    const submittedRecords = creditManagementContext?.submittedRecords || [];
    const sellReturns = SellReturnContext?.sellReturns || [];
    const allPurchases = purchaseContext?.purchases || [];
    const purchaseReturns = purchaseReturnContext?.purchaseReturns || [];

    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const urlLang = new URLSearchParams(location.search).get('lang');
    const language = (urlLang === 'ur') ? 'ur' : 'en';
    const isUrdu = language === 'ur';

    const [loading, setLoading] = useState(true);
    const sale = salesData.find((sale) => sale.id === id) || null;
    const person = people.find((p) => p.id === sale?.personId) || null;
    const isPrintMode = location.pathname.includes("/print");
    const currency = userAndBusinessDetail[0]?.business?.currency || 'Rs.';

    const [totalCartons, setTotalCartons] = useState('');
    const [isEditingCartons, setIsEditingCartons] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (salesData.length > 0) {
            setLoading(false);
            if (sale) {
                setTotalCartons(sale.totalCartons || ''); 
            }
        }
    }, [salesData, sale]);

    // --- (Hisab Logic - No Change) ---
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
        const totalPurchaseCredit = allPurchases.filter(p => p.personId === person.id).reduce((acc, r) => acc + (parseFloat(r.credit) || 0), 0);
        const purchaseReturnAdjustments = purchaseReturns.filter(r => r.people === person.id).reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
        const netPayable = totalPurchaseCredit - purchaseReturnAdjustments;
        const totalCurrentBalance = netReceivable - netPayable;
        const currentSaleCredit = parseFloat(sale.credit || 0);
        const prevBalance = totalCurrentBalance - currentSaleCredit;
        return { previousBalance: prevBalance, netBalance: totalCurrentBalance };
    }, [id, person, sale, salesData, allPurchases, submittedRecords, sellReturns, purchaseReturns, people]);

    // --- (Other Hooks and Functions - No Change) ---
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

    const handlePrint = () => {
        navigate(`/sales/view/${id}/print?lang=${language}`);
    };
    const handleSaveCartons = async () => {
        if (!editSale) { console.error("editSale function missing"); return; }
        if (!sale) { console.error("Sale data missing"); return; }
        if (isSaving) return;
        setIsSaving(true);
        try {
            await editSale(id, { ...sale, totalCartons: totalCartons });
            setIsEditingCartons(false);
        } catch (err) { console.error("Failed to save cartons:", err); } 
        finally { setIsSaving(false); }
    };
    
    if (loading) return <div className="text-center text-lg p-10">Loading Receipt...</div>;
    if (!sale) return <div className="text-center text-red-500 text-lg p-10">Sale not found</div>;

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
            {/* --- 80MM PRINT FIX --- */}
            <style>{`
                @media print {
                    @page { size: 80mm auto; margin: 0 !important; }
                    body, html { margin: 0 !important; padding: 0 !important; background-color: #fff !important; }
                    body * { visibility: hidden !important; }
                    .no-print, #navbar { display: none !important; }
                    .print-container, .print-container * { visibility: visible !important; }
                    .print-container { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important; 
                        margin: 0 !important; 
                        padding: 2px !important; 
                        box-shadow: none !important; 
                    }
                    .print-container, .print-container * {
                        font-family: 'Arial', sans-serif; 
                        font-size: 12px !important; 
                        font-weight: 600 !important; 
                        line-height: 1.2 !important; 
                        color: #000 !important;
                    }
                    .print-container h2 { font-size: 18px !important; font-weight: 700 !important; }
                    .print-container .grand-total, .print-container .net-balance { font-size: 14px !important; }
                    .print-container .footer-text p { font-size: 10px !important; }
                    hr { border-top: 1px dashed #000 !important; margin: 3px 0 !important; }
                    .summary-box { margin-top: 3px; padding-top: 3px; }
                    .text-xs { font-size: 11px !important; }
                    .py-1 { padding-top: 1px !important; padding-bottom: 1px !important; }
                    
                    /* --- START OF PRINT FIX --- */
                    .print-container table { 
                        table-layout: fixed; 
                        width: 100%; 
                    }
                    
                    .print-container td {
                        vertical-align: top; /* Ensures all cells align to the top */
                    }

                    /* Products Table (4 columns) */
                    .products-table th:nth-child(1), .products-table td:nth-child(1) { 
                        width: 50%; 
                        word-break: break-word; /* Allows long item names to wrap */
                    } /* Item */
                    .products-table th:nth-child(2), .products-table td:nth-child(2) { 
                        width: 15%; 
                        text-align: center !important; 
                        white-space: nowrap; /* Prevents Qty from wrapping */
                    } /* Qty */
                    .products-table th:nth-child(3), .products-table td:nth-child(3) { 
                        width: 20%; 
                        text-align: right !important; 
                        white-space: nowrap; /* Prevents Rate from wrapping */
                    } /* Rate */
                    .products-table th:nth-child(4), .products-table td:nth-child(4) { 
                        width: 15%; 
                        text-align: right !important; 
                        white-space: nowrap; /* Prevents Total from wrapping */
                    } /* Total */

                    /* Returns Table (3 columns) */
                    .returns-table th:nth-child(1), .returns-table td:nth-child(1) { 
                        width: 50%; 
                        word-break: break-word; /* Allows long item names to wrap */
                    } /* Item */
                    .returns-table th:nth-child(2), .returns-table td:nth-child(2) { 
                        width: 20%; 
                        text-align: center !important; 
                        white-space: nowrap; /* Prevents Qty from wrapping */
                    } /* Qty */
                    .returns-table th:nth-child(3), .returns-table td:nth-child(3) { 
                        width: 30%; 
                        text-align: right !important; 
                        white-space: nowrap; /* Prevents Amount from wrapping */
                    } /* Amount */
                    /* --- END OF PRINT FIX --- */
                }
            `}</style>

            <div className={`p-4 ${!isPrintMode ? 'bg-gray-100' : ''}`}>
                
                {/* --- (Carton Edit Box - No Change) --- */}
                <div className={`no-print flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mb-4`}>
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

                {/* --- (Print Container) --- */}
                <div 
                    className={`print-container w-80 mx-auto p-3 bg-white text-black shadow-lg font-sans ${isUrdu ? 'text-right' : 'text-left'}`}
                    dir={isUrdu ? 'rtl' : 'ltr'}
                >
                    {/* ... (Header & Info - No Change) ... */}
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
                    <div className="text-xs">
                        <div className="flex justify-between"><span>{languageData[language]?.invoice_no || 'Invoice No:'}</span> <span>{sale.salesRefNo}</span></div>
                        {person && (<div className="flex justify-between"><span>{languageData[language]?.customer || 'Customer:'}</span> <span>{person.name}</span></div>)}
                        <div className="flex justify-between"><span>{languageData[language]?.date || 'Date:'}</span> <span>{new Date(sale.dateTime).toLocaleString()}</span></div>
                    </div>
                    <hr />

                    {/* --- TABLE (S.NO. REMOVED) --- */}
                    <table className="w-full text-xs mt-2 products-table">
                        <thead>
                            <tr className={`border-b border-black`}>
                                {/* --- S.No. Column Removed --- */}
                                <th className={`py-1 font-semibold ${isUrdu ? 'text-right' : 'text-left'}`}>{languageData[language]?.item || 'Item'}</th>
                                <th className="py-1 font-semibold text-center">{languageData[language]?.qty || 'Qty'}</th>
                                <th className="py-1 font-semibold text-right">{languageData[language]?.rate || 'Rate'}</th>
                                <th className="py-1 font-semibold text-right">{languageData[language]?.total || 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.products.length > 0 ? (
                                sale.products.map((product, index) => {
                                    const displayQty = product.saleUnitDetails ? product.saleUnitDetails.displayQuantity : product.SellQuantity;
                                    const unitName = product.saleUnitDetails ? product.saleUnitDetails.unitName : '';
                                    const rate = parseFloat(product.newSellPrice || product.sellPrice || 0);
                                    const total = rate * parseFloat(displayQty || 0);

                                    return (
                                        <tr key={`${product.id}-${index}`} className="product-row-line border-t border-gray-400 border-dotted">
                                            {/* --- S.No. Column Removed --- */}
                                            <td className={`py-1 ${isUrdu ? 'text-right' : 'text-left'}`}>
                                                {isUrdu ? (product.nameInUrdu || product.name) : product.name}
                                            </td>
                                            <td className="py-1 text-center">{displayQty} {unitName}</td>
                                            <td className="py-1 text-right">{rate.toFixed(2)}</td>
                                            <td className="py-1 text-right">{total.toFixed(2)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="4" className="text-center py-2">No products</td></tr>
                            )}
                        </tbody>
                    </table>
                    
                    {/* ... (Total Items, Cartons, Returns Table - No Change) ... */}
                    <div className="flex justify-between font-semibold text-xs mt-2 pt-1">
                        <span>{languageData[language]?.total_items || 'Total Items:'}</span>
                        <span>{totalDisplayQuantity}</span>
                    </div>
                    {totalCartons && (
                        <div className="flex justify-between font-semibold text-sm mt-2 pt-1 border-t border-dotted border-black">
                            <span>{languageData[language]?.total_cartons || 'Total Cartons (Nag):'}</span>
                            <span>{totalCartons}</span>
                        </div>
                    )}
                    {relevantReturns.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-black">
                            <h4 className="text-center font-bold text-xs mb-1 uppercase">{languageData[language]?.sale_returns_invoice || 'Sale Returns (Against this Invoice)'}</h4>
                            <table className="w-full text-xs returns-table">
                                <thead>
                                    <tr className={`border-b border-black`}>
                                        <th className={`py-1 font-semibold ${isUrdu ? 'text-right' : 'text-left'}`}>{languageData[language]?.item || 'Item'}</th>
                                        <th className="py-1 font-semibold text-center">{languageData[language]?.qty || 'Qty'}</th>
                                        <th className="py-1 font-semibold text-right">{languageData[language]?.amount || 'Amount'}</th>
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
                                                <td className="py-1 text-right">{currency} {(product.total || 0).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-black">
                                        <td colSpan="2" className={`py-1 font-bold ${isUrdu ? 'text-left' : 'text-right'}`}>{languageData[language]?.total_returned || 'Total Returned:'}</td>
                                        <td className={`py-1 font-bold text-right`}>{currency} {totalAmountReturnedForThisSale.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* ... (Sale Summary - No Change) ... */}
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

                    {/* --- (Hisab Ka Khulasa - No Change) --- */}
                    {person && (
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

                    {/* --- (Footer - No Change) --- */}
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


