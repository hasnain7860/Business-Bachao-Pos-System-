import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SelectedProductsTable from "../components/element/SelectedProductsTable.jsx";
import ProductSearch from "../components/element/ProductSearch.jsx";
import { useAppContext } from "../Appfullcontext";
import AddProductModal from "../components/element/AddProductModal";
import { CalculateUserCredit } from "../Utils/CalculateUserCredit";

// Import Smart Modal
import PeopleFormModal from "../components/people/PeopleFormModal"; 

const EditSale = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const context = useAppContext();

    // --- CRITICAL FIX: Universal Store Mapping ---
    // 1. Map .data to variables
    // 2. Add Safe Fallbacks || []
    const people = context.peopleContext.data || [];
    const allProducts = context.productContext.data || [];
    const allSales = context.SaleContext.data || [];
    
    const editSaleInContext = context.SaleContext.edit;
    const editProductInContext = context.productContext.edit;

    const isPrint = useRef(false);

    const [originalSale, setOriginalSale] = useState(null);
    const [salesRefNo, setSalesRefNo] = useState("");
    const [selectedPerson, setSelectedPerson] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [searchProduct, setSearchProduct] = useState("");
    const [paymentMode, setPaymentMode] = useState("");
    const [amountPaid, setAmountPaid] = useState("0");
    const [credit, setCredit] = useState(0);
    const [discount, setDiscount] = useState(0);
    
    // Modal UI States
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedModalProduct, setSelectedModalProduct] = useState(null);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [userCreditData, setUserCreditData] = useState(null);
    
    // New Person Modal State
    const [showPeopleModal, setShowPeopleModal] = useState(false);
    
    // Global Price Mode
    const [globalPriceMode, setGlobalPriceMode] = useState('sell');

    useEffect(() => {
        if(allSales.length > 0) {
            const saleToEdit = allSales.find(sale => sale.id === id);
            if (saleToEdit) {
                setOriginalSale(saleToEdit);
                setSalesRefNo(saleToEdit.salesRefNo);
                setSelectedPerson(saleToEdit.personId);
                setSelectedProducts(saleToEdit.products || []);
                setPaymentMode(saleToEdit.paymentMode);
                setAmountPaid(saleToEdit.amountPaid);
                setDiscount(saleToEdit.discount);
                setCredit(saleToEdit.credit);
            } else {
                setMessage("Sale not found!");
            }
            setIsLoading(false);
        }
    }, [id, allSales]);

    useEffect(() => {
        if (selectedPerson) {
            setUserCreditData(CalculateUserCredit(context, selectedPerson));
        }
    }, [selectedPerson, context]);

    useEffect(() => {
        handleCalculateCredit();
    }, [selectedProducts, amountPaid, discount]);

    // --- NEW: Handle Person Added from Modal ---
    const handlePersonAdded = (newPerson) => {
        setMessage(`Person Added: ${newPerson.name}`);
        setSelectedPerson(newPerson.id); // Auto Select
        setTimeout(() => setMessage(""), 3000);
    };

    // UPDATED: handleAddProduct (Universal Logic)
    const handleAddProduct = (product, batch, userEnteredQty, basePrice, priceType, unitMode, conversionRate, unitName) => {
        
        // Calculate Display Price & Total Pieces
        const totalPieces = unitMode === 'secondary' ? Number(userEnteredQty) * Number(conversionRate) : Number(userEnteredQty);
        const displayPrice = unitMode === 'secondary' ? Number(basePrice) * Number(conversionRate) : Number(basePrice);

        const existingProduct = selectedProducts.find(
            p => p.id === product.id && p.batchCode === batch.batchCode
        );
        
        if (!existingProduct && batch.quantity > 0) {
            setSelectedProducts(currentProducts => [
                ...currentProducts,
                {
                    ...product,
                    batchCode: batch.batchCode,
                    
                    // DB Fields
                    SellQuantity: totalPieces,
                    purchasePrice: batch.purchasePrice,
                    
                    // UI Fields
                    enteredQty: userEnteredQty,
                    unitMode: unitMode || 'base',
                    unitName: unitName || 'Pcs',
                    conversionRate: conversionRate || 1,
                    newSellPrice: displayPrice,
                    
                    discount: 0,
                    sellPrice: batch.sellPrice,
                    wholeSalePrice: batch.wholeSalePrice,
                    priceUsedType: priceType,
                    batchQuantity: batch.quantity
                }
            ]);
        }
    };

    const handleProductChange = (id, batchCode, field, value) => {
        setSelectedProducts(currentProducts =>
            currentProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    if (field === "enteredQty") {
                        const val = Number(value);
                        const conv = p.conversionRate || 1;
                        // Recalculate total pieces
                        return { ...p, enteredQty: val, SellQuantity: val * conv };
                    }
                    return { ...p, [field]: value };
                }
                return p;
            })
        );
    };

    const handleSellingPriceChange = (id, batchCode, value) => {
        setSelectedProducts(currentProducts =>
            currentProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    const newSellPrice = Number(value);
                    const type = p.priceUsedType || 'sell';
                    
                    // Base price logic needs to consider Unit Mode
                    let basePrice = type === 'wholesale' ? Number(p.wholeSalePrice) : Number(p.sellPrice);
                    if(p.unitMode === 'secondary') {
                        basePrice = basePrice * (p.conversionRate || 1);
                    }

                    let discountPercent = 0;
                    if(basePrice > 0) {
                        discountPercent = ((basePrice - newSellPrice) / basePrice) * 100;
                    }
                    
                    if(discountPercent < 0) discountPercent = 0;

                    return { ...p, newSellPrice: newSellPrice, discount: discountPercent.toFixed(2) };
                }
                return p;
            })
        );
    };

    const handleOpenAddModal = (product, batch) => {
        setSelectedModalProduct(product);
        setSelectedBatch(batch);
        setShowAddModal(true);
    };

    const handleUpdateSale = async () => {
        if (!originalSale) {
            setMessage("Original sale data is missing. Cannot update.");
            return;
        }
        if (!selectedPerson) {
            setMessage("Please add a person first.");
            return;
        }
        if (amountPaidcheck > calculateTotalPayment()) {
            setMessage("Amount paid cannot be greater than total bill.");
            return;
        }
        
        // Stock Restoration Logic (Revert Old, Deduct New)
        // 1. Identify all involved products
        const affectedProductIds = new Set();
        originalSale.products.forEach(p => affectedProductIds.add(p.id));
        selectedProducts.forEach(p => affectedProductIds.add(p.id));

        // 2. Get fresh copy of products from context
        const productsToProcess = JSON.parse(JSON.stringify(
            allProducts.filter(p => affectedProductIds.has(p.id))
        ));

        // 3. Revert Original Sale (Add back stock)
        for (const originalProduct of originalSale.products) {
            const product = productsToProcess.find(p => p.id === originalProduct.id);
            if (product) {
                const batch = product.batchCode.find(b => b.batchCode === originalProduct.batchCode);
                if (batch) {
                    batch.quantity = Number(batch.quantity) + Number(originalProduct.SellQuantity);
                }
            }
        }

        // 4. Deduct New Sale (Subtract stock)
        for (const newProduct of selectedProducts) {
            const product = productsToProcess.find(p => p.id === newProduct.id);
            if (product) {
                const batch = product.batchCode.find(b => b.batchCode === newProduct.batchCode);
                if (batch) {
                    batch.quantity = Number(batch.quantity) - Number(newProduct.SellQuantity);
                }
            }
        }

        try {
            // 5. Update Products in DB
            for (const product of productsToProcess) {
                await editProductInContext(product.id, product);
            }

            // 6. Update Sale Record
            const updatedSaleData = {
                ...originalSale,
                personId: selectedPerson,
                products: selectedProducts,
                paymentMode,
                subtotal: calculateSubtotal().toFixed(2),
                discount,
                totalBill: calculateTotalPayment(),
                amountPaid: amountPaidcheck,
                credit,
                lastUpdated: new Date().toISOString()
            };
            await editSaleInContext(id, updatedSaleData);

            alert("Sales updated successfully!");
            if (isPrint.current) {
                return updatedSaleData;
            }
            navigate("/sales");
        } catch (error) {
            console.error("Update failed:", error);
            setMessage("Failed to update sale. Please try again.");
        }
    };
    
    // Helpers
    const validateSellingPrice = product => {
        const costPerPiece = Number(product.purchasePrice);
        const totalCost = product.unitMode === 'secondary' ? costPerPiece * (product.conversionRate || 1) : costPerPiece;
        return Number(product.newSellPrice) < totalCost;
    };

    const calculateSubtotal = () => {
        return selectedProducts.reduce((total, product) => {
            return Number(total) + (Number(product.newSellPrice) * Number(product.enteredQty));
        }, 0);
    };

    const calculateTotalPayment = () => Math.max(0, calculateSubtotal() - Number(discount)).toFixed(2);
    const handleAmountPaidChange = e => setAmountPaid(e.target.value);
    const amountPaidcheck = amountPaid === "" ? 0 : Number(amountPaid);
    const handleCalculateCredit = () => setCredit(Number(calculateTotalPayment()) - amountPaidcheck);
    const handleCancelProduct = (id, batchCode) => setSelectedProducts(selectedProducts.filter(p => !(p.id === id && p.batchCode === batchCode)));

    const handleUpdateAndPrintSales = async () => {
        isPrint.current = true;
        const salesData = await handleUpdateSale();
        if (salesData) {
            navigate(`/sales/view/${salesData.id}/print`);
        }
        isPrint.current = false;
    };

    if (isLoading) return <div className="text-center p-10">Loading Sale Data...</div>;
    if (!originalSale) return <div className="text-center p-10 text-red-500 font-bold">{message || "Could not find the sale to edit."}</div>;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold text-primary mb-6">Edit Sale</h2>
            {message && <div className="text-red-500 mb-4">{message}</div>}
            
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow">
                            <label className="text-sm font-semibold text-gray-600">Sales Reference:</label>
                            <input type="text" value={salesRefNo} readOnly className="input input-bordered w-full bg-gray-50"/>
                        </div>

                        {/* Global Price Mode */}
                        <div className="bg-white rounded-lg p-4 shadow flex flex-col justify-between">
                            <label className="text-sm font-semibold text-gray-600 mb-2">Global Price Mode:</label>
                            <div className="flex bg-gray-200 rounded-lg p-1">
                                <button onClick={() => setGlobalPriceMode('sell')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${globalPriceMode === 'sell' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}>Retailer</button>
                                <button onClick={() => setGlobalPriceMode('wholesale')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${globalPriceMode === 'wholesale' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}>Wholesaler</button>
                            </div>
                        </div>

                        {/* Person Selection with + Button */}
                        <div className="bg-white rounded-lg p-4 shadow">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-600">Person:</label>
                                    <select className="select select-bordered w-full" value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}>
                                        {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <button type="button" className="btn btn-primary btn-sm h-10" onClick={() => setShowPeopleModal(true)}>+ New</button>
                            </div>
                        </div>
                    </div>

                    <ProductSearch searchProduct={searchProduct} setSearchProduct={setSearchProduct} products={allProducts} handleOpenAddModal={handleOpenAddModal}/>
                    
                    <SelectedProductsTable selectedProducts={selectedProducts} handleProductChange={handleProductChange} handleSellingPriceChange={handleSellingPriceChange} validateSellingPrice={validateSellingPrice} handleCancelProduct={handleCancelProduct}/>
                </div>

                <div className="lg:w-1/4 lg:min-w-[300px] w-full">
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-6 shadow-lg lg:sticky lg:top-4">
                        <h3 className="text-2xl font-bold mb-6 text-blue-800">Payment Details</h3>
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">Payment Mode:</label>
                            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="select select-bordered w-full">
                                <option value="">Select</option><option value="cash">Cash</option><option value="online">Online</option><option value="bank">Bank</option><option value="cheque">Cheque</option>
                            </select>
                        </div>
                        <div className="space-y-2 mb-4"><div className="flex justify-between"><span>Subtotal:</span><span className="font-bold">Rs. {calculateSubtotal().toFixed(2)}</span></div></div>
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">Discount (Rs.):</label>
                            <input type="number" value={discount} onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))} className="input input-bordered w-full"/>
                        </div>
                        <div className="bg-blue-500 p-4 rounded-lg mb-4"><label className="text-white text-sm">Total Bill:</label><div className="text-3xl font-bold text-white">Rs. {calculateTotalPayment()}</div></div>
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">Amount Paid:</label>
                            <input type="number" value={amountPaid} onChange={handleAmountPaidChange} className="input input-bordered w-full"/>
                        </div>
                        <div className="bg-red-500 p-4 rounded-lg mb-6"><label className="text-white text-sm">Credit (Due):</label><div className="text-3xl font-bold text-white">Rs. {credit.toFixed(2)}</div></div>
                        <div className="flex flex-col gap-3">
                            <button type="button" onClick={handleUpdateSale} className="btn btn-primary w-full">Update Sale</button>
                            <button type="button" onClick={handleUpdateAndPrintSales} className="btn btn-secondary w-full">Update & Print</button>
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

            {/* Person Modal */}
            <PeopleFormModal 
                isVisible={showPeopleModal}
                onClose={() => setShowPeopleModal(false)}
                onSuccess={handlePersonAdded}
            />
        </div>
    );
};

export default EditSale;

