import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SelectedProductsTable from "../components/element/SelectedProductsTable.jsx";
import ProductSearch from "../components/element/ProductSearch.jsx";

import { useAppContext } from "../Appfullcontext";
import { v4 as uuidv4 } from "uuid";
import AddProductModal from "../components/element/AddProductModal";
import { CalculateUserCredit } from "../Utils/CalculateUserCredit";

// Import Smart Modal
import PeopleFormModal from "../components/people/PeopleFormModal"; 

const NewSales = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const context = useAppContext();

    // --- CRITICAL FIX: Universal Store Mapping ---
    const { peopleContext, productContext, preordersContext, SaleContext } = context;
    
    const people = peopleContext.data || [];
    const products = productContext.data || [];
    const preorders = preordersContext.data || []; 
    
    const editProduct = productContext.edit;
    const editPreorder = preordersContext.edit; 

    // Ref for printing
    const isPrint = useRef(false);
    
    // NEW: Ref for Search Input Focus
    const searchInputRef = useRef(null);

    const [salesRefNo, setSalesRefNo] = useState("");
    const [selectedPerson, setSelectedPerson] = useState("");
    const [searchPerson, setSearchPerson] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [searchProduct, setSearchProduct] = useState("");
    const [paymentMode, setPaymentMode] = useState("cash");
    const [amountPaid, setAmountPaid] = useState("0");
    const [credit, setCredit] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedModalProduct, setSelectedModalProduct] = useState(null);
    const [message, setMessage] = useState("");
    const [userCreditData, setUserCreditData] = useState(null);
    const [sourcePreorderId, setSourcePreorderId] = useState(null);
    const [globalPriceMode, setGlobalPriceMode] = useState('sell');

    const [showPeopleModal, setShowPeopleModal] = useState(false);

    useEffect(() => {
        if (selectedPerson) {
            setUserCreditData(CalculateUserCredit(context, selectedPerson));
        }
    }, [selectedPerson, context]); 

    // --- FIXED: Preorder Data Loading ---
    useEffect(() => {
        if (location.state && location.state.preorderData) {
             const { preorderData } = location.state;
             
             console.log("Loading Preorder:", preorderData); // Debugging

             setSourcePreorderId(preorderData.id);
             setSelectedPerson(preorderData.personId);
             setDiscount(preorderData.discount || 0);
             
             // FIX 1: Check for 'products', NOT 'items'
             if (preorderData.products && Array.isArray(preorderData.products)) {
                 // FIX 2: Map data to ensure UI fields exist (just like in Edit Preorder)
                 const mappedProducts = preorderData.products.map(p => ({
                    ...p,
                    // Ensure UI fields exist
                    enteredQty: p.enteredQty || p.SellQuantity,
                    unitMode: p.unitMode || 'base',
                    unitName: p.unitName || 'Pcs',
                    conversionRate: p.conversionRate || 1,
                    newSellPrice: p.newSellPrice || p.sellPrice 
                 }));
                 
                 // FIX 3: Actually set the state!
                 setSelectedProducts(mappedProducts); 
             }

             // Clean up location state so refresh doesn't reload it
             navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);


    useEffect(() => {
        if (!sourcePreorderId) {
            setSalesRefNo(`SALE-${Math.floor(100000 + Math.random() * 900000)}`);
        }
    }, [sourcePreorderId]); 

    useEffect(() => {
        handleCalculateCredit();
    }, [selectedProducts, amountPaid, discount]);


    const handlePersonAdded = (newPerson) => {
        setMessage(`Person Added: ${newPerson.name}`);
        setSelectedPerson(newPerson.id); 
        setSearchPerson("");
        setTimeout(() => setMessage(""), 3000);
    };


    const handleAddProduct = (product, batch, userEnteredQty, basePrice, priceType, unitMode, conversionRate, unitName) => {
         setSelectedProducts(currentProducts => {
             const totalPieces = unitMode === 'secondary' ? Number(userEnteredQty) * Number(conversionRate) : Number(userEnteredQty);
             const displayPrice = unitMode === 'secondary' ? Number(basePrice) * Number(conversionRate) : Number(basePrice);
             
             const existingProduct = currentProducts.find(p => p.id === product.id && p.batchCode === batch.batchCode);
             if (existingProduct) { alert("Already in list"); return currentProducts; }
             
             if (batch.quantity > 0) {
                return [...currentProducts, { 
                    ...product, 
                    batchCode: batch.batchCode, 
                    SellQuantity: totalPieces, 
                    purchasePrice: batch.purchasePrice, 
                    enteredQty: userEnteredQty, 
                    unitMode: unitMode || 'base', 
                    unitName: unitName || 'Pcs', 
                    conversionRate: conversionRate || 1, 
                    newSellPrice: displayPrice, 
                    discount: 0, 
                    priceUsedType: priceType, 
                    batchQuantity: batch.quantity, 
                    sellPrice: batch.sellPrice, 
                    wholeSalePrice: batch.wholeSalePrice 
                }];
             }
             return currentProducts; 
        });

        // --- NEW LOGIC START ---
        // 1. Clear the search bar
        setSearchProduct("");
        
        // 2. Close Modal (Ensure modal closes)
        setShowAddModal(false);

        // 3. Auto Focus back to Search Input
        // Using setTimeout to ensure the modal unmounts/closes before we try to focus
        setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, 100);
        // --- NEW LOGIC END ---
    };

    const handleProductChange = (id, batchCode, field, value) => {
        setSelectedProducts(currentProducts => {
            return currentProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    if (field === "enteredQty") { 
                        const val = Number(value);
                        const conv = p.conversionRate || 1;
                        return { ...p, enteredQty: val, SellQuantity: val * conv };
                    }
                    return { ...p, [field]: value };
                }
                return p;
            });
        });
    };
    
    const handleSellingPriceChange = (id, batchCode, value) => {
         setSelectedProducts(currentProducts => {
            return currentProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    const newSellPrice = Number(value);
                    const type = p.priceUsedType || 'sell';
                    let baseStandardPrice = type === 'wholesale' ? Number(p.wholeSalePrice) : Number(p.sellPrice);
                    let standardDisplayPrice = p.unitMode === 'secondary' ? baseStandardPrice * (Number(p.conversionRate) || 1) : baseStandardPrice;
                    let discountPercent = 0;
                    if (standardDisplayPrice > 0) { discountPercent = ((standardDisplayPrice - newSellPrice) / standardDisplayPrice) * 100; }
                    if (discountPercent < 0) { discountPercent = 0; }
                    return { ...p, newSellPrice: newSellPrice, discount: discountPercent.toFixed(2) }; 
                }
                return p;
            });
        });
    };

    const handleOpenAddModal = (product, batch) => {
        setSelectedModalProduct(product);
        setSelectedBatch(batch);
        setShowAddModal(true);
    };

    const validateSellingPrice = product => {
        const costPerPiece = Number(product.purchasePrice);
        const totalCostForUnit = product.unitMode === 'secondary' ? costPerPiece * (product.conversionRate || 1) : costPerPiece;
        return Number(product.newSellPrice) < totalCostForUnit;
    };

    const calculateSubtotal = () => {
        return selectedProducts.reduce((total, product) => {
            return Number(total) + (Number(product.newSellPrice) * Number(product.enteredQty));
        }, 0);
    };

    const calculateTotalPayment = () => {
        const subtotal = calculateSubtotal();
        const finalTotal = subtotal - Number(discount);
        return Math.max(0, finalTotal).toFixed(2);
    };

    const handleAmountPaidChange = e => { setAmountPaid(e.target.value); };
    let amountPaidcheck = amountPaid === "" ? 0 : Number(amountPaid);

    const handleCalculateCredit = () => {
        setCredit(Number(calculateTotalPayment()) - Number(amountPaidcheck));
    };

    const handleSaveSales = async () => {
        if (!selectedPerson) { setMessage("Please add a person first."); return; }
        if (selectedProducts.length === 0) { setMessage("Please add at least one product."); return; }
        for (let p of selectedProducts) {
            if(p.SellQuantity > p.batchQuantity) { setMessage(`Stock Insufficient for ${p.name}`); return; }
        }
        if (amountPaidcheck > calculateTotalPayment()) { setMessage("Amount paid cannot be greater than total bill."); return; }

        const uniqueId = uuidv4();
        const salesData = {
            id: uniqueId,
            salesRefNo,
            personId: selectedPerson,
            products: selectedProducts,
            paymentMode,
            subtotal: calculateSubtotal().toFixed(2),
            discount: discount,
            totalBill: calculateTotalPayment(),
            amountPaid,
            credit,
            dateTime: new Date().toISOString(),
            sourcePreorderId: sourcePreorderId 
        };

        // Stock Update
        for (let product of selectedProducts) {
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) {
                const updatedBatchCode = originalProduct.batchCode.map(batch => {
                        if (batch.batchCode === product.batchCode) { return { ...batch, quantity: batch.quantity - product.SellQuantity }; }
                        return batch;
                    }
                );
                await editProduct(product.id, { ...originalProduct, batchCode: updatedBatchCode });
            }
        }
        await SaleContext.add(salesData);

        if (sourcePreorderId) {
            // Updated to use array lookup
            const originalPreorder = preorders.find(p => p.id === sourcePreorderId);
            if (originalPreorder) { 
                await editPreorder(sourcePreorderId, { ...originalPreorder, status: 'Delivered' }); 
            }
        }
        
        if (isPrint.current) { return salesData; }

        // Reset
        setSelectedPerson(""); setSearchPerson(""); setSelectedProducts([]); setPaymentMode("cash");
        setAmountPaid("0"); setDiscount(0); setCredit(0); setSourcePreorderId(null); 
        setGlobalPriceMode('sell'); setSalesRefNo(`SALE-${Math.floor(100000 + Math.random() * 900000)}`);
        setMessage("");
    };

    const handleSaveAndPrintSales = async () => {
        isPrint.current = true;
        const salesData = await handleSaveSales();
        if (salesData) { navigate(`/sales/view/${salesData.id}/print`); }
        isPrint.current = false;
    };

    const handleCancelProduct = (id, batchCode) => {
        setSelectedProducts(selectedProducts.filter(p => !(p.id === id && p.batchCode === batchCode)));
        handleCalculateCredit();
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold text-primary mb-6">New Sales</h2>
            {message && (
                <div className={`mb-4 p-4 rounded-lg ${message.includes('Warning') || message.includes('Insufficient') ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow">
                            <label className="text-sm font-semibold text-gray-600">Sales Reference:</label>
                            <input type="text" value={salesRefNo} readOnly className="input input-bordered w-full bg-gray-50"/>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow flex flex-col justify-between">
                            <label className="text-sm font-semibold text-gray-600 mb-2">Global Price Mode:</label>
                            <div className="flex bg-gray-200 rounded-lg p-1">
                                <button onClick={() => setGlobalPriceMode('sell')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${globalPriceMode === 'sell' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}>Retailer</button>
                                <button onClick={() => setGlobalPriceMode('wholesale')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${globalPriceMode === 'wholesale' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}>Wholesaler</button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-600">Person:</label>
                                    <div className="flex flex-col gap-2">
                                        {selectedPerson ? (
                                            <select className="select select-bordered w-full" value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)} disabled={!!sourcePreorderId}>
                                                <option value={selectedPerson}>{people.find(p => p.id === selectedPerson)?.name || "Selected Person"}</option>
                                            </select>
                                        ) : (
                                            <div className="relative w-full">
                                                <input type="text" value={searchPerson} onChange={e => setSearchPerson(e.target.value)} placeholder="Search people" className="input input-bordered w-full" disabled={!!sourcePreorderId} />
                                                {searchPerson && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {people.filter(person => person.name.toLowerCase().includes(searchPerson.toLowerCase())).map(person => (
                                                            <div key={person.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedPerson(person.id); setSearchPerson(""); }}>{person.name}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {selectedPerson && (
                                            <button type="button" onClick={() => { setSelectedPerson(""); setSearchPerson(""); }} className="btn btn-sm btn-ghost text-red-500" disabled={!!sourcePreorderId}>Change Person</button>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    className="btn btn-primary btn-sm h-10" 
                                    onClick={() => setShowPeopleModal(true)} 
                                    disabled={!!sourcePreorderId}
                                >
                                    + New
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Passed inputRef to ProductSearch */}
                    <ProductSearch 
                        searchProduct={searchProduct} 
                        setSearchProduct={setSearchProduct} 
                        products={products} 
                        handleOpenAddModal={handleOpenAddModal} 
                        inputRef={searchInputRef}
                    />

                    <SelectedProductsTable
                        selectedProducts={selectedProducts}
                        handleProductChange={handleProductChange}
                        handleSellingPriceChange={handleSellingPriceChange}
                        validateSellingPrice={validateSellingPrice}
                        handleCancelProduct={handleCancelProduct}
                    />
                </div>

                <div className="lg:w-1/4 lg:min-w-[300px] w-full">
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-6 shadow-lg lg:sticky lg:top-4">
                        <h3 className="text-2xl font-bold mb-6 text-blue-800">Payment Details</h3>
                        <div className="mb-4">
                             <label className="text-sm font-semibold text-gray-600 mb-2 block">Payment Mode:</label>
                             <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="select select-bordered w-full bg-white shadow-sm hover:border-blue-400 transition-colors">
                                <option value="cash">Cash</option>
                                <option value="online">Online</option>
                                <option value="bank">Bank</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>
                        <div className="space-y-2 mb-4 text-gray-700">
                             <div className="flex justify-between items-center"><span className="font-semibold">Subtotal:</span><span className="font-bold">Rs. {calculateSubtotal().toFixed(2)}</span></div>
                        </div>
                        <div className="mb-4">
                             <label className="text-sm font-semibold text-gray-600 mb-2 block">Discount (Rs.):</label>
                             <input type="number" value={discount} onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))} className="input input-bordered w-full bg-white shadow-sm hover:border-yellow-400 transition-colors text-lg font-semibold" placeholder="0" />
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg mb-4 shadow-md">
                             <label className="text-white text-sm font-semibold block mb-1">Total Bill:</label>
                             <div className="text-3xl font-bold text-white">Rs. {calculateTotalPayment()}</div>
                        </div>
                        <div className="mb-4">
                             <label className="text-sm font-semibold text-gray-600 mb-2 block">Amount Paid:</label>
                             <input type="number" value={amountPaid} onChange={handleAmountPaidChange} className="input input-bordered w-full bg-white shadow-sm hover:border-green-400 transition-colors text-lg font-semibold" placeholder="0" />
                        </div>
                        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-lg mb-6 shadow-md">
                             <label className="text-white text-sm font-semibold block mb-1">Credit (Due):</label>
                             <div className="text-3xl font-bold text-white">Rs. {credit.toFixed(2)}</div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button type="button" onClick={handleSaveSales} className="btn btn-primary w-full">{sourcePreorderId ? "Confirm & Save Sale" : "Save Sale"}</button>
                            <button type="button" onClick={handleSaveAndPrintSales} className="btn btn-secondary w-full">{sourcePreorderId ? "Confirm, Save & Print" : "Save & Print"}</button>
                        </div>
                    </div>
                </div>
            </div>

            {showAddModal && (
                <AddProductModal
                    product={selectedModalProduct}
                    batch={selectedBatch}
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddProduct}
                    defaultPriceMode={globalPriceMode} 
                />
            )}

            <PeopleFormModal 
                isVisible={showPeopleModal}
                onClose={() => setShowPeopleModal(false)}
                onSuccess={handlePersonAdded}
            />
        </div>
    );
};

export default NewSales;

