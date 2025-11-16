import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import { v4 as uuidv4 } from "uuid";
import languageData from "../assets/languageData.json";

// Reusable Components
import ProductSearch from "../components/element/ProductSearch.jsx";
import SelectedProductsTable from "../components/element/SelectedProductsTable.jsx";
import AddProductModal from "../components/element/AddProductModal.jsx";

const NewPreorder = () => {
    const navigate = useNavigate();
    const { id: preorderId } = useParams(); // For Edit Mode
    
    const context = useAppContext();
    const { 
        productContext, 
        preordersContext, 
        peopleContext, 
        areasContext, // --- 1. Added areasContext ---
        language 
    } = context;
    
    const { preorders, add: addPreorder, edit: editPreorder } = preordersContext;
    const { products } = productContext;
    const { people } = peopleContext;
    const { areas } = areasContext; // --- 1. Get areas array ---

    // --- States ---
    const [preorderRefNo, setPreorderRefNo] = useState("");
    const [selectedPerson, setSelectedPerson] = useState("");
    const [searchPerson, setSearchPerson] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [searchProduct, setSearchProduct] = useState("");
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState(""); // Added notes field
    
    // Modal & UI States
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedModalProduct, setSelectedModalProduct] = useState(null);
    const [message, setMessage] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // --- 2. Use useMemo to find the person and area objects ---
    const selectedPersonObject = useMemo(() => {
        return people.find(p => p.id === selectedPerson);
    }, [selectedPerson, people]);

    const selectedAreaObject = useMemo(() => {
        // Guard against missing areas or person
        if (!selectedPersonObject || !areas || !selectedPersonObject.areaId) {
            return null;
        }
        return areas.find(a => a.id === selectedPersonObject.areaId);
    }, [selectedPersonObject, areas]);


    // --- Effects ---

    // Effect for setting up Add or Edit mode
    useEffect(() => {
        if (preorderId) {
            // --- EDIT MODE ---
            const preorderToEdit = preorders.find(p => p.id === preorderId);
            if (preorderToEdit) {
                setIsEditing(true);
                setPreorderRefNo(preorderToEdit.preorderRefNo);
                setSelectedPerson(preorderToEdit.personId); // Use personId
                setSelectedProducts(preorderToEdit.products);
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
            // Reset all fields
            setSelectedPerson("");
            setSearchPerson("");
            setSelectedProducts([]);
            setSearchProduct("");
            setDiscount(0);
            setNotes("");
            setMessage("");
        }
    }, [preorderId, preorders, navigate]);

    const generatePreorderRefNo = () => {
        setPreorderRefNo(`PRE-${Math.floor(100000 + Math.random() * 900000)}`);
    };

    // --- Product Handlers ---

    // ==================================================================
    // --- FIX IS HERE ---
    // ==================================================================
    // The modal passes 5 arguments. The 6th (saleUnitDetails) is undefined.
    // We must manually create the 'saleUnitDetails' object here.
    const handleAddProduct = (product, batch, quantity, chosenPrice, priceType) => {
        setSelectedProducts(currentProducts => {
            const existingProduct = currentProducts.find(
                p => p.id === product.id && p.batchCode === batch.batchCode
            );
            
            if (existingProduct) {
                return currentProducts; // Product already in list
            }
    
            // --- THIS IS THE FIX ---
            // The modal doesn't know about 'saleUnitDetails'.
            // We create it here, assuming the modal always adds the 'base' unit.
            const newSaleUnitDetails = {
                unitType: 'base',
                displayQuantity: quantity // The quantity from the modal
            };
            // --- END OF FIX ---

            // Add the new product with the correctly constructed object
            return [
                ...currentProducts,
                {
                    ...product,
                    batchCode: batch.batchCode,
                    // SellQuantity is the 'base' unit quantity
                    SellQuantity: quantity, 
                    discount: 0,
                    sellPrice: batch.sellPrice, 
                    wholeSalePrice: batch.wholeSalePrice,
                    newSellPrice: chosenPrice, 
                    priceUsedType: priceType,
                    purchasePrice: batch.purchasePrice,
                    // We save batchQuantity for reference, but don't validate against it
                    batchQuantity: batch.quantity,
                    // Assign the newly created object
                    saleUnitDetails: newSaleUnitDetails 
                }
            ];
        });
    };
    // ==================================================================
    // --- End of Fix ---
    // ==================================================================

    // This is from your *old* NewPreorder.jsx (This logic is correct)
    const handleProductChange = (id, batchCode, field, value) => {
        setSelectedProducts(currentProducts => {
            return currentProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    if (field === "SellQuantity") {
                        const newQty = Math.max(0, Number(value));
                        // This logic handles base/secondary units
                        const totalInBase = p.saleUnitDetails?.unitType === 'secondary' 
                                            ? newQty * p.conversionFactor 
                                            : newQty;
                        
                        // NO stock check here
                        
                        return { ...p, SellQuantity: totalInBase, saleUnitDetails: { ...p.saleUnitDetails, displayQuantity: newQty }};
                    }
                    return { ...p, [field]: value };
                }
                return p;
            });
        });
    };
    
    // This is from your *old* NewPreorder.jsx (This logic is correct)
    const handleSellingPriceChange = (id, batchCode, value) => {
        setSelectedProducts(currentProducts => {
            return currentProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    const newSellPrice = value;

                    let basePrice = p.priceUsedType === 'wholesale' ? p.wholeSalePrice : p.sellPrice;
                    // Adjust base price if secondary unit is used
                    if (p.saleUnitDetails?.unitType === 'secondary') { 
                        basePrice = basePrice * p.conversionFactor; 
                    }

                    let discountPercent = 100 - (Number(newSellPrice) * 100) / Number(basePrice);
                    discountPercent = Math.max(0, discountPercent);

                    return { ...p, newSellPrice: newSellPrice, discount: discountPercent.toFixed(2) };
                }
                return p;
            });
        });
    };

    // This is from NewSales.jsx
    const handleOpenAddModal = (product, batch) => {
        setSelectedModalProduct(product);
        setSelectedBatch(batch);
        setShowAddModal(true);
    };

    // This is from NewSales.jsx
    const validateSellingPrice = product => {
        // We warn if sell price is below purchase price, but we don't block it
        return Number(product.newSellPrice) < Number(product.purchasePrice);
    };

    // This is from NewSales.jsx
    const handleCancelProduct = (id, batchCode) => {
        setSelectedProducts(
            selectedProducts.filter(
                p => !(p.id === id && p.batchCode === batchCode)
            )
        );
    };


    // --- Calculation Functions (Cloned from NewSales/OldPreorder) ---
    
    // This calculation is from your *old* NewPreorder.jsx (using saleUnitDetails.displayQuantity)
    // This will now work correctly because handleAddProduct creates the 'saleUnitDetails' object.
    const calculateSubtotal = useMemo(() => {
        return selectedProducts.reduce((total, product) => {
            const productTotal =
                Number(product.newSellPrice) * Number(product.saleUnitDetails?.displayQuantity || 0);
            return Number(total) + Number(productTotal);
        }, 0);
    }, [selectedProducts]);


    // This is from NewSales.jsx
    const calculateTotalPayment = useMemo(() => {
        const subtotal = calculateSubtotal;
        const finalTotal = subtotal - Number(discount);
        return Math.max(0, finalTotal).toFixed(2); // Ensure total is not negative
    }, [calculateSubtotal, discount]);


    // --- Save Function ---
    const handleSavePreorder = async () => {
        if (!selectedPerson) {
            setMessage("Please add a person first.");
            return;
        }
        if (selectedProducts.length === 0) {
            setMessage("Please add at least one product to the preorder.");
            return;
        }
        if (discount > calculateSubtotal) {
            setMessage("Discount cannot be greater than the subtotal.");
            return;
        }

        // --- 4. Get personObject to add areaId ---
        const personObject = people.find(p => p.id === selectedPerson);

        const preorderData = {
            id: isEditing ? preorderId : uuidv4(),
            preorderRefNo,
            personId: selectedPerson,
            areaId: personObject?.areaId || null, // --- 4. ADDED THIS LINE ---
            products: selectedProducts,
            notes: notes,
            subtotal: calculateSubtotal.toFixed(2),
            discount: discount,
            totalBill: calculateTotalPayment,
            status: isEditing ? preorders.find(p=>p.id === preorderId).status : 'Pending', // Keep old status if editing, else 'Pending'
            preorderDate: isEditing ? preorders.find(p=>p.id === preorderId).preorderDate : new Date().toISOString()
        };

        // --- NO STOCK DEDUCTION ---
        // The loop for editing product stock is intentionally removed.
        // ---

        if (isEditing) {
            await editPreorder(preorderId, preorderData);
            alert("Preorder updated successfully!");
        } else {
            await addPreorder(preorderData);
            alert("Preorder saved successfully!");
        }

        navigate('/preorders'); // Redirect to the list
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold text-primary mb-6">
                {isEditing ? `Edit Preorder (${preorderRefNo})` : "New Preorder"}
            </h2>

            {message && <div className="text-red-500 mb-4">{message}</div>}

            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left Content Area (Same as NewSales) */}
                <div className="flex-1 space-y-4">
                    {/* Top Row (Same as NewSales) */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Preorder Reference */}
                        <div className="bg-white rounded-lg p-4 shadow">
                            <label className="text-sm font-semibold text-gray-600">
                                Preorder Reference:
                            </label>
                            <input
                                type="text"
                                value={preorderRefNo}
                                readOnly
                                className="input input-bordered w-full bg-gray-50"
                            />
                        </div>

                        {/* Person Selection (Same as NewSales) */}
                        <div className="bg-white rounded-lg p-4 shadow">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-600">
                                        Person:
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        {/* --- 3. MODIFIED this section to show area name --- */}
                                        {selectedPerson && (
                                            <select
                                                className="select select-bordered w-full"
                                                value={selectedPerson}
                                                onChange={e => setSelectedPerson(e.target.value)}
                                                disabled={isEditing} // Can't change person when editing
                                            >
                                                <option value={selectedPerson}>
                                                    {selectedPersonObject?.name || "Selected Person"}
                                                    {selectedAreaObject && ` (${selectedAreaObject.name})`}
                                                </option>
                                            </select>
                                        )}
                                        {/* --- End of modification --- */}
                                        
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
                                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {people
                                                            .filter(person =>
                                                                person.name
                                                                    .toLowerCase()
                                                                    .includes(searchPerson.toLowerCase())
                                                            )
                                                            .map(person => (
                                                                <div
                                                                    key={person.id}
                                                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                                                    onClick={() => {
                                                                        setSelectedPerson(person.id);
                                                                        setSearchPerson("");
                                                                    }}
                                                                >
                                                                    {/* You could also show area here if you want */}
                                                                    <span>{person.name}</span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {selectedPerson && !isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPerson("");
                                                    setSearchPerson("");
                                                }}
                                                className="btn btn-sm btn-ghost text-red-500"
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
                                >
                                    + New
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product Search (Same as NewSales) */}
                    <ProductSearch
                        searchProduct={searchProduct}
                        setSearchProduct={setSearchProduct}
                        products={products}
                        handleOpenAddModal={handleOpenAddModal}
                        isPreorder={true} // Pass this prop
                    />

                    {/* Products Table (Same as NewSales, with validateSellingPrice) */}
                    <SelectedProductsTable
                        selectedProducts={selectedProducts}
                        handleProductChange={handleProductChange}
                        handleSellingPriceChange={handleSellingPriceChange}
                        validateSellingPrice={validateSellingPrice} // Passing the function
                        handleCancelProduct={handleCancelProduct}
                        isPreorder={true} // Pass this prop
                    />
                </div>

                {/* Right Sidebar - Summary (Modified from NewSales) */}
                <div className="lg:w-1/4 lg:min-w-[300px] w-full">
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-6 shadow-lg lg:sticky lg:top-4">
                        <h3 className="text-2xl font-bold mb-6 text-blue-800">
                            Preorder Summary
                        </h3>

                        <div className="space-y-2 mb-4 text-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Subtotal:</span>
                                <span className="font-bold">
                                    Rs. {calculateSubtotal.toFixed(2)}
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

                        {/* Total Bill */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg mb-4 shadow-md">
                            <label className="text-white text-sm font-semibold block mb-1">
                                Total Bill:
                            </label>
                            <div className="text-3xl font-bold text-white">
                                Rs. {calculateTotalPayment}
                            </div>
                        </div>

                        {/* --- REMOVED Payment Mode, Amount Paid, Credit --- */}
                        
                        {/* --- ADDED Notes Field --- */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">
                                Notes:
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="textarea textarea-bordered w-full bg-white shadow-sm"
                                placeholder="Add any notes..."
                                rows={3}
                            ></textarea>
                        </div>


                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={handleSavePreorder}
                                className="btn btn-primary w-full"
                            >
                                {isEditing ? "Update Preorder" : "Save Preorder"}
                            </button>
                            {/* --- REMOVED Save & Print --- */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Product Modal (Same as NewSales) */}
            {/* The 'onAdd' prop is now correctly handled by the fixed 'handleAddProduct' */}
            {showAddModal && (
                <AddProductModal
                    product={selectedModalProduct}
                    batch={selectedBatch}
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddProduct}
                    isPreorder={true} // Pass this prop
                    personId={selectedPerson} // Pass personId
                />
            )}
        </div>
    );
};

export default NewPreorder;

