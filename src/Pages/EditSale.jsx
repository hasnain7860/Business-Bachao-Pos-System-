import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SelectedProductsTable from "../components/element/SelectedProductsTable.jsx";
import ProductSearch from "../components/element/ProductSearch.jsx";
import { useAppContext } from "../Appfullcontext";
import AddProductModal from "../components/element/AddProductModal";
import { CalculateUserCredit } from "../Utils/CalculateUserCredit";

const EditSale = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // URL se sale ID hasil karna
    const context = useAppContext();

    const people = context.peopleContext.people;
    const allProducts = context.productContext.products;
    const editProductInContext = context.productContext.edit;
    const editSaleInContext = context.SaleContext.edit; // Maan lein ke aapke context mein 'edit' function hai
    const allSales = context.SaleContext.Sales;

    const isPrint = useRef(false);

    // State for original sale data
    const [originalSale, setOriginalSale] = useState(null);

    // Form states
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
    const [isLoading, setIsLoading] = useState(true);

    // Step 1: Jab component load ho, to ID se sale ka data nikalein aur form ko fill karein
    useEffect(() => {
        const saleToEdit = allSales.find(sale => sale.id === id);
        if (saleToEdit) {
            setOriginalSale(saleToEdit);
            setSalesRefNo(saleToEdit.salesRefNo);
            setSelectedPerson(saleToEdit.personId);
            setSelectedProducts(saleToEdit.products);
            setPaymentMode(saleToEdit.paymentMode);
            setAmountPaid(saleToEdit.amountPaid);
            setDiscount(saleToEdit.discount);
            setCredit(saleToEdit.credit);
        } else {
            setMessage("Sale not found!");
        }
        setIsLoading(false);
    }, [id, allSales]);

    useEffect(() => {
        if (selectedPerson) {
            setUserCreditData(CalculateUserCredit(context, selectedPerson));
        }
    }, [selectedPerson]);
    
    useEffect(() => {
        handleCalculateCredit();
    }, [selectedProducts, amountPaid, discount]);

    const handleAddProduct = (product, batch, quantity = 1) => {
        // Logic same as NewSales
        const existingProduct = selectedProducts.find(p => p.id === product.id && p.batchCode === batch.batchCode);
        if (!existingProduct && batch.quantity > 0) {
            setSelectedProducts([...selectedProducts, { ...product, batchCode: batch.batchCode, SellQuantity: quantity, discount: 0, sellPrice: batch.sellPrice, newSellPrice: batch.sellPrice, purchasePrice: batch.purchasePrice, batchQuantity: batch.quantity }]);
        }
    };

    const handleProductChange = (id, batchCode, field, value) => {
        // Logic same as NewSales
        if (field === "SellQuantity") {
            const quantity = Math.max(0, Math.min(Number(value), selectedProducts.find(p => p.id === id && p.batchCode === batchCode)?.batchQuantity || 0));
            setSelectedProducts(selectedProducts.map(p => p.id === id && p.batchCode === batchCode ? { ...p, [field]: quantity } : p));
        } else {
            setSelectedProducts(selectedProducts.map(p => p.id === id && p.batchCode === batchCode ? { ...p, [field]: value } : p));
        }
    };
    
    const handleSellingPriceChange = (id, batchCode, value) => {
        // Logic same as NewSales
        const updatedProducts = selectedProducts.map(p => {
            if (p.id === id && p.batchCode === batchCode) {
                const newSellPrice = value;
                let discount = 100 - (newSellPrice * 100) / p.sellPrice;
                discount = Math.max(discount, 0);
                return { ...p, newSellPrice: newSellPrice, discount: discount };
            }
            return p;
        });
        setSelectedProducts(updatedProducts);
    };

    const handleOpenAddModal = (product, batch) => {
        // Logic same as NewSales
        setSelectedModalProduct(product);
        setSelectedBatch(batch);
        setShowAddModal(true);
    };

    const validateSellingPrice = product => product.newSellPrice < product.purchasePrice;
    const calculateSubtotal = () => selectedProducts.reduce((total, p) => total + (p.newSellPrice * p.SellQuantity), 0);
    const calculateTotalPayment = () => Math.max(0, calculateSubtotal() - Number(discount)).toFixed(2);
    const handleAmountPaidChange = e => setAmountPaid(e.target.value);
    const amountPaidcheck = amountPaid === "" ? 0 : Number(amountPaid);
    const handleCalculateCredit = () => setCredit(Number(calculateTotalPayment()) - amountPaidcheck);
    const handleCancelProduct = (id, batchCode) => setSelectedProducts(selectedProducts.filter(p => !(p.id === id && p.batchCode === batchCode)));


    // Step 2: Sab se ahem function - Sale ko update karna
    const handleUpdateSale = async () => {
        if (!originalSale) {
            setMessage("Original sale data is missing. Cannot update.");
            return;
        }
        if (!selectedPerson) {
            setMessage("Please add a person first.");
            return;
        }
        // Baaki validations
        if (amountPaidcheck > calculateTotalPayment()) {
            setMessage("Amount paid cannot be greater than total bill.");
            return;
        }
        if (discount > calculateSubtotal()) {
            setMessage("Discount cannot be greater than the subtotal.");
            return;
        }

        // --- INVENTORY MANAGEMENT LOGIC ---
 // Step 1: Sirf un products ki IDs jama karein jinko update karna hai.
    // Yeh bilkul fast hai aur memory mein hota hai.
    const affectedProductIds = new Set();
    originalSale.products.forEach(p => affectedProductIds.add(p.id));
    selectedProducts.forEach(p => affectedProductIds.add(p.id));

    // Step 2: Sirf affected products ka ek temporary (in-memory) copy banayein.
    // 911 ke bajaye sirf 8-9 products process honge.
    const productsToProcess = JSON.parse(JSON.stringify(
        allProducts.filter(p => affectedProductIds.has(p.id))
    ));

    // Step 3: Stock ko memory mein calculate karein (Revert -> Apply logic)
    // Yeh logic bhi fast hai kyunke yeh sirf 'productsToProcess' par chal raha hai.
    // Revert: Purani sale ki quantity wapas add karein.
    for (const originalProduct of originalSale.products) {
        const product = productsToProcess.find(p => p.id === originalProduct.id);
        if (product) {
            const batch = product.batchCode.find(b => b.batchCode === originalProduct.batchCode);
            if (batch) {
                batch.quantity = Number(batch.quantity) + Number(originalProduct.SellQuantity);
            }
        }
    }
    // Apply: Nayi sale ki quantity stock se minus karein.
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
        // Step 4: Ab sirf affected products (8 ya 9) ko ek ek karke update karein.
        // Har call aapke offline queue mein ek entry daal degi.
        for (const product of productsToProcess) {
            await context.productContext.edit(product.id, product);
        }

        // Step 5: Aakhir mein sale record ko update karein.
        // Iski bhi ek alag entry queue mein chali jayegi.
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
        await context.SaleContext.edit(id, updatedSaleData);

        alert("Sales updated successfully! (Data saved locally)");
        
        if (isPrint.current) {
            return updatedSaleData;
        }
        
        navigate("/sales");

    } catch (error) {
        console.error("Local update failed:", error);
        setMessage("Failed to update sale locally. Please try again.");
    }
};

    const handleUpdateAndPrintSales = async () => {
        isPrint.current = true;
        const salesData = await handleUpdateSale();
        if (salesData) {
            navigate(`/sales/view/${salesData.id}/print`);
        }
        isPrint.current = false;
    };

    if (isLoading) {
        return <div className="text-center p-10">Loading Sale Data...</div>;
    }

    if (!originalSale) {
        return <div className="text-center p-10 text-red-500 font-bold">{message || "Could not find the sale to edit."}</div>;
    }

    return (
        // Poora JSX NewSales.jsx jaisa hi rahega, sirf button text aur heading change hogi
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold text-primary mb-6">Edit Sale</h2>

            {message && <div className="text-red-500 mb-4">{message}</div>}

            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left Content Area (Poora code NewSales jaisa) */}
                <div className="flex-1 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow">
                            <label className="text-sm font-semibold text-gray-600">Sales Reference:</label>
                            <input type="text" value={salesRefNo} readOnly className="input input-bordered w-full bg-gray-50"/>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow">
                           {/* Person selection ka poora code yahan paste karein */}
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-gray-600">Person:</label>
                                    <select className="select select-bordered w-full" value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}>
                                        {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <button type="button" className="btn btn-primary btn-sm h-10" onClick={() => navigate("/people")}>+ New</button>
                            </div>
                        </div>
                    </div>

                    <ProductSearch searchProduct={searchProduct} setSearchProduct={setSearchProduct} products={allProducts} handleOpenAddModal={handleOpenAddModal}/>
                    
                    <SelectedProductsTable selectedProducts={selectedProducts} handleProductChange={handleProductChange} handleSellingPriceChange={handleSellingPriceChange} validateSellingPrice={validateSellingPrice} handleCancelProduct={handleCancelProduct}/>
                </div>

                {/* Right Sidebar - Payment Details (Poora code NewSales jaisa) */}
                <div className="lg:w-1/4 lg:min-w-[300px] w-full">
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg p-6 shadow-lg lg:sticky lg:top-4">
                        <h3 className="text-2xl font-bold mb-6 text-blue-800">Payment Details</h3>
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">Payment Mode:</label>
                            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="select select-bordered w-full">
                                <option value="">Select</option>
                                <option value="cash">Cash</option>
                                <option value="online">Online</option>
                                <option value="bank">Bank</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between"><span>Subtotal:</span><span className="font-bold">Rs. {calculateSubtotal().toFixed(2)}</span></div>
                        </div>
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">Discount (Rs.):</label>
                            <input type="number" value={discount} onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))} className="input input-bordered w-full"/>
                        </div>
                        <div className="bg-blue-500 p-4 rounded-lg mb-4">
                            <label className="text-white text-sm">Total Bill:</label>
                            <div className="text-3xl font-bold text-white">Rs. {calculateTotalPayment()}</div>
                        </div>
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">Amount Paid:</label>
                            <input type="number" value={amountPaid} onChange={handleAmountPaidChange} className="input input-bordered w-full"/>
                        </div>
                        <div className="bg-red-500 p-4 rounded-lg mb-6">
                            <label className="text-white text-sm">Credit (Due):</label>
                            <div className="text-3xl font-bold text-white">Rs. {credit.toFixed(2)}</div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {/* Buttons ka text update karein */}
                            <button type="button" onClick={handleUpdateSale} className="btn btn-primary w-full">
                                Update Sale
                            </button>
                            <button type="button" onClick={handleUpdateAndPrintSales} className="btn btn-secondary w-full">
                                Update & Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Product Modal (waisa hi rahega) */}
            {showAddModal && <AddProductModal product={selectedModalProduct} batch={selectedBatch} onClose={() => setShowAddModal(false)} onAdd={handleAddProduct}/>}
        </div>
    );
};

export default EditSale;
