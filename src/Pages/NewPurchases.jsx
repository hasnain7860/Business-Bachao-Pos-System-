import React, { useState, useEffect } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';
import { useAppContext } from '../Appfullcontext';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams } from "react-router-dom";

// Components
import ProductSearch from "../components/element/ProductSearch.jsx";
import AddProductModal from '../components/purchase/AddProductModal.jsx';
import PurchaseTable from '../components/purchase/PurchaseTable.jsx';
import PurchaseSummary from '../components/purchase/PurchaseSummary.jsx';
import PeopleFormModal from "../components/people/PeopleFormModal"; 

const NewPurchases = () => {
    const { id } = useParams(); 
    const context = useAppContext();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // Safe Data Access
    const peoples = context.peopleContext.data || [];
    const products = context.productContext.data || [];
    const units = context.unitContext.data || [];
    const purchases = context.purchaseContext.data || [];
    
    const updateProduct = context.productContext.edit;
    const addPurchase = context.purchaseContext.add;
    const updatePurchase = context.purchaseContext.edit;

    // States
    const [selectedPeople, setselectedPeople] = useState('');
    const [searchPerson, setSearchPerson] = useState(""); 
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [totalPayment, setTotalPayment] = useState(0);
    const [credit, setCredit] = useState(0);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProductData, setModalProductData] = useState({ product: null, batch: null });
    
    // People Modal State
    const [showPeopleModal, setShowPeopleModal] = useState(false);

    // --- LOAD DATA FOR EDIT ---
    useEffect(() => {
        if (isEditMode && purchases.length > 0 && units.length > 0) {
            const purchaseToEdit = purchases.find(p => String(p.id) === String(id));
            if (purchaseToEdit) {
                setselectedPeople(purchaseToEdit.personId || '');
                setCurrentDate(purchaseToEdit.date || new Date().toISOString().split('T')[0]);
                setPaymentMode(purchaseToEdit.paymentMode || 'Cash');
                setTotalPayment(purchaseToEdit.totalPayment || 0);
                
                const hydratedProducts = (purchaseToEdit.products || []).map(p => {
                    const bUnit = units.find(u => u.id === p.baseUnitId);
                    const sUnit = units.find(u => u.id === p.secondaryUnitId);

                    return {
                        ...p,
                        baseUnitName: bUnit ? bUnit.name : (p.baseUnitName || "Pcs"),
                        secUnitName: sUnit ? sUnit.name : (p.secUnitName || "Ctn")
                    };
                });

                setSelectedProducts(hydratedProducts);
            }
        }
    }, [id, purchases, isEditMode, units]);

    // --- CALCULATIONS ---
    const calculateTotalBill = () => selectedProducts.reduce((total, p) => total + Number(p.total || 0), 0);

    useEffect(() => {
        const total = calculateTotalBill();
        const pay = totalPayment === '' ? 0 : parseFloat(totalPayment);
        setCredit(total - pay);
    }, [selectedProducts, totalPayment]);

    // --- HANDLERS ---
    
    const handlePersonAdded = (newPerson) => {
        setselectedPeople(newPerson.id); 
        setSearchPerson("");
        setShowPeopleModal(false);
    };

    const handleOpenAddModal = (product, batch = null) => {
        const exists = selectedProducts.find(p => p.id === product.id);
        if (exists) { alert('Product already in table. Edit it there.'); return; }

        setModalProductData({ product, batch });
        setIsModalOpen(true);
        setProductSearch("");
    };

    const handleConfirmAdd = (newProductRow) => {
        newProductRow.purchaseRefNo = `PURCHASE-${Math.floor(100000 + Math.random() * 900000)}`;
        setSelectedProducts([newProductRow, ...selectedProducts]);
        setIsModalOpen(false);
    };

    const handleUpdateTableProduct = (index, field, value) => {
        const newProducts = [...selectedProducts];
        const p = newProducts[index];

        if (field === 'enteredQty') p.enteredQty = parseFloat(value) || 0;
        else if (field === 'enteredPurchasePrice') p.enteredPurchasePrice = parseFloat(value) || 0;
        
        else if (field === 'unitMode') {
            p.unitMode = value;
            if (value === 'secondary') {
                p.enteredPurchasePrice = p.purchasePrice * p.conversionRate;
                p.transactionUnitId = p.secondaryUnitId || null;
            } else {
                p.enteredPurchasePrice = p.purchasePrice;
                p.transactionUnitId = p.baseUnitId || null;
            }
        } 
        else p[field] = value;

        p.total = (p.enteredQty || 0) * (p.enteredPurchasePrice || 0);
        
        if (p.unitMode === 'secondary') {
            p.quantity = p.enteredQty * p.conversionRate;
            p.purchasePrice = p.enteredPurchasePrice / p.conversionRate;
        } else {
            p.quantity = p.enteredQty;
            p.purchasePrice = p.enteredPurchasePrice;
        }

        setSelectedProducts(newProducts);
    };

    // ==========================================
    //  THE FIX: ROBUST SAVE LOGIC
    // ==========================================
    const handleSave = async () => {
        if (!selectedPeople) return alert("Select Supplier");
        if (selectedProducts.length === 0) return alert("Add Products");

        const autoInitDate = new Date(0).toISOString();

        // 1. CALCULATE NET IMPACT (THE DELTA SYSTEM)
        // We create a map of changes: { "productId|batchCode": netQuantityChange }
        const stockAdjustments = {};

        const addAdjustment = (prodId, batchCode, qty) => {
            const key = `${prodId}|${batchCode}`;
            stockAdjustments[key] = (stockAdjustments[key] || 0) + Number(qty);
        };

        // A. If Edit Mode: Subtract the OLD quantities (Reversing old purchase effect)
        if (isEditMode) {
            const oldPurchase = purchases.find(p => String(p.id) === String(id));
            if (oldPurchase && oldPurchase.products) {
                oldPurchase.products.forEach(p => {
                    // We treat this as a negative change (removing the old record)
                    addAdjustment(p.id, p.batchCode, -Number(p.quantity || 0));
                });
            }
        }

        // B. Add the NEW quantities (Applying new purchase effect)
        selectedProducts.forEach(p => {
            // We treat this as a positive change
            addAdjustment(p.id, p.batchCode, Number(p.quantity || 0));
        });

        // 2. PREDICTIVE VALIDATION (Prevent Negative Stock)
        // Before we touch the DB, we verify if the math works.
        for (const [key, changeAmount] of Object.entries(stockAdjustments)) {
            if (changeAmount === 0) continue; // No net change

            const [prodId, batchCode] = key.split('|');
            const dbProduct = products.find(p => p.id === prodId);

            if (!dbProduct) {
                alert(`Error: Product ID ${prodId} not found in database.`);
                return;
            }

            const dbBatch = dbProduct.batchCode?.find(b => b.batchCode === batchCode);
            const currentStock = Number(dbBatch?.quantity || 0);

            // THE SYSTEM CHECK:
            // Current Stock + (New - Old) must be >= 0
            const predictedStock = currentStock + changeAmount;

            if (predictedStock < 0) {
                alert(
                    `⛔ OPERATION BLOCKED: Stock Protection System\n\n` +
                    `Product: "${dbProduct.name}"\n` +
                    `Batch: ${batchCode}\n` +
                    `Current Stock: ${currentStock}\n` +
                    `Net Change Requested: ${changeAmount}\n` +
                    `Resulting Stock: ${predictedStock} (NEGATIVE)\n\n` +
                    `REASON: You have already SOLD these items.\n` +
                    `You cannot reduce a purchase quantity below what has already been consumed.`
                );
                return; // STOP EXECUTION HERE
            }
        }

        // 3. EXECUTION: Apply the Deltas to Database
        // We iterate by Product ID to minimize database writes
        const uniqueProdIds = [...new Set(Object.keys(stockAdjustments).map(k => k.split('|')[0]))];

        for (const prodId of uniqueProdIds) {
            const dbProduct = products.find(p => p.id === prodId);
            if (!dbProduct) continue;

            let batches = dbProduct.batchCode ? [...dbProduct.batchCode] : [];
            let isModified = false;

            // Apply all adjustments for this product
            for (const [key, changeAmount] of Object.entries(stockAdjustments)) {
                const [pId, bCode] = key.split('|');
                if (pId !== prodId) continue;
                if (changeAmount === 0) continue;

                const batchIndex = batches.findIndex(b => b.batchCode === bCode);

                if (batchIndex !== -1) {
                    // Update EXISTING batch
                    batches[batchIndex].quantity = Number(batches[batchIndex].quantity || 0) + changeAmount;
                    
                    // If this adjustment came from a NEW/EDITED entry in the table, update prices too
                    const tableEntry = selectedProducts.find(p => p.id === prodId && p.batchCode === bCode);
                    if (tableEntry) {
                        batches[batchIndex].purchasePrice = Number(tableEntry.purchasePrice);
                        batches[batchIndex].sellPrice = Number(tableEntry.sellPrice);
                        batches[batchIndex].wholeSalePrice = Number(tableEntry.wholeSalePrice);
                        batches[batchIndex].retailPrice = Number(tableEntry.retailPrice);
                        batches[batchIndex].expirationDate = tableEntry.expirationDate || batches[batchIndex].expirationDate;
                    }
                    isModified = true;
                } else if (changeAmount > 0) {
                    // Create NEW batch (Only if adding stock, usually happens on New Purchase)
                    const tableEntry = selectedProducts.find(p => p.id === prodId && p.batchCode === bCode);
                    if (tableEntry) {
                        batches.push({
                            batchCode: bCode,
                            expirationDate: tableEntry.expirationDate || "",
                            purchasePrice: Number(tableEntry.purchasePrice || 0),
                            sellPrice: Number(tableEntry.sellPrice || 0),
                            wholeSalePrice: Number(tableEntry.wholeSalePrice || 0),
                            retailPrice: Number(tableEntry.retailPrice || 0),
                            quantity: changeAmount, // Initial quantity is the adjustment
                            openingStock: 0,
                            openingStockDate: autoInitDate,
                            damageQuantity: 0
                        });
                        isModified = true;
                    }
                }
            }

            if (isModified) {
                await updateProduct(prodId, { ...dbProduct, batchCode: batches });
            }
        }

        // 4. SAVE PURCHASE RECORD
        const cleanedProducts = selectedProducts.map(p => ({
            id: p.id,
            name: p.name,
            companyId: p.companyId || null,
            baseUnitId: p.baseUnitId || null,
            secondaryUnitId: p.secondaryUnitId || null,
            transactionUnitId: p.transactionUnitId || p.baseUnitId || null,
            hasSecondary: Boolean(p.hasSecondary),
            conversionRate: Number(p.conversionRate) || 1,
            unitMode: p.unitMode || 'base',
            enteredQty: Number(p.enteredQty || 0),
            enteredPurchasePrice: Number(p.enteredPurchasePrice || 0),
            quantity: Number(p.quantity || 0),
            purchasePrice: Number(p.purchasePrice || 0),
            batchCode: p.batchCode || "",
            sellPrice: Number(p.sellPrice || 0),
            wholeSalePrice: Number(p.wholeSalePrice || 0),
            retailPrice: Number(p.retailPrice || 0),
            expirationDate: p.expirationDate || "",
            total: Number(p.total || 0)
        }));

        const purchaseData = {
            id: isEditMode ? id : uuidv4(),
            purchaseRefNo: isEditMode 
                ? (purchases.find(p=>String(p.id)===String(id))?.purchaseRefNo || "ERR-REF") 
                : `PURCHASE-${Math.floor(100000 + Math.random() * 900000)}`,
            personId: selectedPeople,
            date: currentDate,
            paymentMode,
            products: cleanedProducts, 
            totalPayment: totalPayment === '' ? 0 : Number(totalPayment),
            credit: Number(credit || 0),
            totalBill: Number(calculateTotalBill() || 0),
        };

        try {
            if (isEditMode) {
                await updatePurchase(id, purchaseData);
                alert("Purchase Updated Successfully!");
            } else {
                await addPurchase(purchaseData);
                alert("Purchase Added Successfully!");
            }
            navigate(-1);
        } catch (error) {
            console.error("Firebase Save Error:", error);
            alert("Error saving purchase. Check console.");
        }
    };

    return (
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 relative">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">
                {isEditMode ? 'Edit Purchase' : 'New Purchase Entry'}
            </h2>
            
            <AddProductModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmAdd}
                product={modalProductData.product}
                initialBatch={modalProductData.batch}
                units={units}
            />

            <PeopleFormModal 
                isVisible={showPeopleModal}
                onClose={() => setShowPeopleModal(false)}
                onSuccess={handlePersonAdded}
            />

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        
                        <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                            <label className="text-xs sm:text-sm font-semibold text-gray-600">Supplier *:</label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    {selectedPeople ? (
                                        <div className="flex flex-col gap-2">
                                             <select className="select select-bordered w-full text-xs sm:text-sm bg-white" value={selectedPeople} onChange={e => setselectedPeople(e.target.value)}>
                                                <option value={selectedPeople}>{peoples.find(p => p.id === selectedPeople)?.name || "Selected Person"}</option>
                                            </select>
                                            <button 
                                                type="button" 
                                                onClick={() => { setselectedPeople(""); setSearchPerson(""); }} 
                                                className="btn btn-xs sm:btn-sm btn-ghost text-red-500 self-start"
                                            >
                                                Change Supplier
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative w-full">
                                            <input 
                                                type="text" 
                                                value={searchPerson} 
                                                onChange={e => setSearchPerson(e.target.value)} 
                                                placeholder="Search Supplier" 
                                                className="input input-bordered w-full text-xs sm:text-sm" 
                                            />
                                            {searchPerson && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {peoples.filter(p => p.name.toLowerCase().includes(searchPerson.toLowerCase())).map(person => (
                                                        <div key={person.id} className="p-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => { setselectedPeople(person.id); setSearchPerson(""); }}>
                                                            {person.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    className="btn btn-primary btn-sm h-10" 
                                    onClick={() => setShowPeopleModal(true)}
                                >
                                    <AiOutlinePlus /> New
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow">
                            <label className="text-sm font-semibold text-gray-600">Purchase Date:</label>
                            <input type="date" value={currentDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setCurrentDate(e.target.value)} className="input input-bordered w-full bg-white"/>
                        </div>
                    </div>

                    <ProductSearch 
                         searchProduct={productSearch}
                         setSearchProduct={setProductSearch}
                         products={products}
                         isPurchase={true} 
                         handleOpenAddModal={handleOpenAddModal}
                    />

                    <PurchaseTable 
                        products={selectedProducts}
                        onUpdateProduct={handleUpdateTableProduct}
                        onRemoveProduct={(idx) => setSelectedProducts(selectedProducts.filter((_, i) => i !== idx))}
                    />
                </div>

                <div className="lg:w-1/4 lg:min-w-[300px] w-full">
                    <PurchaseSummary 
                        totalBill={calculateTotalBill()}
                        credit={credit}
                        paidAmount={totalPayment}
                        paymentMode={paymentMode}
                        onPaymentChange={(val) => {
                            const bill = calculateTotalBill();
                            if(Number(val) > bill) alert("Cannot exceed total bill");
                            else setTotalPayment(val === '' ? '' : parseFloat(val));
                        }}
                        onModeChange={setPaymentMode}
                        onSave={handleSave}
                        isEditMode={isEditMode}
                    />
                </div>
            </div>
        </div>
    );
};

export default NewPurchases;