import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import { FaPrint } from "react-icons/fa";

const PreorderView = () => {
    const context = useAppContext();
    const preordersData = context?.preordersContext?.preorders || [];
    const people = context?.peopleContext?.people || [];
    const areas = context?.areasContext?.areas || [];
    const userAndBusinessDetail = context?.settingContext?.settings || [];

    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    // --- Data Fetching ---
    const preorder = useMemo(() => {
        return preordersData.find((p) => p.id === id) || null;
    }, [preordersData, id]);

    const person = useMemo(() => {
        if (!preorder) return null;
        return people.find((p) => p.id === preorder.personId) || null;
    }, [preorder, people]);
    
    const area = useMemo(() => {
        if (!preorder) return null;
        return areas.find((a) => a.id === preorder.areaId) || null;
    }, [preorder, areas]);

    const isPrintMode = location.pathname.includes("/print");
    const currency = userAndBusinessDetail[0]?.business?.currency || 'Rs.';

    // --- Loading Effect ---
    useEffect(() => {
        if (preordersData.length > 0 && preorder) {
            setLoading(false);
        } else if (preordersData.length > 0 && !preorder) {
            setLoading(false);
        }
    }, [preordersData, preorder]);

    // --- Print Effect ---
    useEffect(() => {
        if (isPrintMode && !loading && preorder) {
            const originalTitle = document.title;
            document.title = `Preorder - ${preorder?.preorderRefNo}`;
            
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
    }, [isPrintMode, loading, preorder, navigate]);

    const handlePrint = () => {
        navigate(`/preorders/view/${id}/print`);
    };

    if (loading) return <div className="text-center text-lg p-10">Loading Preorder Receipt...</div>;
    if (!preorder) return <div className="text-center text-red-500 text-lg p-10">Preorder not found</div>;

    const discount = parseFloat(preorder.discount || 0);
    const subtotal = parseFloat(preorder.subtotal || 0);
    const totalBill = parseFloat(preorder.totalBill || 0);

    return (
        <>
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
                        padding: 3px;
                        box-shadow: none; 
                        color: #000;
                    }
                    .no-print { 
                        display: none; 
                    }
                    .print-container, .print-container * {
                        font-size: 14px !important; 
                        font-weight: 700 !important; 
                        line-height: 1.4 !important;
                    }
                    .print-container h2 {
                        font-size: 22px !important;
                    }
                    .print-container .grand-total {
                        font-size: 18px !important;
                    }
                    .print-container .footer-text, .print-container .footer-text * {
                        font-size: 14px !important; 
                        font-weight: 700 !important;
                    }
                    hr {
                        border-top: 2px dashed #000 !important;
                    }
                    #navbar {
                      display:none !important;
                    }
                    body * { visibility: hidden !important; }
                    .print-container, .print-container * { visibility: visible !important; }
                }
            `}</style>

            <div className={`p-4 ${!isPrintMode ? 'bg-gray-100' : ''}`}>
                
                <div className="no-print flex justify-end mb-4 max-w-md mx-auto">
                    <button onClick={handlePrint} className="btn btn-primary flex items-center gap-2 w-full">
                        <FaPrint /> Print Preorder
                    </button>
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
                    
                    <div className="text-xs space-y-0.5">
                        <div className="flex justify-between"><span>Ref No:</span> <span>{preorder.preorderRefNo}</span></div>
                        {person && (<div className="flex justify-between"><span>Customer:</span> <span>{person.name}</span></div>)}
                        {area && (<div className="flex justify-between"><span>Area:</span> <span>{area.name}</span></div>)}
                        <div className="flex justify-between"><span>Date:</span> <span>{new Date(preorder.preorderDate).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Status:</span> <span className="font-bold">{preorder.status}</span></div>
                    </div>
                    
                    <hr className="my-2 border-dashed border-gray-400" />
                    
                    {/* --- Products Table --- */}
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
                            {preorder.products.length > 0 ? (
                                preorder.products.map((product, index) => {
                                    
                                    // --- LOGIC UPDATE: Use 'enteredQty' if available (New System) ---
                                    const displayQty = product.enteredQty || product.SellQuantity;
                                    const unitLabel = product.unitName || '';
                                    const rate = parseFloat(product.newSellPrice || 0);
                                    const rowTotal = rate * parseFloat(displayQty);

                                    return (
                                    <tr key={`${product.id}-${index}`}>
                                        <td className="py-1">
                                            {product.name}
                                            {/* Show Unit (e.g. Ctn) */}
                                            {unitLabel && <span className="text-[10px] font-bold ml-1">({unitLabel})</span>}
                                        </td>
                                        <td className="py-1 text-center">{displayQty}</td>
                                        <td className="py-1 text-right">{rate.toFixed(2)}</td>
                                        <td className="py-1 text-right">{rowTotal.toFixed(2)}</td>
                                    </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="4" className="text-center py-2">No products in this preorder</td></tr>
                            )}
                        </tbody>
                    </table>
                    
                    <hr className="my-2 border-t-2 border-dashed border-gray-400" />
                    
                    <div className="text-xs space-y-1">
                        <div className="flex justify-between"><span className="font-semibold">Subtotal:</span><span>{currency} {subtotal.toFixed(2)}</span></div>
                        {discount > 0 && (<div className="flex justify-between"><span className="font-semibold">Discount:</span><span>- {currency} {discount.toFixed(2)}</span></div>)}
                        <div className="flex justify-between text-sm font-bold mt-1 grand-total"><span>Grand Total:</span><span>{currency} {totalBill.toFixed(2)}</span></div>
                    </div>

                    {preorder.notes && (
                         <>
                            <hr className="my-2 border-t-2 border-dashed border-gray-400" />
                            <div className="text-xs space-y-1">
                                <h4 className="text-center font-bold mb-1 uppercase">Notes</h4>
                                <p className="text-center">{preorder.notes}</p>
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

export default PreorderView;

