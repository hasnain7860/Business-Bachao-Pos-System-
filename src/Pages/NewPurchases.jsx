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
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [totalPayment, setTotalPayment] = useState(0);
    const [credit, setCredit] = useState(0);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalProductData, setModalProductData] = useState({ product: null, batch: null });
    
    // --- LOAD DATA FOR EDIT (FIXED: RE-HYDRATE NAMES) ---
    useEffect(() => {
        // Wait for units to load as well
        if (isEditMode && purchases.length > 0 && units.length > 0) {
            const purchaseToEdit = purchases.find(p => String(p.id) === String(id));
            if (purchaseToEdit) {
                setselectedPeople(purchaseToEdit.personId || '');
                setCurrentDate(purchaseToEdit.date || new Date().toISOString().split('T')[0]);
                setPaymentMode(purchaseToEdit.paymentMode || 'Cash');
                setTotalPayment(purchaseToEdit.totalPayment || 0);
                
                // IMPORTANT FIX: Re-attach Unit Names from IDs
                const hydratedProducts = (purchaseToEdit.products || []).map(p => {
                    // Find actual names from Unit Context using saved IDs
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
    }, [id, purchases, isEditMode, units]); // Added units to dependency

    // --- CALCULATIONS ---
    const calculateTotalBill = () => selectedProducts.reduce((total, p) => total + Number(p.total || 0), 0);

    useEffect(() => {
        const total = calculateTotalBill();
        const pay = totalPayment === '' ? 0 : parseFloat(totalPayment);
        setCredit(total - pay);
    }, [selectedProducts, totalPayment]);

    // --- HANDLERS ---
    const handleOpenAddModal = (product, batch = null) => {
        const exists = selectedProducts.find(p => p.id === product.id);
        if (exists) { alert('Product already in table. Edit it there.'); return; }

        setModalProductData({ product, batch });
        setIsModalOpen(true);
        setProductSearch("");
    };

    const handleConfirmAdd = (newProductRow) => {
        // newProductRow is already sanitized by Modal
        newProductRow.purchaseRefNo = `PURCHASE-${Math.floor(100000 + Math.random() * 900000)}`;
        setSelectedProducts([...selectedProducts, newProductRow]);
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

        // Recalculate
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

    const handleSave = async () => {
        if (!selectedPeople) return alert("Select Supplier");
        if (selectedProducts.length === 0) return alert("Add Products");

        const totalBill = calculateTotalBill();
        const autoInitDate = new Date(0).toISOString();

        // 1. REVERT STOCK IF EDITING
        if (isEditMode) {
            const oldPurchase = purchases.find(p => String(p.id) === String(id));
            if (oldPurchase && oldPurchase.products) {
                for (const oldP of oldPurchase.products) {
                    const prodInDb = products.find(p => p.id === oldP.id);
                    if (prodInDb && prodInDb.batchCode) {
                        const batchIndex = prodInDb.batchCode.findIndex(b => b.batchCode === oldP.batchCode);
                        if (batchIndex !== -1) {
                            prodInDb.batchCode[batchIndex].quantity = Number(prodInDb.batchCode[batchIndex].quantity || 0) - Number(oldP.quantity || 0);
                            await updateProduct(prodInDb.id, { ...prodInDb });
                        }
                    }
                }
            }
        }

        // 2. ADD NEW STOCK
        for (const product of selectedProducts) {
            const existingProduct = products.find((p) => p.id === product.id);
            if (existingProduct) {
                let batches = existingProduct.batchCode ? [...existingProduct.batchCode] : [];
                const existingBatchIndex = batches.findIndex(b => b.batchCode === product.batchCode);

                if (existingBatchIndex !== -1) {
                    const existingBatch = batches[existingBatchIndex];
                    
                    // Sanitize Update
                    existingBatch.purchasePrice = Number(product.purchasePrice || 0);
                    existingBatch.sellPrice = Number(product.sellPrice || 0);
                    existingBatch.wholeSalePrice = Number(product.wholeSalePrice || 0);
                    existingBatch.retailPrice = Number(product.retailPrice || 0);
                    existingBatch.expirationDate = product.expirationDate || "";
                    
                    existingBatch.quantity = Number(existingBatch.quantity || 0) + Number(product.quantity || 0);
                } else {
                    // Create New Batch
                    batches.push({
                        batchCode: product.batchCode || "BATCH-ERR",
                        expirationDate: product.expirationDate || "",
                        purchasePrice: Number(product.purchasePrice || 0),
                        sellPrice: Number(product.sellPrice || 0),
                        wholeSalePrice: Number(product.wholeSalePrice || 0),
                        retailPrice: Number(product.retailPrice || 0),
                        quantity: Number(product.quantity || 0),
                        openingStock: 0,
                        openingStockDate: autoInitDate,
                        damageQuantity: 0
                    });
                }
                await updateProduct(product.id, { ...existingProduct, batchCode: batches });
            }
        }

        // 3. CLEAN & SAVE PURCHASE RECORD (Deep Clean)
        const cleanedProducts = selectedProducts.map(p => ({
            id: p.id,
            name: p.name,
            companyId: p.companyId || null,
            
            // IDs
            baseUnitId: p.baseUnitId || null,
            secondaryUnitId: p.secondaryUnitId || null,
            transactionUnitId: p.transactionUnitId || p.baseUnitId || null,
            
            // Logic
            hasSecondary: Boolean(p.hasSecondary),
            conversionRate: Number(p.conversionRate) || 1,
            unitMode: p.unitMode || 'base',
            
            // Values
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
            totalBill: Number(totalBill || 0),
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

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                            <label className="text-xs sm:text-sm font-semibold text-gray-600">Supplier *:</label>
                            <div className="flex gap-2">
                                <select className="select select-bordered w-full text-xs sm:text-sm bg-white" value={selectedPeople} onChange={(e) => setselectedPeople(e.target.value)}>
                                    <option value="" disabled>Select a Supplier</option>
                                    {peoples.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                                </select>
                                <button className="btn btn-primary btn-sm hidden sm:flex" onClick={() => navigate("/people")}><AiOutlinePlus /> New</button>
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


