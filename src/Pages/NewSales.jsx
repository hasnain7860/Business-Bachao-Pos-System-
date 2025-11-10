import React, { useState, useEffect, useRef } from "react";
// 1. Import useLocation to read navigation state
import { useNavigate, useLocation } from "react-router-dom";
import SelectedProductsTable from "../components/element/SelectedProductsTable.jsx";
import ProductSearch from "../components/element/ProductSearch.jsx";

import { useAppContext } from "../Appfullcontext";
import { v4 as uuidv4 } from "uuid";
import AddProductModal from "../components/element/AddProductModal";
import { CalculateUserCredit } from "../Utils/CalculateUserCredit";

const NewSales = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Get location object
    const context = useAppContext();

    const people = context.peopleContext.people;
    
    const products = context.productContext.products;
    const editProduct = context.productContext.edit;
    // 2. Get preorder context to update its status
    const preordersContext = context.preordersContext; 

    const isPrint = useRef(false);

    const [salesRefNo, setSalesRefNo] = useState("");
    const [selectedPerson, setSelectedPerson] = useState("");
    const [searchPerson, setSearchPerson] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [searchProduct, setSearchProduct] = useState("");
    const [paymentMode, setPaymentMode] = useState("");
    const [amountPaid, setAmountPaid] = useState("0");
    const [credit, setCredit] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedModalProduct, setSelectedModalProduct] = useState(null);
    const [message, setMessage] = useState("");
    const [userCreditData, setUserCreditData] = useState(null);

    // 3. New state to track the source preorder
    const [sourcePreorderId, setSourcePreorderId] = useState(null);

    useEffect(() => {
        if (selectedPerson) {
            setUserCreditData(CalculateUserCredit(context, selectedPerson));
        }
    }, [selectedPerson]);

    // 4. New Effect to load data from Preorder
    useEffect(() => {
        // Check if we navigated here with preorderData
        if (location.state && location.state.preorderData) {
            const { preorderData } = location.state;

            // Set all the form fields
            setSourcePreorderId(preorderData.id);
            setSelectedPerson(preorderData.personId);
            setDiscount(preorderData.discount || 0);
            
            let stockWarning = false;

            // CRITICAL: Validate preorder products against *current* stock
            const validatedProducts = preorderData.products.map(p => {
                // Find the real, current product and batch
                const realProduct = products.find(prod => prod.id === p.id);
                const realBatch = realProduct?.batchCode.find(b => b.batchCode === p.batchCode);
                const currentStock = realBatch ? realBatch.quantity : 0;

                let finalQuantity = p.SellQuantity;
                
                // Check if preorder quantity is more than current stock
                if (p.SellQuantity > currentStock) {
                    finalQuantity = currentStock; // Cap quantity at current stock
                    stockWarning = true;
                }

                return {
                    ...p, // Spread all other properties from preorder product
                    SellQuantity: finalQuantity,
                    batchQuantity: currentStock // <-- CRITICAL: Update to *current* stock
                };
            }).filter(p => p.SellQuantity > 0); // Remove items that are now fully out of stock

            setSelectedProducts(validatedProducts);
            
            if (stockWarning) {
                setMessage("Preorder loaded. Warning: Some quantities were reduced to match available stock.");
            } else {
                setMessage("Preorder loaded successfully. Review and save.");
            }

            // Clear the location state to prevent re-loading on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, products, navigate]); // Depend on products to get correct stock

    useEffect(() => {
        // Only generate a new ref no if we are NOT loading from a preorder
        if (!sourcePreorderId) {
            generateSalesRefNo();
        }
    }, [sourcePreorderId]); // Run when sourcePreorderId changes

    const generateSalesRefNo = () => {
        setSalesRefNo(`SALE-${Math.floor(100000 + Math.random() * 900000)}`);
    };

    useEffect(() => {
        handleCalculateCredit();
    }, [selectedProducts, amountPaid, discount]);

    // 5. Applied functional update fix to prevent stale state
    const handleAddProduct = (product, batch, quantity, chosenPrice, priceType) => {
        setSelectedProducts(currentProducts => {
            const existingProduct = currentProducts.find(
                p => p.id === product.id && p.batchCode === batch.batchCode
            );
            if (existingProduct) {
                return currentProducts; // Product already exists
            }
            if (batch.quantity > 0) {
                return [
                    ...currentProducts,
                    {
                        ...product,
                        batchCode: batch.batchCode,
                        SellQuantity: quantity,
                        discount: 0,
                        sellPrice: batch.sellPrice, 
                        wholeSalePrice: batch.wholeSalePrice,
                        newSellPrice: chosenPrice, 
                        priceUsedType: priceType,
                        purchasePrice: batch.purchasePrice,
                        batchQuantity: batch.quantity
                    }
                ];
            }
            return currentProducts; // Batch has no quantity
        });
    };

    const handleProductChange = (id, batchCode, field, value) => {
        setSelectedProducts(currentProducts => {
            return currentProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    if (field === "SellQuantity") {
                        const maxQty = p.batchQuantity || 0;
                        const newQty = Math.max(0, Math.min(Number(value), maxQty));
                        return { ...p, [field]: newQty };
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
                const newSellPrice = value;
                const basePrice = p.priceUsedType === 'wholesale' 
                                  ? p.wholeSalePrice 
                                  : p.sellPrice;
                let discountPercent = 100 - (Number(newSellPrice) * 100) / Number(basePrice);
                discountPercent = Math.max(0, discountPercent);
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
        return Number(product.newSellPrice) < Number(product.purchasePrice);
    };

    // Calculate subtotal
    const calculateSubtotal = () => {
        // This calculation is for NewSales, using SellQuantity.
        // This is correct because our validation logic in useEffect
        // ensures SellQuantity is the base unit quantity.
        return selectedProducts.reduce((total, product) => {
            const productTotal =
                Number(product.newSellPrice) * Number(product.SellQuantity);
            return Number(total) + Number(productTotal);
        }, 0);
    };

    const calculateTotalPayment = () => {
        const subtotal = calculateSubtotal();
        const finalTotal = subtotal - Number(discount);
        return Math.max(0, finalTotal).toFixed(2);
    };

    const handleAmountPaidChange = e => {
        setAmountPaid(e.target.value);
    };

    let amountPaidcheck = amountPaid === "" ? 0 : Number(amountPaid);

    const handleCalculateCredit = () => {
        setCredit(Number(calculateTotalPayment()) - Number(amountPaidcheck));
    };

    // 6. Updated handleSaveSales
    const handleSaveSales = async () => {
        if (!selectedPerson) {
            setMessage("Please add a person first.");
            return;
        }
        if (selectedProducts.length === 0) {
            setMessage("Please add at least one product to the sale.");
            return;
        }
        if (amountPaidcheck > calculateTotalPayment()) {
            setMessage("Amount paid cannot be greater than total bill.");
            return;
        }
        if (discount > calculateSubtotal()) {
            setMessage("Discount cannot be greater than the subtotal.");
            return;
        }

        if (amountPaid === "") {
            setAmountPaid("0");
        }

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
            // Link back to the preorder
            sourcePreorderId: sourcePreorderId 
        };

        // Stock deduction loop (this is correct)
        for (let product of selectedProducts) {
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) {
                const updatedBatchCode = originalProduct.batchCode.map(
                    batch => {
                        if (batch.batchCode === product.batchCode) {
                            return {
                                ...batch,
                                quantity: batch.quantity - product.SellQuantity
                            };
                        }
                        return batch;
                    }
                );
                const updatedProduct = {
                    ...originalProduct,
                    batchCode: updatedBatchCode
                };
                await editProduct(product.id, updatedProduct);
            }
        }

        // Save the new sale
        await context.SaleContext.add(salesData);

        // --- NEW: Update Preorder Status ---
        if (sourcePreorderId) {
            const originalPreorder = preordersContext.preorders.find(p => p.id === sourcePreorderId);
            if (originalPreorder) {
                await preordersContext.edit(sourcePreorderId, { 
                    ...originalPreorder, 
                    status: 'Delivered' 
                });
            }
        }
        // --- END NEW ---

        alert("Sales saved successfully!");
        if (isPrint.current) {
            return salesData;
        }

        // Reset form
        setSelectedPerson("");
        setSearchPerson("");
        setSelectedProducts([]);
        setPaymentMode("");
        setAmountPaid("0");
        setDiscount(0);
        setCredit(0);
        setSourcePreorderId(null); // <-- NEW: Reset the preorder ID
        generateSalesRefNo();
        setMessage("");
    };

    const handleSaveAndPrintSales = async () => {
        isPrint.current = true;
        const salesData = await handleSaveSales();
        if (salesData) {
            navigate(`/sales/view/${salesData.id}/print`);
        }
        isPrint.current = false;
    };

    const handleCancelProduct = (id, batchCode) => {
        setSelectedProducts(
            selectedProducts.filter(
                p => !(p.id === id && p.batchCode === batchCode)
            )
        );
        handleCalculateCredit();
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold text-primary mb-6">New Sales</h2>
            {/* Show a clear message if loaded from preorder */}
            {message && (
                <div className={`mb-4 p-4 rounded-lg ${message.includes('Warning') ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}


            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left Content Area */}
                <div className="flex-1 space-y-4">
                    {/* Top Row with responsive grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Sales Reference */}
                        <div className="bg-white rounded-lg p-4 shadow">
                            <label className="text-sm font-semibold text-gray-600">
                                Sales Reference:
                            </label>
                            <input
                                type="text"
                                value={salesRefNo}
                                readOnly
                                className="input input-bordered w-full bg-gray-50"
                            />
                        </div>

                        {/* 7. Person selection is now disabled if loaded from preorder */}
                        <div className="bg-white rounded-lg p-4 shadow">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-600">
                                        Person:
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        {/* Selected Customer Display */}
                                        {selectedPerson && (
                                            <select
                                                className="select select-bordered w-full"
                                                value={selectedPerson}
                                                onChange={e =>
                                                    setSelectedPerson(
                                                        e.target.value
                                                    )
                                                }
                                                // Disable if it's from a preorder
                                                disabled={!!sourcePreorderId} 
                                            >
                                                <option value={selectedPerson}>
                                                    {people.find(
                                                        p =>
                                                            p.id ===
                                                            selectedPerson
                                                    )?.name ||
                                                        "Selected Person"}
                                                </option>
                                            </select>
                                        )}

                                        {/* Search Input (Will be hidden if person is selected) */}
                                        {!selectedPerson && (
                                            <div className="relative w-full">
                                                <input
                                                    type="text"
                                                    value={searchPerson}
                                                    onChange={e =>
                                                        setSearchPerson(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Search people"
                                                    className="input input-bordered w-full"
                                                    // Also disable here for safety
                                                    disabled={!!sourcePreorderId} 
                                                />
                                                {searchPerson && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {people
                                                            .filter(person =>
                                                                person.name
                                                                    .toLowerCase()
                                                                    .includes(
                                                                        searchPerson.toLowerCase()
                                                                    )
                                                            )
                                                            .map(person => (
                                                                <div
                                                                    key={
                                                                        person.id
                                                                    }
                                                                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                                                    onClick={() => {
                                                                        setSelectedPerson(
                                                                            person.id
                                                                        );
                                                                        setSearchPerson(
                                                                            ""
                                                                        );
                                                                    }}
                                                                >
                                                                    <span>
                                                                        {
                                                                            person.name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                                {/* ... search results ... */}
                                            </div>
                                        )}

                                        {/* Clear Selection Button */}
                                        {selectedPerson && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPerson("");
                                                    setSearchPerson("");
                                                }}
                                                className="btn btn-sm btn-ghost text-red-500"
                                                // Disable if it's from a preorder
                                                disabled={!!sourcePreorderId} 
                                            >
                                                Change Person
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm h-10"
                                    onClick={() => navigate("/people")}
                                    // Disable if it's from a preorder
                                    disabled={!!sourcePreorderId}
                                >
                                    + New
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product Search */}
                    <ProductSearch
                        searchProduct={searchProduct}
                        setSearchProduct={setSearchProduct}
                        products={products}
                        handleOpenAddModal={handleOpenAddModal}
                    />

                    {/* Products Table */}
                    <SelectedProductsTable
                        selectedProducts={selectedProducts}
                        handleProductChange={handleProductChange}
                        handleSellingPriceChange={handleSellingPriceChange}
                        validateSellingPrice={validateSellingPrice}
                        handleCancelProduct={handleCancelProduct}
                    />
                </div>

                {/* Right Sidebar - Payment Details */}
                <div className="lg:w-1/4 lg:min-w-[300px] w-full">
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-6 shadow-lg lg:sticky lg:top-4">
                        <h3 className="text-2xl font-bold mb-6 text-blue-800">
                            Payment Details
                        </h3>

                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">
                                Payment Mode:
                            </label>
                            <select
                                value={paymentMode}
                                onChange={e => setPaymentMode(e.target.value)}
                                className="select select-bordered w-full bg-white shadow-sm hover:border-blue-400 transition-colors"
                            >
                                <option value="">Select Payment Mode</option>
                                <option value="cash">Cash</option>
                                <option value="online">Online</option>
                                <option value="bank">Bank</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>

                        <div className="space-y-2 mb-4 text-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Subtotal:</span>
                                <span className="font-bold">
                                    Rs. {calculateSubtotal().toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Discount Input Field */}
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">
                                Discount (Rs.):
                            </label>
                            <input
                                type="number"
                                value={discount}
                                onChange={e =>
                                    setDiscount(
                                        Math.max(0, Number(e.target.value) || 0)
                                    )
                                }
                                className="input input-bordered w-full bg-white shadow-sm hover:border-yellow-400 transition-colors text-lg font-semibold"
                                placeholder="0"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg mb-4 shadow-md">
                            <label className="text-white text-sm font-semibold block mb-1">
                                Total Bill:
                            </label>
                            <div className="text-3xl font-bold text-white">
                                Rs. {calculateTotalPayment()}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">
                                Amount Paid:
                            </label>
                            <input
                                type="number"
                                value={amountPaid}
                                onChange={handleAmountPaidChange}
                                className="input input-bordered w-full bg-white shadow-sm hover:border-green-400 transition-colors text-lg font-semibold"
                                placeholder="0"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-lg mb-6 shadow-md">
                            <label className="text-white text-sm font-semibold block mb-1">
                                Credit (Due):
                            </label>
                            <div className="text-3xl font-bold text-white">
                                Rs. {credit.toFixed(2)}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={handleSaveSales}
                                className="btn btn-primary w-full"
                            >
                                {sourcePreorderId ? "Confirm & Save Sale" : "Save Sale"}
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveAndPrintSales}
                                className="btn btn-secondary w-full"
                            >
                                {sourcePreorderId ? "Confirm, Save & Print" : "Save & Print"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <AddProductModal
                    product={selectedModalProduct}
                    batch={selectedBatch}
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddProduct}
                />
            )}
        </div>
    );
};

export default NewSales;

