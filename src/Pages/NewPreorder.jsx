import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import { v4 as uuidv4 } from "uuid";

// Reusable Components
import ProductSearch from "../components/element/ProductSearch.jsx";
import SelectedProductsTable from "../components/element/SelectedProductsTable.jsx";
import AddProductModal from "../components/element/AddProductModal.jsx";

const NewPreorder = () => {
    const navigate = useNavigate();
    const { id: preorderId } = useParams(); 
    
    const context = useAppContext();
    
    // --- CRITICAL FIX: Universal Store Mapping ---
    // 1. Map .data to the variable names you use
    const preorders = context.preordersContext.data || [];
    const products = context.productContext.data || [];
    const people = context.peopleContext.data || [];
    const areas = context.areasContext.data || [];

    // 2. Destructure actions
    const { add: addPreorder, edit: editPreorder } = context.preordersContext;

    // --- States ---
    const [preorderRefNo, setPreorderRefNo] = useState("");
    const [selectedPerson, setSelectedPerson] = useState("");
    const [searchPerson, setSearchPerson] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [searchProduct, setSearchProduct] = useState("");
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState(""); 
    
    // Global Price Mode
    const [globalPriceMode, setGlobalPriceMode] = useState('sell');

    // Modal & UI States
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedModalProduct, setSelectedModalProduct] = useState(null);
    const [message, setMessage] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // Helper for Area Display
    const selectedPersonObject = useMemo(() => {
        if (!people) return null;
        return people.find(p => p.id === selectedPerson);
    }, [selectedPerson, people]);

    const selectedAreaObject = useMemo(() => {
        if (!selectedPersonObject || !areas || !selectedPersonObject.areaId) {
            return null;
        }
        return areas.find(a => a.id === selectedPersonObject.areaId);
    }, [selectedPersonObject, areas]);


    // --- Effects ---
    useEffect(() => {
        // Only run this logic if preorders have loaded
        if (preorders.length > 0) {
            if (preorderId) {
                // --- EDIT MODE ---
                const preorderToEdit = preorders.find(p => p.id === preorderId);
                if (preorderToEdit) {
                    setIsEditing(true);
                    setPreorderRefNo(preorderToEdit.preorderRefNo);
                    setSelectedPerson(preorderToEdit.personId);
                    
                    // Map old data to ensure 'enteredQty' exists
                    const mappedProducts = (preorderToEdit.products || []).map(p => ({
                        ...p,
                        enteredQty: p.enteredQty || p.SellQuantity,
                        unitMode: p.unitMode || 'base',
                        unitName: p.unitName || 'Pcs',
                        conversionRate: p.conversionRate || 1,
                        newSellPrice: p.newSellPrice || p.sellPrice 
                    }));

                    setSelectedProducts(mappedProducts);
                    setNotes(preorderToEdit.notes || "");
                    setDiscount(preorderToEdit.discount || 0);
                } else {
                    setMessage("Preorder not found. Redirecting...");
                    setTimeout(() => navigate('/preorders'), 2000);
                }
            } else {
                // --- ADD MODE ---
                setIsEditing(false);
                generatePreorderRefNo();
                setSelectedPerson("");
                setSearchPerson("");
                setSelectedProducts([]);
                setSearchProduct("");
                setDiscount(0);
                setNotes("");
                setMessage("");
                setGlobalPriceMode('sell');
            }
        } else if (!preorderId) {
             // If adding new, generate ref immediately (don't wait for preorders list)
             generatePreorderRefNo();
        }
    }, [preorderId, preorders, navigate]);

    const generatePreorderRefNo = () => {
        setPreorderRefNo(`PRE-${Math.floor(100000 + Math.random() * 900000)}`);
    };

    // --- CORE LOGIC: Handlers ---

    // 1. Handle Add Product
    const handleAddProduct = (product, batch, userEnteredQty, basePrice, priceType, unitMode, conversionRate, unitName) => {
        setSelectedProducts(currentProducts => {
            const totalPieces = unitMode === 'secondary' 
                ? Number(userEnteredQty) * Number(conversionRate)
                : Number(userEnteredQty);

            const displayPrice = unitMode === 'secondary'
                ? Number(basePrice) * Number(conversionRate)
                : Number(basePrice);

            const existingProduct = currentProducts.find(
                p => p.id === product.id && p.batchCode === batch.batchCode
            );
            
            if (existingProduct) {
                alert("Product already in list. Please remove to change unit/quantity.");
                return currentProducts;
            }
    
            return [
                ...currentProducts,
                {
                    ...product,
                    batchCode: batch.batchCode,
                    
                    // DATABASE FIELDS
                    SellQuantity: totalPieces, 
                    purchasePrice: batch.purchasePrice,

                    // UI FIELDS
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
                }
            ];
        });
    };

    // 2. Handle Quantity Change
    const handleProductChange = (id, batchCode, field, value) => {
        setSelectedProducts(currentProducts => {
            return currentProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    
                    if (field === "enteredQty") {
                        const val = Number(value);
                        const conv = p.conversionRate || 1;
                        
                        const requiredPieces = val * conv;

                        return { 
                            ...p, 
                            enteredQty: val,
                            SellQuantity: requiredPieces 
                        };
                    }
                    return { ...p, [field]: value };
                }
                return p;
            });
        });
    };
    
    // 3. Handle Price Change
    const handleSellingPriceChange = (id, batchCode, value) => {
        setSelectedProducts(currentProducts => {
            return currentProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    const newSellPrice = Number(value);
                    
                    const type = p.priceUsedType || 'sell';
                    let baseStandardPrice = type === 'wholesale' ? Number(p.wholeSalePrice) : Number(p.sellPrice);
                    
                    let standardDisplayPrice = p.unitMode === 'secondary' 
                        ? baseStandardPrice * (Number(p.conversionRate) || 1)
                        : baseStandardPrice;

                    let discountPercent = 0;
                    if (standardDisplayPrice > 0) {
                        discountPercent = ((standardDisplayPrice - newSellPrice) / standardDisplayPrice) * 100;
                    }
                    
                    if (discountPercent < 0) {
                        discountPercent = 0;
                    }

                    return { 
                        ...p, 
                        newSellPrice: newSellPrice,
                        discount: discountPercent.toFixed(2) 
                    }; 
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

    // Cost Validation
    const validateSellingPrice = product => {
        const costPerPiece = Number(product.purchasePrice);
        const totalCostForUnit = product.unitMode === 'secondary' 
            ? costPerPiece * (product.conversionRate || 1) 
            : costPerPiece;

        return Number(product.newSellPrice) < totalCostForUnit;
    };

    const handleCancelProduct = (id, batchCode) => {
        setSelectedProducts(
            selectedProducts.filter(
                p => !(p.id === id && p.batchCode === batchCode)
            )
        );
    };

    // --- Calculations ---
    
    const calculateSubtotal = useMemo(() => {
        return selectedProducts.reduce((total, product) => {
            const productTotal = Number(product.newSellPrice) * Number(product.enteredQty);
            return Number(total) + Number(productTotal);
        }, 0);
    }, [selectedProducts]);

    const calculateTotalPayment = useMemo(() => {
        const finalTotal = calculateSubtotal - Number(discount);
        return Math.max(0, finalTotal).toFixed(2);
    }, [calculateSubtotal, discount]);


    // --- Save Function ---
    const handleSavePreorder = async () => {
        if (!selectedPerson) {
            setMessage("Please add a person first.");
            return;
        }
        if (selectedProducts.length === 0) {
            setMessage("Please add at least one product.");
            return;
        }
        if (Number(discount) > calculateSubtotal) {
            setMessage("Discount cannot be greater than the subtotal.");
            return;
        }

        const personObject = people.find(p => p.id === selectedPerson);

        const preorderData = {
            id: isEditing ? preorderId : uuidv4(),
            preorderRefNo,
            personId: selectedPerson,
            areaId: personObject?.areaId || null, 
            products: selectedProducts, 
            notes: notes,
            subtotal: calculateSubtotal.toFixed(2),
            discount: discount,
            totalBill: calculateTotalPayment,
            // Keep existing status if editing, else default to Pending
            status: isEditing ? (preorders.find(p=>p.id === preorderId)?.status || 'Pending') : 'Pending', 
            preorderDate: isEditing ? (preorders.find(p=>p.id === preorderId)?.preorderDate || new Date().toISOString()) : new Date().toISOString()
        };

        if (isEditing) {
            await editPreorder(preorderId, preorderData);
        } else {
            await addPreorder(preorderData);
        }

        navigate('/preorders');
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold text-primary mb-6">
                {isEditing ? `Edit Preorder (${preorderRefNo})` : "New Preorder"}
            </h2>

            {message && <div className="text-red-500 mb-4">{message}</div>}

            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left Content */}
                <div className="flex-1 space-y-4">
                    {/* Top Row */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow">
                            <label className="text-sm font-semibold text-gray-600">
                                Ref:
                            </label>
                            <input type="text" value={preorderRefNo} readOnly className="input input-bordered w-full bg-gray-50" />
                        </div>

                         {/* Global Price Mode Selector */}
                         <div className="bg-white rounded-lg p-4 shadow flex flex-col justify-between">
                            <label className="text-sm font-semibold text-gray-600 mb-2">
                                Global Price Mode:
                            </label>
                            <div className="flex bg-gray-200 rounded-lg p-1">
                                <button
                                    onClick={() => setGlobalPriceMode('sell')}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                        globalPriceMode === 'sell' 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Retailer
                                </button>
                                <button
                                    onClick={() => setGlobalPriceMode('wholesale')}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                        globalPriceMode === 'wholesale' 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Wholesaler
                                </button>
                            </div>
                        </div>

                        {/* Person Selection */}
                        <div className="bg-white rounded-lg p-4 shadow">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-600">Person:</label>
                                    <div className="flex flex-col gap-2">
                                        {selectedPerson && (
                                            <select
                                                className="select select-bordered w-full"
                                                value={selectedPerson}
                                                onChange={e => setSelectedPerson(e.target.value)}
                                                disabled={isEditing} 
                                            >
                                                <option value={selectedPerson}>
                                                    {selectedPersonObject?.name || "Selected Person"}
                                                    {selectedAreaObject && ` (${selectedAreaObject.name})`}
                                                </option>
                                            </select>
                                        )}
                                        
                                        {!selectedPerson && !isEditing && (
                                            <div className="relative w-full">
                                                <input
                                                    type="text"
                                                    value={searchPerson}
                                                    onChange={e => setSearchPerson(e.target.value)}
                                                    placeholder="Search people"
                                                    className="input input-bordered w-full"
                                                />
                                                {searchPerson && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
                                                        {people.filter(person =>
                                                                person.name.toLowerCase().includes(searchPerson.toLowerCase())
                                                            ).length > 0 ? (
                                                                people.filter(person =>
                                                                    person.name.toLowerCase().includes(searchPerson.toLowerCase())
                                                                ).map(person => (
                                                                    <div 
                                                                        key={person.id} 
                                                                        className="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer text-lg font-medium text-gray-800" 
                                                                        onClick={() => { setSelectedPerson(person.id); setSearchPerson(""); }}
                                                                    >
                                                                        <span>{person.name}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="p-4 text-center text-gray-500 text-base">
                                                                    No person found
                                                                </div>
                                                            )}
                                                    </div>
                                                )}

                                            </div>
                                        )}
                                        {selectedPerson && !isEditing && (
                                            <button type="button" onClick={() => { setSelectedPerson(""); setSearchPerson(""); }} className="btn btn-sm btn-ghost text-red-500">
                                                Change Person
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button type="button" className="btn btn-primary btn-sm h-10" onClick={() => navigate("/people")}>+ New</button>
                            </div>
                        </div>
                    </div>

                    <ProductSearch
                        searchProduct={searchProduct}
                        setSearchProduct={setSearchProduct}
                        products={products}
                        handleOpenAddModal={handleOpenAddModal}
                    />

                    <SelectedProductsTable
                        selectedProducts={selectedProducts}
                        handleProductChange={handleProductChange}
                        handleSellingPriceChange={handleSellingPriceChange}
                        validateSellingPrice={validateSellingPrice}
                        handleCancelProduct={handleCancelProduct}
                    />
                </div>

                {/* Right Sidebar */}
                <div className="lg:w-1/4 lg:min-w-[300px] w-full">
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-6 shadow-lg lg:sticky lg:top-4">
                        <h3 className="text-2xl font-bold mb-6 text-blue-800">
                            Preorder Summary
                        </h3>

                        <div className="space-y-2 mb-4 text-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Subtotal:</span>
                                <span className="font-bold">Rs. {calculateSubtotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">Discount (Rs.):</label>
                            <input
                                type="number"
                                value={discount}
                                onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                                className="input input-bordered w-full bg-white shadow-sm hover:border-yellow-400 transition-colors text-lg font-semibold"
                                placeholder="0"
                            />
                        </div>

                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg mb-4 shadow-md">
                            <label className="text-white text-sm font-semibold block mb-1">Total Bill:</label>
                            <div className="text-3xl font-bold text-white">Rs. {calculateTotalPayment}</div>
                        </div>

                        <div className="mb-6">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">Notes:</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="textarea textarea-bordered w-full bg-white shadow-sm"
                                placeholder="Add any notes..."
                                rows={3}
                            ></textarea>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button type="button" onClick={handleSavePreorder} className="btn btn-primary w-full">
                                {isEditing ? "Update Preorder" : "Save Preorder"}
                            </button>
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
        </div>
    );
};

export default NewPreorder;

