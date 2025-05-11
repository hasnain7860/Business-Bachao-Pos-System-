import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SelectedProductsTable from "../components/element/SelectedProductsTable.jsx";
import ProductSearch from "../components/element/ProductSearch.jsx";

import { useAppContext } from "../Appfullcontext";
import { v4 as uuidv4 } from "uuid";
import AddProductModal from "../components/element/AddProductModal";
import { CalculateUserCredit } from "../Utils/CalculateUserCredit";
const NewSales = () => {
    const navigate = useNavigate();
    const context = useAppContext();

    const people = context.peopleContext.people;

    const products = context.productContext.products;
    const editProduct = context.productContext.edit;
    const isPrint = useRef(false);
    const [salesRefNo, setSalesRefNo] = useState("");

    const [selectedPerson, setSelectedPerson] = useState("");
    const [searchPerson, setSearchPerson] = useState("");

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [searchProduct, setSearchProduct] = useState("");
    const [paymentMode, setPaymentMode] = useState("");
    const [amountPaid, setAmountPaid] = useState("0");
    const [credit, setCredit] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedModalProduct, setSelectedModalProduct] = useState(null);
    const [message, setMessage] = useState("");
    console.log(selectedProducts);
 const [userCreditData, setUserCreditData] = useState(null);   
  useEffect(() => {
    if(selectedPerson){
      setUserCreditData(CalculateUserCredit(context,selectedPerson))
    }
  }, [selectedPerson]);
  
  
  
    

    useEffect(() => {
        generateSalesRefNo();
    }, []);

    const generateSalesRefNo = () => {
        setSalesRefNo(`SALE-${Math.floor(100000 + Math.random() * 900000)}`);
    };

    useEffect(() => {
        handleCalculateCredit();
    }, [selectedProducts, amountPaid]);

    const handleAddProduct = (product, batch, quantity = 1) => {
        const existingProduct = selectedProducts.find(
            p => p.id === product.id && p.batchCode === batch.batchCode
        );
        if (!existingProduct && batch.quantity > 0) {
            setSelectedProducts([
                ...selectedProducts,
                {
                    ...product,
                    batchCode: batch.batchCode,
                    SellQuantity: quantity,
                    discount: 0,
                    sellPrice: batch.sellPrice,
                    newSellPrice: batch.sellPrice,
                    purchasePrice: batch.purchasePrice,
                    batchQuantity: batch.quantity
                }
            ]);
        }
    };

    const handleProductChange = (id, batchCode, field, value) => {
        if (field === "SellQuantity") {
            // Convert value to number and ensure it's not negative
            const quantity = Math.max(
                0,
                Math.min(
                    Number(value),
                    selectedProducts.find(
                        p => p.id === id && p.batchCode === batchCode
                    )?.batchQuantity || 0
                )
            );

            const updatedProducts = selectedProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    return { ...p, [field]: quantity };
                }
                return p;
            });
            setSelectedProducts(updatedProducts);
        } else {
            const updatedProducts = selectedProducts.map(p => {
                if (p.id === id && p.batchCode === batchCode) {
                    return { ...p, [field]: value };
                }
                return p;
            });
            setSelectedProducts(updatedProducts);
        }
        handleCalculateCredit();
    };

    const handleSellingPriceChange = (id, batchCode, value) => {
        const updatedProducts = selectedProducts.map(p => {
            if (p.id === id && p.batchCode === batchCode) {
                const newSellPrice = value;
                let discount = 100 - (newSellPrice * 100) / p.sellPrice;
                discount = Math.max(discount, 0); // Agar discount negative hai to 0 kar do
                return { ...p, newSellPrice: newSellPrice, discount: discount };
            }
            return p;
        });
        setSelectedProducts(updatedProducts);
        handleCalculateCredit();
    };

    // Add this new function to handle opening the modal
    const handleOpenAddModal = (product, batch) => {
        setSelectedModalProduct(product);
        setSelectedBatch(batch);
        setShowAddModal(true);
    };

    const validateSellingPrice = product => {
        return Number(product.newSellPrice) < Number(product.purchasePrice);
    };

    const calculateTotalPayment = () => {
        return selectedProducts
            .reduce((total, product) => {
                const productTotal =
                    Number(product.newSellPrice) * Number(product.SellQuantity);
                return Number(total) + Number(productTotal);
            }, 0)
            .toFixed(2);
    };

    const handleAmountPaidChange = e => {
        setAmountPaid(e.target.value);
    };
    let amountPaidcheck = amountPaid === "" ? 0 : Number(amountPaid);
    const handleCalculateCredit = () => {
        
        setCredit(Number(calculateTotalPayment()) - Number(amountPaidcheck));
    };

    const handleSaveSales = async () => {
        if (!selectedPerson) {
            setMessage("Please add a person first.");
            return;
        }

        if (selectedProducts.length === 0) {
            setMessage("Please add at least one product to the sale.");
            return;
        }

if(amountPaidcheck > calculateTotalPayment()){  
        setMessage("Amount paid cannot be greater than total bill.");
        return
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
            totalBill: calculateTotalPayment(),
            amountPaid,
            credit,
            dateTime: new Date().toISOString()
        };

        for (let product of selectedProducts) {
            // Find the product in the original products list
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) {
                // Locate the correct batch in the batchCode array
                const updatedBatchCode = originalProduct.batchCode.map(
                    batch => {
                        if (batch.batchCode === product.batchCode) {
                            // Subtract the sold quantity from the batch's quantity
                            return {
                                ...batch,
                                quantity: batch.quantity - product.SellQuantity
                            };
                        }
                        return batch;
                    }
                );

                // Create updated product with the new batchCode array
                const updatedProduct = {
                    ...originalProduct,
                    batchCode: updatedBatchCode
                };

                // Use the existing editProduct function to update the product in IndexedDB
                await editProduct(product.id, updatedProduct);
            }
        }

        await context.SaleContext.add(salesData);
        alert("Sales saved successfully!");
        if (isPrint.current) {
            return salesData;
        }

        // Reset form
        setSelectedPerson("");
        setSearchPerson("");
        setSelectedProducts([]);
        setPaymentMode("");
        setAmountPaid("");
        setCredit(0);
        generateSalesRefNo();
        setMessage("");
    };

    const handleSaveAndPrintSales = async () => {
        isPrint.current = true;
        const salesData = await handleSaveSales();

        navigate(`/sales/view/${salesData.id}/print`);
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

            {message && <div className="text-red-500 mb-4">{message}</div>}

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

                                        {/* Search Input */}
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

                    {/* Product Search */}
                    <ProductSearch
                        searchProduct={searchProduct}
                        setSearchProduct={setSearchProduct}
                        products={products}
                        handleOpenAddModal={handleOpenAddModal}
                    />

                    {/* Products Table with better responsiveness */}
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

                        <div className="mb-6">
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

                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg mb-6 shadow-md">
                            <label className="text-white text-sm font-semibold block mb-1">
                                Total Bill:
                            </label>
                            <div className="text-3xl font-bold text-white">
                                Rs. {calculateTotalPayment()}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">
                                Amount Paid:
                            </label>
                            <input
                                type="number"
                                value={amountPaid}
                                onChange={handleAmountPaidChange}
                                className="input input-bordered w-full bg-white shadow-sm hover:border-green-400 transition-colors text-lg font-semibold"
                            />
                        </div>






                        <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-lg mb-8 shadow-md">
                            <label className="text-white text-sm font-semibold block mb-1">
                                Credit Amount:
                            </label>
                            <div className="text-3xl font-bold text-white">
                                Rs. {credit}
                            </div>
                        </div>
                        
                        
                        
                        
                        
                       {
              //             userCreditData && (
              //           <>
              //       {   userCreditData.pendingCredit > 0 ? <>
              //     <p>total user credit : {userCreditData.pendingCredit}</p> 
            
              // amount paid  : <input type="number" />   
              
              // adjust in credit : 
              //     <input type="number" />   
              //       </> : <>
              //                           <p>total user payout: {userCreditData.pendingCredit}</p> 
              //       </> } 
              //           </>   
              //               )
                    }
                        
                       
                        
                        
                        
                        
                        
                        
                        <button
                            type="button"
                            onClick={handleSaveSales}
                            className="btn btn-primary w-full mb-3 text-lg font-bold hover:scale-105 transition-transform"
                        >
                            Save Sales
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAndPrintSales}
                            className="btn btn-secondary w-full text-lg font-bold hover:scale-105 transition-transform"
                        >
                            Save and Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showAddModal && (
                <AddProductModal
                    product={selectedModalProduct}
                    batch={selectedBatch}
                    onAdd={(product, batch, quantity) =>
                        handleAddProduct(product, batch, quantity)
                    }
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </div>
    );
};

export default NewSales;
