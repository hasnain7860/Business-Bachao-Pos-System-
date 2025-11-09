import React, { useState, useEffect, useMemo } from "react"; // 1. useMemo import karein
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../Appfullcontext";
import { v4 as uuidv4 } from "uuid";
import languageData from "../assets/languageData.json";

// Reusable Components
import PreorderHeader from "../components/Preorders/PreorderHeader.jsx";
import ProductSearch from "../components/element/ProductSearch.jsx";
import SelectedProductsTable from "../components/element/SelectedProductsTable.jsx";
import AddProductModal from "../components/element/AddProductModal.jsx";
import PreorderSummary from "../components/Preorders/PreorderSummary.jsx";

const NewPreorder = () => {
    const navigate = useNavigate();
    const { id: preorderId } = useParams();
    
    const context = useAppContext();
    const { productContext, preordersContext, language } = context;
    const { preorders, add: addPreorder, edit: editPreorder } = preordersContext;
    const { products } = productContext;

    // Main States
    const [preorderRefNo, setPreorderRefNo] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [selectedArea, setSelectedArea] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [notes, setNotes] = useState("");
    const [discount, setDiscount] = useState(0);
    
    // UI States
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedModalProduct, setSelectedModalProduct] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [message, setMessage] = useState("");
    const [searchProduct, setSearchProduct] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    
    useEffect(() => {
        if (preorderId) {
            // --- EDIT MODE ---
            const preorderToEdit = preorders.find(p => p.id === preorderId);
            if (preorderToEdit) {
                setIsEditing(true);
                setPreorderRefNo(preorderToEdit.preorderRefNo);
                setSelectedCustomer(preorderToEdit.customerId);
                setSelectedArea(preorderToEdit.areaId);
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
            setPreorderRefNo(`PRE-${Math.floor(1000 + Math.random() * 9000)}`);
            setSelectedCustomer("");
            setSelectedArea("");
            setSelectedProducts([]);
            setNotes("");
            setDiscount(0);
        }
    }, [preorderId, preorders, navigate]);

    // --- (Product handlers - No Change) ---
    const handleAddProduct = (product, batch, quantity, chosenPrice, priceType,saleUnitDetails) => {
        const existingProduct = selectedProducts.find(p => p.id === product.id && p.batchCode === batch.batchCode);
        if (!existingProduct && batch.quantity > 0) {
            setSelectedProducts(prev => [
                ...prev, {
                    ...product, batchCode: batch.batchCode, SellQuantity: quantity, discount: 0,
                    sellPrice: batch.sellPrice, wholeSalePrice: batch.wholeSalePrice,
                    newSellPrice: chosenPrice, priceUsedType: priceType,
                    purchasePrice: batch.purchasePrice, batchQuantity: batch.quantity,
                    saleUnitDetails: saleUnitDetails
                }
            ]);
        }
    };
    const handleProductChange = (id, batchCode, field, value) => {
        setSelectedProducts(currentProducts => 
            currentProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    if (field === "SellQuantity") {
                        const newQty = Math.max(0, Number(value)); 
                        const totalInBase = p.saleUnitDetails?.unitType === 'secondary' ? newQty * p.conversionFactor : newQty;
                        if (totalInBase > p.batchQuantity) return p; 
                        return { ...p, SellQuantity: totalInBase, saleUnitDetails: { ...p.saleUnitDetails, displayQuantity: newQty }};
                    }
                    return { ...p, [field]: value };
                }
                return p;
            })
        );
    };
    const handleSellingPriceChange = (id, batchCode, value) => {
        setSelectedProducts(currentProducts => {
            return currentProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    const newSellPrice = value;
                    let basePrice = p.priceUsedType === 'wholesale' ? p.wholeSalePrice : p.sellPrice;
                    if (p.saleUnitDetails?.unitType === 'secondary') { basePrice = basePrice * p.conversionFactor; }
                    let discountPercent = 100 - (Number(newSellPrice) * 100) / Number(basePrice);
                    discountPercent = Math.max(0, discountPercent);
                    return { ...p, newSellPrice: newSellPrice, discount: discountPercent };
                }
                return p;
            });
        });
    };
    const handleCancelProduct = (id, batchCode) => {
        setSelectedProducts(prev => prev.filter(p => !(p.id === id && p.batchCode === batchCode)));
    };
    const handleOpenAddModal = (product, batch) => {
        setSelectedModalProduct(product);
        setSelectedBatch(batch);
        setShowAddModal(true);
    };
    
    // <-- ======================================================= -->
    // <-- FIX #1: Calculation logic ko 'useMemo' mein move kiya -->
    // <-- ======================================================= -->
    const subtotal = useMemo(() => {
        // Calculation logic bilkul sahi hai (jo main ne pehle fix ki thi)
        return selectedProducts.reduce((total, p) => 
            total + (Number(p.newSellPrice) * Number(p.saleUnitDetails?.displayQuantity || 0))
        , 0);
    }, [selectedProducts]); // Yeh 'selectedProducts' change hone par hi calculate hoga

    const totalBill = useMemo(() => {
        return subtotal - Number(discount);
    }, [subtotal, discount]); // Yeh 'subtotal' ya 'discount' change hone par calculate hoga
    // <-- ======================================================= -->


    const handleSavePreorder = async () => {
        if (!selectedCustomer) { setMessage("Please select a customer."); return; }
        if (!selectedArea) { setMessage("Please select an area."); return; }
        if (selectedProducts.length === 0) { setMessage("Please add at least one product."); return; }
        
        const preorderData = {
            id: isEditing ? preorderId : uuidv4(),
            preorderRefNo,
            customerId: selectedCustomer,
            areaId: selectedArea,
            products: selectedProducts,
            // Ab calculation ko dobara karne ki zaroorat nahi
            subtotal: subtotal.toFixed(2),
            discount: discount,
            totalBill: totalBill.toFixed(2),
            status: 'Pending',
            preorderDate: isEditing ? preorders.find(p=>p.id === preorderId).preorderDate : new Date().toISOString(),
            notes: notes,
        };

        if (isEditing) {
            await editPreorder(preorderId, preorderData);
            alert("Preorder updated successfully!");
        } else {
            await addPreorder(preorderData);
            alert("Preorder saved successfully!");
        }
        
        navigate('/preorders');
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold text-primary mb-6">
                {isEditing 
                    ? `${languageData[language].edit_preorder || 'Edit Preorder'} (${preorderRefNo})`
                    : languageData[language].new_preorder
                }
            </h2>
            {message && <div className="alert alert-error shadow-lg mb-4"><div><span>{message}</span></div></div>}

            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left Content Area */}
                <div className="flex-1 space-y-4">
                    <PreorderHeader 
                        preorderRefNo={preorderRefNo}
                        selectedCustomer={selectedCustomer}
                        setSelectedCustomer={setSelectedCustomer}
                        selectedArea={selectedArea}
                        setSelectedArea={setSelectedArea}
                        disabled={isEditing}
                    />
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
                        handleCancelProduct={handleCancelProduct}
                    />
                </div>

                {/* Right Sidebar */}
                <div className="lg:w-1/4 lg:min-w-[300px] w-full">
                    {/* <-- ======================================================= --> */}
                    {/* <-- FIX #2: Props ko child component mein pass kiya --> */}
                    {/* <-- ======================================================= --> */}
                    <PreorderSummary
                        subtotal={subtotal} // Calculated subtotal pass karein
                        totalBill={totalBill} // Calculated total pass karein
                        discount={discount}
                        setDiscount={setDiscount}
                        notes={notes}
                        setNotes={setNotes}
                        onSave={handleSavePreorder}
                        language={language}
                        isEditing={isEditing}
                    />
                </div>
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <AddProductModal
                    product={selectedModalProduct}
                    batch={selectedBatch}
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddProduct}
                    customerId={selectedCustomer}
                />
            )}
        </div>
    );
};

export default NewPreorder;


