import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import { FaPrint } from "react-icons/fa";

const SalesView = () => {
    const context = useAppContext();
    const salesData = context?.SaleContext?.Sales || [];
    const people = context?.peopleContext?.people || [];
    const userAndBusinessDetail = context?.settingContext?.settings || [];
    const allPurchases = context?.purchaseContext?.purchases || [];
    const submittedRecords = context?.creditManagementContext?.submittedRecords || [];
    const sellReturns = context?.SellReturnContext?.sellReturns || [];
    const purchaseReturns = context?.purchaseReturnContext?.purchaseReturns || [];

    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const sale = salesData.find((sale) => sale.id === id) || null;
    const person = people.find((p) => p.id === (sale?.personId || sale?.customerId)) || null;
    const isPrintMode = location.pathname.includes("/print");

    const currency = userAndBusinessDetail[0]?.business?.currency || 'Rs.';

    useEffect(() => {
        if (salesData.length > 0) {
            setLoading(false);
        }
    }, [salesData]);

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
        navigate(`/sales/view/${id}/print`);
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
            {/* --- UPDATED PRINT STYLES --- */}
            <style>{`
                @media print {
                    body, html { 
                        width: 80mm; 
                        margin: 0;
                        padding: 0;
                    }
                    .print-container { 
                        width: 100%; 
                        margin: 0; 
                        padding: 1px; /* Reduced padding to maximize space */
                        box-shadow: none; 
                        color: #000;
                    }
                    .no-print { 
                        display: none; 
                    }
                    /* --- ALL TEXT EVEN BIGGER & BOLDER --- */
                    .print-container, .print-container * {
                        font-size: 18px !important; /* Increased base font size */
                        font-weight: 700 !important; /* BOLD */
                        line-height: 1.5 !important;
                    }
                    .print-container h2 {
                        font-size: 26px !important; /* Business Name */
                    }
                    .print-container .grand-total, .print-container .net-balance {
                        font-size: 22px !important; /* Main Totals */
                    }
                    /* --- FOOTER FULL BIG --- */
                    .print-container .footer-text, .print-container .footer-text * {
                        font-size: 20px !important; /* Made footer extra large and bold */
                    }
                    hr {
                        border-top: 2px dashed #000 !important;
                    }
                }
            `}</style>

            <div className={`p-4 ${!isPrintMode ? 'bg-gray-100' : ''}`}>
                <div className="no-print flex justify-end mb-4">
                    <button onClick={handlePrint} className="btn btn-primary flex items-center gap-2"><FaPrint /> Print Receipt</button>
                </div>

                <div className="print-container w-72 mx-auto p-3 bg-white text-black shadow-lg font-sans">
                    {userAndBusinessDetail[0]?.business ? (
                        <div className="text-center mb-2">
                            <h2 className="text-xl font-bold">{userAndBusinessDetail[0].business.businessName}</h2>
                            <p className="text-xs">{userAndBusinessDetail[0].business.email}</p>
                            <p className="text-xs">{userAndBusinessDetail[0].business.phoneNo}</p>
                        </div>
                    ) : (
                        <p className="text-center text-red-500">Business details not found</p>
                    )}
                    <hr className="my-2 border-dashed border-gray-400" />
                    <div className="text-xs">
                        <div className="flex justify-between"><span>Ref No:</span> <span>{sale.salesRefNo}</span></div>
                        {person && (<div className="flex justify-between"><span>Customer:</span> <span>{person.name}</span></div>)}
                        <div className="flex justify-between"><span>Date:</span> <span>{new Date(sale.dateTime).toLocaleString()}</span></div>
                    </div>
                    <hr className="my-2 border-dashed border-gray-400" />
                    <table className="w-full text-xs mt-2">
                        <thead>
                            <tr className="border-b border-dashed border-gray-400">
                                <th className="py-1 text-left font-semibold">Item</th>
                                <th className="py-1 text-center font-semibold">Qty</th>
                                <th className="py-1 text-right font-semibold">Rate</th>
                                <th className="py-1 text-right font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.products.length > 0 ? (
                                sale.products.map((product, index) => (
                                    <tr key={`${product.id}-${index}`}>
                                        <td className="py-1">{product.name}</td>
                                        <td className="py-1 text-center">{product.SellQuantity}</td>
                                        <td className="py-1 text-right">{parseFloat(product.newSellPrice || product.sellPrice).toFixed(2)}</td>
                                        <td className="py-1 text-right">{(parseFloat(product.newSellPrice || product.sellPrice) * parseInt(product.SellQuantity, 10)).toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="text-center py-2">No products</td></tr>
                            )}
                        </tbody>
                    </table>
                    <hr className="my-2 border-t-2 border-dashed border-gray-400" />
                    
                    <div className="text-xs space-y-1">
                        <div className="flex justify-between"><span className="font-semibold">Subtotal:</span><span>{currency} {subtotal.toFixed(2)}</span></div>
                        {discount > 0 && (<div className="flex justify-between"><span className="font-semibold">Discount:</span><span>- {currency} {discount.toFixed(2)}</span></div>)}
                        <div className="flex justify-between text-sm font-bold mt-1 grand-total"><span>Grand Total:</span><span>{currency} {totalBill.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="font-semibold">Amount Paid:</span><span>{currency} {amountPaid.toFixed(2)}</span></div>
                    </div>

                    {person && (
                        <>
                            <hr className="my-2 border-t-2 border-dashed border-gray-400" />
                            <div className="text-xs space-y-1">
                                <h4 className="text-center font-bold mb-1 uppercase">Hisab ka Khulasa</h4>
                                
                                {previousBalance > 0 && (
                                    <div className="flex justify-between"><span className="font-semibold">Pichla Bqaya:</span><span>{currency} {previousBalance.toFixed(2)}</span></div>
                                )}
                                {previousBalance < 0 && (
                                    <div className="flex justify-between"><span className="font-semibold">Aapka Advance:</span><span>{currency} {Math.abs(previousBalance).toFixed(2)}</span></div>
                                )}

                                <div className="flex justify-between"><span className="font-semibold">Is Bill ka Bqaya:</span><span className="font-bold">{currency} {currentCredit.toFixed(2)}</span></div>
                                
                                <hr className="my-1 border-dashed border-gray-400" />
                                
                                {netBalance > 0 && (
                                    <div className="flex justify-between text-base font-bold net-balance"><span>Kul Bqaya:</span><span>{currency} {netBalance.toFixed(2)}</span></div>
                                )}
                                {netBalance < 0 && (
                                    <div className="flex justify-between text-base font-bold net-balance"><span>Kul Advance:</span><span>{currency} {Math.abs(netBalance).toFixed(2)}</span></div>
                                )}
                                {netBalance === 0 && (
                                    <div className="flex justify-between text-base font-bold net-balance"><span>Hisab Barabar:</span><span>{currency} 0.00</span></div>
                                )}
                            </div>
                        </>
                    )}

                    <hr className="my-3 border-dashed border-gray-400" />
                    <div className="text-center text-[10px] text-gray-600 footer-text">
                        <p className="font-bold">Powered by: Business Bachao</p>
                        <p>Developed by: Muhammad Hasnain Tariq</p>
                        <p>Contact: 03314460028 (WhatsApp)</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SalesView;
