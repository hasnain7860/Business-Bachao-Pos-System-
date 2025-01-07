
import React, { useState } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { FaSearch, FaPlus, FaTimes } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

const CreditManagement = () => {
  const context = useAppContext();
  const customers = context.supplierCustomerContext.customers;
  const salesData = context.SaleContext.Sales;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filteredSales, setFilteredSales] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10)); // Default to today's date
  const [creditDate, setCreditDate] = useState(new Date().toISOString().substring(0, 10)); // Default to today's date
  const [note, setNote] = useState('');
  const submittedRecords = context.creditManagementContext.submittedRecords;
  const addRecords = context.creditManagementContext.add;
console.log("submit record " + JSON.stringify(submittedRecords))
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isCreditFormOpen, setIsCreditFormOpen] = useState(false);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomerSelect = (customer) => {
    const salesForCustomer = salesData.filter(sale => sale.customerId === customer.id);
    const totalCreditFromSales = salesForCustomer.reduce((total, sale) => total + parseFloat(sale.credit), 0);

    // Check for existing records for this customer
    const existingRecords = submittedRecords.filter(record => record.customerId === customer.id);
    console.log("existingRecords" + JSON.stringify(existingRecords))
    let totalCreditApplied = existingRecords.reduce((total, record) => total + (record.type === 'credit' ? record.amount : 0), 0);
    let totalPaymentsApplied = existingRecords.reduce((total, record) => total + (record.type === 'payment' ? record.amount : 0), 0);

    const initialCreditBalance = (customer.creditBalance || 0) +((totalCreditFromSales + totalCreditApplied ) - totalPaymentsApplied);

console.log("initialCreditBalance" + initialCreditBalance)

    setSelectedCustomer({
      ...customer,
      creditBalance: initialCreditBalance, // Ensure no negative balance
    });
    setSearchTerm('');
    setFilteredSales(salesForCustomer);
  };

  const handleAddPayment = () => {
    if (selectedCustomer && paymentAmount) {
      const newPayment = {
        id: uuidv4(),
        amount: parseFloat(paymentAmount),
        date: paymentDate,
        note: note,
        customerId: selectedCustomer.id, // Add customer ID
      };

      // Update the total credit balance
      const updatedCreditBalance = selectedCustomer.creditBalance - newPayment.amount;
      setSelectedCustomer(prev => ({
        ...prev,
        creditBalance: updatedCreditBalance,
      }));

      addRecords({ ...newPayment, type: 'payment' });
      alert(`Added payment of ${newPayment.amount} to ${selectedCustomer.name} on ${paymentDate}. Note: ${note}`);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().substring(0, 10)); // Reset to default date
      setNote('');
      setIsPaymentFormOpen(false);
    }
  };

  const handleAddCredit = () => {
    if (selectedCustomer && creditAmount) {
      const newCredit = {
        id: uuidv4(),
        amount: parseFloat(creditAmount),
        date: creditDate,
        note: note,
        customerId: selectedCustomer.id, // Add customer ID
        type: 'credit', // Add type for identification
      };

      // Update the total credit balance
      const updatedCreditBalance = selectedCustomer.creditBalance + newCredit.amount;
      setSelectedCustomer(prev => ({
        ...prev,
        creditBalance: updatedCreditBalance,
      }));

      addRecords(newCredit);
      alert(`Added credit of ${newCredit.amount} to ${selectedCustomer.name}. Note: ${note}`);
      setCreditAmount('');
      setCreditDate(new Date().toISOString().substring(0, 10)); // Reset to default date
      setNote('');
      setIsCreditFormOpen(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectedCustomer(null);
    setSearchTerm('');
    setFilteredSales([]);
  };

  return (
    <div className="p-4 bg-gray-50">
      <h1 className="text-lg font-bold mb-4 text-blue-600">Credit Management</h1>

      {!selectedCustomer ? (
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search Customer" 
            className="input input-bordered w-full mr-2 border-gray-300" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
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
        <div className="border p-4 rounded-lg mt-4 bg-white shadow">
          <h2 className="text-lg font-semibold text-blue-500">{selectedCustomer.name}</h2>
          <button
            className="text-red-500 float-right"
            onClick={handleCancelSelection}
          >
            <FaTimes />
          </button>
          <p>Total Credit: {selectedCustomer.creditBalance.toFixed(2)}</p>

          <h3 className="font-bold mt-4">Existing Records</h3>
          {submittedRecords.filter(record => record.customerId === selectedCustomer.id).length > 0 ? (
            submittedRecords.filter(record => record.customerId === selectedCustomer.id).map((record, index) => (
              <div key={index} className="bg-gray-100 p-2 my-1 rounded">
                <p>Type: {record.type?.charAt(0).toUpperCase() + record.type?.slice(1)}</p>
                <p>Amount: {record.amount.toFixed(2)}</p>
                <p>Date: {record.date || 'N/A'}</p>
                <p>Note: {record.note || 'N/A'}</p>
              </div>
            ))
          ) : (
            <p>No existing records for this customer.</p>
          )}

          <h3 className="text-md font-bold mt-4">Sales Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 table-auto">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Sale Ref No</th>
                  <th className="border px-4 py-2">Amount Paid</th>
                  <th className="border px-4 py-2">Credit</th>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Payment Mode</th>
                  <th className="border px-4 py-2">Products</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td className="border px-4 py-2">{sale.salesRefNo}</td>
                    <td className="border px-4 py-2">{sale.amountPaid}</td>
                    <td className="border px-4 py-2">{sale.credit}</td>
                    <td className="border px-4 py-2">{new Date(sale.dateTime).toLocaleDateString()}</td>
                    <td className="border px-4 py-2">{sale.paymentMode}</td>
                    <td className="border px-4 py-2">
                      <button 
                        className="text-blue-500 hover:underline" 
                        onClick={() => alert(JSON.stringify(sale.products, null, 2))}
                      >
                        View Products
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sticky bottom-0 bg-white p-4 flex justify-between">
            <button className="btn bg-green-500 text-white" onClick={() => setIsPaymentFormOpen(true)}>
              Add Payment
            </button>
            <button className="btn bg-blue-500 text-white" onClick={() => setIsCreditFormOpen(true)}>
              Add Credit
            </button>
          </div>

          {/* Payment Form Modal */}
          {isPaymentFormOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded shadow-md w-80">
                <h3 className="font-bold">Add Payment</h3>
                <input 
                  type="number" 
                  placeholder="Payment Amount" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)} 
                  className="input input-bordered w-full my-2"
                />
                <input 
                  type="date" 
                  value={paymentDate} 
                  onChange={(e) => setPaymentDate(e.target.value)} 
                  className="input input-bordered w-full my-2"
                />
                <input 
                  type="text" 
                  placeholder="Notes" 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  className="input input-bordered w-full my-2"
                />
                <button className="btn bg-blue-500 text-white" onClick={handleAddPayment}>Submit</button>
                <button className="btn bg-red-500 text-white" onClick={() => setIsPaymentFormOpen(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Credit Form Modal */}
          {isCreditFormOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded shadow-md w-80">
                <h3 className="font-bold">Add Credit</h3>
                <input 
                  type="number" 
                  placeholder="Credit Amount" 
                  value={creditAmount} 
                  onChange={(e) => setCreditAmount(e.target.value)} 
                  className="input input-bordered w-full my-2"
                />
                <input 
                  type="date" 
                  value={creditDate} 
                  onChange={(e) => setCreditDate(e.target.value)} 
                  className="input input-bordered w-full my-2"
                />
                <input 
                  type="text" 
                  placeholder="Notes" 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  className="input input-bordered w-full my-2"
                />
                <button className="btn bg-green-500 text-white" onClick={handleAddCredit}>Submit</button>
                <button className="btn bg-red-500 text-white" onClick={() => setIsCreditFormOpen(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditManagement;
