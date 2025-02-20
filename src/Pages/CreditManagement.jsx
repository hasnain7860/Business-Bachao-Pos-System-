import React, { useState } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { FaPlus, FaTimes } from "react-icons/fa";
import { v4 as uuidv4 } from 'uuid';

const CreditManagement = () => {
    const context = useAppContext();
    const customers = context.supplierCustomerContext.customers;
    const salesData = context.SaleContext.Sales;
    const submittedRecords = context.creditManagementContext.submittedRecords;
    const addRecords = context.creditManagementContext.add;

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [formType, setFormType] = useState("");
    const [formData, setFormData] = useState({
        id: uuidv4(),
        date: new Date().toISOString().substring(0, 10),
        amount: "",
        note: ""
    });
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCustomerSelect = customer => {
        setSelectedCustomer(customer);
        setSearchTerm("");
    };

    const handleSubmit = () => {
        if (!formData.amount) return;

        const newRecord = {
            id: uuidv4(),
            customerId: selectedCustomer.id,
            type: formType,
            amount: parseFloat(formData.amount),
            date: formData.date,
            note: formData.note
        };

        addRecords(newRecord);
        setShowPopup(false);
        setFormData({
            id: uuidv4(),
            date: new Date().toISOString().substring(0, 10),
            amount: "",
            note: ""
        });
    };

    const totalRecordsPayment = submittedRecords
        .filter(record => record.type === "payment" && record.customerId === selectedCustomer?.id)
        .reduce((acc, record) => acc + record.amount, 0);
        
        
        console.log(totalRecordsPayment + " record payment")
      const totalSalesPayment = salesData.filter(sale => sale.customerId === selectedCustomer?.id).reduce((acc , sale) => acc + sale.amountPaid , 0)  
      
      
      
      
        
        const totalAddPayment = salesData.filter(sale => sale.customerId === selectedCustomer?.id && sale.addPayment).reduce((acc , sale) => acc + sale.addPayment.reduce((acc , addpayment)=> acc + Number(addpayment.amount) , 0) ,0)
        
       
        
        
        console.log(totalAddPayment + " total add payment")
    const totalPayment = Number(totalRecordsPayment) + Number(totalSalesPayment) + Number(totalAddPayment)
    
    
    
    
    const grandCredit = submittedRecords
        .filter(record => record.type === "credit" && record.customerId === selectedCustomer?.id)
        .reduce((acc, record) => acc + record.amount, 0);

    return (
        <div className="p-4 bg-gray-50">
            <h1 className="text-lg font-bold mb-4 text-blue-600">Credit Management</h1>
            {!selectedCustomer ? (
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search Customer"
                        className="input input-bordered w-full border-gray-300"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {filteredCustomers.length > 0 && (
                        <div className="absolute z-10 bg-white border rounded shadow-md w-full mt-1 max-h-40 overflow-y-auto">
                            {filteredCustomers.map(customer => (
                                <div
                                    key={customer.id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleCustomerSelect(customer)}
                                >
                                    {customer.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="border p-4 rounded-lg bg-white shadow">
                    <h2 className="text-lg font-semibold text-blue-500">
                        {selectedCustomer.name}
                    </h2>
                    <button
                        className="text-red-500 float-right"
                        onClick={() => setSelectedCustomer(null)}
                    >
                        <FaTimes />
                    </button>
                    <h3 className="text-md font-bold mt-4">Sales Data</h3>
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr>
                                <th className="border px-4 py-2">Sale Ref No</th>
                                <th className="border px-4 py-2">Amount Paid</th>
                                <th className="border px-4 py-2">Credit</th>
                                <th className="border px-4 py-2">Date</th>
                                <th className="border px-4 py-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesData
                                .filter(sale => sale.customerId === selectedCustomer.id)
                                .map(sale => (
                                    <React.Fragment key={sale.id}>
                                        <tr className={`${sale.credit === 0 ? "bg-red-200" : "bg-white"} border-b`}>
                                            <td className="border px-4 py-2">{sale.salesRefNo}</td>
                                            <td className="border px-4 py-2">{sale.amountPaid}</td>
                                            <td className="border px-4 py-2">{sale.credit}</td>
                                            <td className="border px-4 py-2">{new Date(sale.dateTime).toLocaleDateString()}</td>
                                            <td className="border px-4 py-2 text-center">
                                                <button
                                                    className="text-blue-600"
                                                    onClick={() => setDropdownOpen(dropdownOpen === sale.id ? null : sale.id)}
                                                >
                                                    {dropdownOpen === sale.id ? "▲" : "▼"}
                                                </button>
                                            </td>
                                        </tr>
                                        {dropdownOpen === sale.id && (
                                            <tr>
                                                <td colSpan="5" className="border px-4 py-2 bg-gray-100">
                                                    {sale.addPayment && sale.addPayment.length > 0 ? (
                                                        <div>
                                                            <p className="font-bold text-gray-700">Payment Details:</p>
                                                            <table className="w-full border-collapse border border-gray-300 mt-2">
                                                                <thead>
                                                                    <tr className="bg-gray-200">
                                                                        <th className="border px-4 py-2">Ref No</th>
                                                                        <th className="border px-4 py-2">Amount</th>
                                                                        <th className="border px-4 py-2">Notes</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {sale.addPayment.map((payment, index) => (
                                                                        <tr key={index} className="bg-white border-b">
                                                                            <td className="border px-4 py-2">{payment.refNo}</td>
                                                                            <td className="border px-4 py-2">{payment.amount}</td>
                                                                            <td className="border px-4 py-2">{payment.notes || "N/A"}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <p className="text-red-500">No payments recorded.</p>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                        </tbody>
                    </table>
{selectedCustomer && submittedRecords.length > 0 && (
    <div className="mt-4">
        <h3 className="text-lg font-semibold">Existing Records</h3>
        <table className="min-w-full bg-white border border-gray-300 mt-2">
            <thead>
                <tr className="bg-gray-200">
                    <th className="border px-4 py-2">Type</th>
                    <th className="border px-4 py-2">Amount</th>
                    <th className="border px-4 py-2">Date</th>
                    <th className="border px-4 py-2">Notes</th>
                </tr>
            </thead>
            <tbody>
                {submittedRecords
                    .filter(record => record.customerId === selectedCustomer.id)
                    .map(record => (
                        <tr key={record.id} className="border-b">
                            <td className="border px-4 py-2">{record.type}</td>
                            <td className="border px-4 py-2">{record.amount}</td>
                            <td className="border px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                            <td className="border px-4 py-2">{record.note}</td>
                        </tr>
                    ))}
            </tbody>
        </table>
    </div>
)}        
                    <h3 className="text-md font-bold mt-4">Total Payment: {totalPayment}</h3>
                    <h3 className="text-md font-bold mt-4">Grand Credit: {grandCredit}</h3>

                    <div className="mt-4 flex space-x-2">
                        <button
                            className="bg-green-500 text-white px-4 py-2 rounded"
                            onClick={() => {
                                setShowPopup(true);
                                setFormType("payment");
                            }}
                        >
                            Add Payment
                        </button>
                        <button
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => {
                                setShowPopup(true);
                                setFormType("credit");
                            }}
                        >
                            Add Credit
                        </button>
                    </div>
                </div>
            )}

            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg w-80">
                        <h3 className="text-lg font-bold">Add {formType}</h3>
                        <input
                            type="date"
                            className="w-full p-2 border rounded mt-2"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            className="w-full p-2 border rounded mt-2"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Note"
                            className="w-full p-2 border rounded mt-2"
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                        />
                        <div className="mt-4 flex space-x-2">
                            <button
                                className="bg-green-500 text-white px-4 py-2 rounded"
                                onClick={handleSubmit}
                            >
                                Add
                            </button>
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded"
                                onClick={() => setShowPopup(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreditManagement;