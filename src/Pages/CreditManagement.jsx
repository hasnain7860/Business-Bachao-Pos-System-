import React, { useState, useMemo } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { FaPlus, FaTimes, FaEdit, FaTrash, FaArrowLeft, FaPrint } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from "uuid";
import languageData from "../assets/languageData.json";

const CreditManagement = () => {
  const context = useAppContext();
  const { language } = context;
  const navigate = useNavigate();
  const t = languageData[language];

  // --- Context Data ---
  const peoples = context.peopleContext.people;
  const salesData = context.SaleContext.Sales || [];
  const purchasesData = context.purchaseContext.purchases || [];
  const sellReturns = context.SellReturnContext.sellReturns || [];
  const purchaseReturns = context.purchaseReturnContext?.purchaseReturns || [];
  
  // --- Manual Records Actions ---
  const submittedRecords = context.creditManagementContext.submittedRecords;
  const addRecords = context.creditManagementContext.add;
  const editRecords = context.creditManagementContext.edit;
  const deleteRecords = context.creditManagementContext.delete;

  // --- States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeople, setSelectedPeople] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [formType, setFormType] = useState(""); // 'credit' or 'payment'
  const [editingRecordId, setEditingRecordId] = useState(null);
  
  const [formData, setFormData] = useState({
    id: "",
    date: new Date().toISOString().substring(0, 10),
    amount: "",
    note: "",
  });

  // --- UPDATED: Search Filter (Supports Name & Code) ---
  const filteredPeoples = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return peoples.filter((person) => {
      const nameMatch = person.name.toLowerCase().includes(term);
      // Check Code Match (Raw number OR "P-Number" format)
      const codeMatch = person.code 
        ? person.code.toString().includes(term) || `p-${person.code}`.includes(term)
        : false;
      
      return nameMatch || codeMatch;
    });
  }, [searchTerm, peoples]);

  const handlePeopleSelect = (people) => {
    setSelectedPeople(people);
    setSearchTerm("");
  };

  // --- CRUD Handlers ---

  const handleClosePopup = () => {
    setShowPopup(false);
    setEditingRecordId(null);
    setFormData({
      id: "",
      date: new Date().toISOString().substring(0, 10),
      amount: "",
      note: "",
    });
  };

  const handleEdit = (record) => {
    setEditingRecordId(record.id);
    setFormType(record.type);
    setFormData({ ...record });
    setShowPopup(true);
  };

  const handleDelete = (recordId) => {
    if (window.confirm("Are you sure you want to delete this record? This will affect the balance.")) {
      deleteRecords(recordId);
    }
  };

  const handleSubmit = () => {
    if (!formData.amount) return alert("Amount is required");

    const recordData = {
      id: editingRecordId || uuidv4(),
      personId: selectedPeople.id,
      type: formType,
      amount: parseFloat(formData.amount),
      date: formData.date,
      note: formData.note,
    };

    if (editingRecordId) {
      editRecords(recordData.id, recordData);
    } else {
      addRecords(recordData);
    }
    
    handleClosePopup();
  };

  // --- CALCULATIONS ---
  
  // 1. SALES SIDE
  const salesSummary = useMemo(() => {
     if(!selectedPeople) return { totalBill: 0, paid: 0, credit: 0 };
     const personSales = salesData.filter(s => s.personId === selectedPeople.id);
     return {
        totalBill: personSales.reduce((acc, s) => acc + Number(s.totalBill), 0),
        paid: personSales.reduce((acc, s) => acc + Number(s.amountPaid), 0),
        credit: personSales.reduce((acc, s) => acc + Number(s.credit), 0)
     };
  }, [salesData, selectedPeople]);

  // 2. PURCHASE SIDE
  const purchaseSummary = useMemo(() => {
     if(!selectedPeople) return { totalBill: 0, paid: 0, credit: 0 };
     const personPurchases = purchasesData.filter(p => p.personId === selectedPeople.id);
     return {
        totalBill: personPurchases.reduce((acc, p) => acc + Number(p.totalBill), 0),
        paid: personPurchases.reduce((acc, p) => acc + Number(p.totalPayment), 0),
        credit: personPurchases.reduce((acc, p) => acc + Number(p.credit), 0)
     };
  }, [purchasesData, selectedPeople]);

  // 3. RETURNS
  const returnSummary = useMemo(() => {
     if(!selectedPeople) return { salesReturnAdj: 0, purchaseReturnAdj: 0 };
     
     const salesRet = sellReturns
        .filter(r => r.peopleId === selectedPeople.id)
        .reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);
     
     const purchRet = purchaseReturns
        .filter(r => r.peopleId === selectedPeople.id || r.people === selectedPeople.id)
        .reduce((acc, r) => acc + (r.paymentDetails?.creditAdjustment || 0), 0);

     return { salesReturnAdj: salesRet, purchaseReturnAdj: purchRet };
  }, [sellReturns, purchaseReturns, selectedPeople]);

  // 4. MANUAL RECORDS
  const manualSummary = useMemo(() => {
    if(!selectedPeople) return { credit: 0, payment: 0 };
    const records = submittedRecords.filter(r => r.personId === selectedPeople.id);
    return {
        credit: records.filter(r => r.type === 'credit').reduce((acc, r) => acc + Number(r.amount), 0),
        payment: records.filter(r => r.type === 'payment').reduce((acc, r) => acc + Number(r.amount), 0)
    };
  }, [submittedRecords, selectedPeople]);


  // --- NET BALANCE ---
  const totalReceivablePlus = salesSummary.credit + manualSummary.credit + returnSummary.purchaseReturnAdj;
  const totalPayableMinus = purchaseSummary.credit + manualSummary.payment + returnSummary.salesReturnAdj;
  const netBalance = totalReceivablePlus - totalPayableMinus;

  const isDebtor = netBalance >= 0;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-sm btn-ghost gap-2">
            <FaArrowLeft /> {languageData[language].back}
        </button>
        <h1 className="text-xl font-bold text-blue-700 uppercase tracking-wide">{t.creditManagement}</h1>
      </div>

      {/* SEARCH OR DETAILS */}
      {!selectedPeople ? (
        <div className="max-w-md mx-auto mt-10">
          <label className="label text-gray-600 font-semibold">{t.searchCustomer}</label>
          <div className="relative">
            {/* Search Input updated placeholder */}
            <input
              type="text"
              placeholder={`${t.searchCustomer} / Code (e.g. 1001)...`}
              className="input input-bordered w-full shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {filteredPeoples.length > 0 && (
              <div className="absolute z-10 bg-white border rounded shadow-xl w-full mt-1 max-h-60 overflow-y-auto">
                {filteredPeoples.map((people) => (
                  <div
                    key={people.id}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handlePeopleSelect(people)}
                  >
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">{people.name}</span>
                        {/* Display Code in Dropdown */}
                        {people.code && <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">P-{people.code}</span>}
                    </div>
                    <span className="text-xs text-gray-500 block mt-1">{people.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            
            {/* PROFILE HEADER */}
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">{selectedPeople.name}</h2>
                    {selectedPeople.code && <span className="text-sm opacity-80 font-mono">ID: P-{selectedPeople.code}</span>}
                </div>
                <button className="btn btn-sm btn-circle btn-ghost bg-white/20 hover:bg-white/40 border-0" onClick={() => setSelectedPeople(null)}>
                    <FaTimes />
                </button>
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT COL: HISTORY TABLES */}
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    
                    {/* 1. SALES HISTORY */}
                    {salesSummary.totalBill > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 p-2 font-bold text-gray-700 flex justify-between">
                                <span>{t.salesData}</span>
                                <span className="text-blue-600">Total Credit: {salesSummary.credit}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table table-compact w-full min-w-[300px]">
                                    <thead>
                                        <tr>
                                            <th>Ref</th>
                                            <th>Credit</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesData.filter(s => s.personId === selectedPeople.id).map(s => (
                                            <tr key={s.id} className={s.credit > 0 ? "bg-red-50" : ""}>
                                                <td>{s.salesRefNo}</td>
                                                <td className="font-bold text-red-600">{s.credit}</td>
                                                <td>{new Date(s.dateTime).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 2. PURCHASE HISTORY */}
                    {purchaseSummary.totalBill > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 p-2 font-bold text-gray-700 flex justify-between">
                                <span>{t.purchaseData}</span>
                                <span className="text-orange-600">Total Payable: {purchaseSummary.credit}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table table-compact w-full min-w-[300px]">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchasesData.filter(p => p.personId === selectedPeople.id).map(p => (
                                            <tr key={p.id} className={p.credit > 0 ? "bg-orange-50" : ""}>
                                                <td>{new Date(p.date).toLocaleDateString()}</td>
                                                <td className="font-bold text-orange-600">{p.credit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 3. SALES RETURNS HISTORY */}
                    {sellReturns.filter(r => r.peopleId === selectedPeople.id).length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-red-50 p-2 font-bold text-red-800 border-b border-red-100">
                                Sales Returns (Customer Wapsi)
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table table-compact w-full min-w-[300px]">
                                    <thead>
                                        <tr>
                                            <th>Ref</th>
                                            <th>Amount</th>
                                            <th>Credit Adj</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sellReturns.filter(r => r.peopleId === selectedPeople.id).map(ret => (
                                            <tr key={ret.id}>
                                                <td>{ret.returnRefNo}</td>
                                                <td>{ret.totalAmount}</td>
                                                <td className="font-bold text-green-600">-{ret.paymentDetails?.creditAdjustment}</td>
                                                <td>{new Date(ret.returnDate).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 4. PURCHASE RETURNS HISTORY */}
                    {purchaseReturns.filter(r => r.peopleId === selectedPeople.id || r.people === selectedPeople.id).length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-blue-50 p-2 font-bold text-blue-800 border-b border-blue-100">
                                Purchase Returns (Hamari Wapsi)
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table table-compact w-full min-w-[300px]">
                                    <thead>
                                        <tr>
                                            <th>Ref</th>
                                            <th>Amount</th>
                                            <th>Liability Less</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchaseReturns
                                            .filter(r => r.peopleId === selectedPeople.id || r.people === selectedPeople.id)
                                            .map(ret => (
                                            <tr key={ret.id}>
                                                <td>{ret.returnRefNo}</td>
                                                <td>{ret.totalAmount}</td>
                                                <td className="font-bold text-blue-600">+{ret.paymentDetails?.creditAdjustment}</td>
                                                <td>{new Date(ret.returnDate).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 5. MANUAL RECORDS */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 p-2 font-bold text-gray-700 flex justify-between items-center">
                            <span>Manual Records (Cash/Old)</span>
                            <button onClick={() => { setFormType('credit'); setShowPopup(true); }} className="btn btn-xs btn-outline btn-primary">+ Add</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="table table-compact w-full min-w-[400px]">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th className="w-16">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submittedRecords.filter(r => r.personId === selectedPeople.id).map(r => (
                                        <tr key={r.id}>
                                            <td>
                                                <span className={`badge ${r.type === 'credit' ? 'badge-error' : 'badge-success'} badge-sm`}>
                                                    {r.type === 'credit' ? 'Credit' : 'Pay'}
                                                </span>
                                            </td>
                                            <td className="font-bold">{r.amount}</td>
                                            <td>{new Date(r.date).toLocaleDateString()}</td>
                                            <td>
                                                <div className="flex gap-3">
                                                    <button onClick={() => handleEdit(r)} className="text-blue-500 hover:text-blue-700">
                                                        <FaEdit size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700">
                                                        <FaTrash size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {submittedRecords.filter(r => r.personId === selectedPeople.id).length === 0 && (
                                        <tr><td colSpan="4" className="text-center text-gray-400">No manual records found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COL: FINAL SUMMARY */}
                <div className="bg-gray-50 rounded-xl p-6 h-fit border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Financial Summary</h3>
                    
                    <div className="space-y-3 text-sm">
                        
                        {/* Receivables (Plus) */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-gray-600">
                                <span>Sales Pending Credit:</span>
                                <span>{salesSummary.credit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Manual Credit (Old/Loan):</span>
                                <span>{manualSummary.credit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Purchase Returns (Wapsi):</span>
                                <span>{returnSummary.purchaseReturnAdj.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-blue-700 border-t pt-1">
                                <span>Total Receivable (+):</span>
                                <span>{totalReceivablePlus.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="divider my-2"></div>

                        {/* Payables (Minus) */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-gray-600">
                                <span>Purchase Pending Credit:</span>
                                <span>{purchaseSummary.credit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Manual Payments (Received):</span>
                                <span>{manualSummary.payment.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Sales Returns (Wapsi):</span>
                                <span>{returnSummary.salesReturnAdj.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-red-700 border-t pt-1">
                                <span>Total Deductions (-):</span>
                                <span>{totalPayableMinus.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* NET BALANCE CARD */}
                    <div className={`mt-6 p-4 rounded-lg text-center shadow-md ${isDebtor ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800'} border`}>
                        <h4 className="text-sm font-bold uppercase mb-1">Net Balance Status</h4>
                        <div className="text-3xl font-extrabold">{Math.abs(netBalance).toFixed(2)}</div>
                        <p className="text-sm font-semibold mt-1">
                            {isDebtor ? "You have to Receive (Lene Hain)" : "You have to Pay (Dene Hain)"}
                        </p>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <button
                            className="btn btn-success text-white border-0 shadow"
                            onClick={() => { setFormType("payment"); setShowPopup(true); }}
                        >
                            Receive Cash (Payment)
                        </button>
                        <button
                            className="btn btn-error text-white border-0 shadow"
                            onClick={() => { setFormType("credit"); setShowPopup(true); }}
                        >
                            Give Udhaar (Credit)
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* POPUP MODAL */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100">
            <h3 className="text-xl font-bold mb-4 text-center border-b pb-2">
                {editingRecordId ? 'Edit Record' : `Add ${formType === 'credit' ? 'Credit (+)' : 'Payment (-)'}`}
            </h3>
            
            <div className="form-control mb-3">
                <label className="label-text font-bold mb-1">Date</label>
                <input
                type="date"
                className="input input-bordered w-full"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
            </div>

            <div className="form-control mb-3">
                <label className="label-text font-bold mb-1">Amount</label>
                <input
                type="number"
                placeholder="Enter Amount"
                className="input input-bordered w-full text-lg font-bold"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                autoFocus
                />
            </div>

            <div className="form-control mb-6">
                <label className="label-text font-bold mb-1">Note (Optional)</label>
                <input
                type="text"
                placeholder="Details..."
                className="input input-bordered w-full"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
            </div>

            <div className="flex gap-3">
                <button className="btn btn-outline flex-1" onClick={handleClosePopup}>Cancel</button>
                <button className={`btn flex-1 text-white border-0 ${formType === 'credit' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`} onClick={handleSubmit}>
                    {editingRecordId ? 'Update' : 'Save'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagement;