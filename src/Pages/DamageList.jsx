import React, { useState } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { Link } from 'react-router-dom';
import { Plus, Trash2, CheckSquare } from 'lucide-react'; 
import { v4 as uuidv4 } from 'uuid';

const DamageList = () => {
  const context = useAppContext();
  
  // Context Data
  const damages = context.damageContext.damages || [];
  const updateDamage = context.damageContext.edit;
  const deleteDamage = context.damageContext.delete;
  const products = context.productContext.products; 
  const updateProduct = context.productContext.edit;
  const units = context.unitContext.units; // Units for display names
  
  const suppliers = context.peopleContext.people; 
  const addTransaction = context.creditManagementContext.add; 

  // Modal State
  const [selectedDamage, setSelectedDamage] = useState(null); 
  const [resolutionType, setResolutionType] = useState("refund");
  const [resolutionNote, setResolutionNote] = useState("");
  
  const [refundSupplierId, setRefundSupplierId] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);

  // --- HELPER: Display Unit Smartly (Ctn/Pcs) ---
  const formatDisplayQty = (productId, qty) => {
      const product = products.find(p => p.id === productId);
      if (!product) return qty;

      const quantity = Number(qty);
      const hasSecondary = product.secondaryUnitId && product.conversionRate > 1;
      
      if (hasSecondary) {
          const convRate = Number(product.conversionRate);
          const cartons = Math.floor(quantity / convRate);
          const loose = quantity % convRate;
          
          const secUnitName = units.find(u => u.id === product.secondaryUnitId)?.name || 'Ctn';
          const baseUnitName = units.find(u => u.id === product.unitId)?.name || 'Pcs';

          if (cartons > 0 && loose > 0) return `${cartons} ${secUnitName}, ${loose} ${baseUnitName}`;
          if (cartons > 0 && loose === 0) return `${cartons} ${secUnitName}`;
          return `${quantity} ${baseUnitName}`;
      }
      
      const baseName = units.find(u => u.id === product.unitId)?.name || '';
      return `${quantity} ${baseName}`;
  };

  // --- DELETE LOGIC ---
  const handleDelete = async (dmg) => {
    if (!window.confirm("Are you sure you want to delete this damage record?")) return;

    // Logic: If status is 'Pending', stock was deducted but issue not resolved.
    // Deleting means "Oops, mistake", so restore stock.
    if (dmg.status === 'Pending') {
        const product = products.find(p => p.id === dmg.productId);
        if (product) {
            const updatedBatchCode = product.batchCode.map(b => {
                if(b.batchCode === dmg.batchCode) {
                    return { ...b, quantity: Number(b.quantity) + Number(dmg.quantity) };
                }
                return b;
            });
            await updateProduct(product.id, { ...product, batchCode: updatedBatchCode });
            alert("Record deleted and Stock restored.");
        } else {
            alert("Record deleted (Product not found, stock not restored).");
        }
    } else {
        alert("Resolved record deleted from history.");
    }

    await deleteDamage(dmg.id);
  };

  // --- RESOLUTION LOGIC ---
  const handleResolve = async () => {
    if(!selectedDamage) return;

    let finalStatus = 'Resolved';
    let details = resolutionNote;

    // 1. Refund (Supplier pays back / Adjusts ledger)
    if (resolutionType === 'refund') {
        if (!refundSupplierId) return alert("Please select the Supplier.");
        if (refundAmount <= 0) return alert("Please enter valid refund amount.");

        const transactionRecord = {
            id: uuidv4(),
            personId: refundSupplierId,
            date: new Date().toISOString(),
            amount: Number(refundAmount),
            type: 'payment', // Treating as Payment Received (Reduces Payable)
            note: `Damage Refund: ${selectedDamage.productName} (Qty: ${selectedDamage.quantity})`,
            refNo: selectedDamage.refNo
        };
        
        await addTransaction(transactionRecord);
        
        const supplierName = suppliers.find(s => s.id === refundSupplierId)?.name;
        details += ` (Refund of ${refundAmount} from ${supplierName})`;
    } 
    
    // 2. Replacement (Supplier sends fresh stock)
    else if (resolutionType === 'replace') {
        const product = products.find(p => p.id === selectedDamage.productId);
        if (product) {
            const updatedBatchCode = product.batchCode.map(b => {
                if(b.batchCode === selectedDamage.batchCode) {
                    return { ...b, quantity: Number(b.quantity) + Number(selectedDamage.quantity) };
                }
                return b;
            });
            await updateProduct(product.id, { ...product, batchCode: updatedBatchCode });
            details += " (Stock Re-added via Replacement)";
        }
    } 
    
    // 3. Loss (Business Loss)
    else if (resolutionType === 'loss') {
        details += " (Written Off as Total Loss)";
    }

    await updateDamage(selectedDamage.id, {
        ...selectedDamage,
        status: finalStatus,
        resolution: resolutionType,
        resolutionNote: details,
        resolvedDate: new Date().toISOString()
    });

    setSelectedDamage(null);
    setResolutionNote("");
    setRefundSupplierId("");
    setRefundAmount(0);
};

  const openModal = (dmg) => {
      setSelectedDamage(dmg);
      setResolutionType('refund');
      // Auto-calculate cost value for refund
      const estimatedValue = (Number(dmg.purchasePrice || 0) * Number(dmg.quantity || 0));
      setRefundAmount(estimatedValue); 
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-red-800 flex items-center gap-2">
            <span className="bg-red-100 p-2 rounded-lg">⚠️</span> Damage / Loss
        </h1>
        <Link to="/damage/add">
            <button className="btn btn-error gap-2 text-white shadow-lg"><Plus className="w-4 h-4" /> Report New Damage</button>
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200 h-[75vh]">
        <table className="table w-full table-pin-rows">
            <thead className="bg-gray-100 text-gray-700">
                <tr>
                    <th>Date / Ref</th>
                    <th>Product</th>
                    <th>Qty (Unit)</th>
                    <th>Loss Value</th>
                    <th>Status</th>
                    <th>Resolution</th>
                    <th className="text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
                {damages.map(dmg => (
                    <tr key={dmg.id} className="hover:bg-gray-50 transition-colors">
                        <td>
                            <div className="font-bold text-gray-700">{new Date(dmg.date).toLocaleDateString()}</div>
                            <div className="font-mono text-xs text-gray-400">{dmg.refNo}</div>
                        </td>
                        <td>
                            <div className="font-bold text-gray-800">{dmg.productName}</div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">Batch: {dmg.batchCode}</div>
                        </td>
                        <td>
                            {/* SMART UNIT DISPLAY */}
                            <div className="font-bold text-blue-700">
                                {formatDisplayQty(dmg.productId, dmg.quantity)}
                            </div>
                        </td>
                        <td className="font-mono font-bold text-red-600">
                            {Number(dmg.purchasePrice || 0) * Number(dmg.quantity || 0)}
                        </td>
                        <td>
                            <span className={`badge ${dmg.status === 'Pending' ? 'badge-warning text-white' : 'badge-success text-white'} font-bold`}>
                                {dmg.status}
                            </span>
                        </td>
                        <td className="text-sm max-w-xs">
                            {dmg.resolution ? (
                                <div className="flex flex-col">
                                    <span className={`uppercase font-bold text-[10px] px-1 rounded w-fit ${
                                        dmg.resolution === 'loss' ? 'bg-red-100 text-red-700' : 
                                        dmg.resolution === 'refund' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {dmg.resolution}
                                    </span>
                                    <span className="text-xs text-gray-500 truncate block mt-1" title={dmg.resolutionNote}>
                                        {dmg.resolutionNote}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-gray-300 text-xs italic">-- Pending --</span>
                            )}
                        </td>
                        <td>
                            <div className="flex items-center justify-center gap-2">
                                {dmg.status === 'Pending' && (
                                    <button 
                                        className="btn btn-xs btn-outline btn-primary gap-1"
                                        onClick={() => openModal(dmg)}
                                        title="Resolve Issue"
                                    >
                                        <CheckSquare className="w-3 h-3" /> Resolve
                                    </button>
                                )}
                                <button 
                                    className="btn btn-xs btn-ghost text-red-400 hover:bg-red-50 hover:text-red-600"
                                    onClick={() => handleDelete(dmg)}
                                    title="Delete Record"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                {damages.length === 0 && (
                    <tr>
                        <td colSpan="7" className="text-center py-10 text-gray-400 bg-gray-50">
                            <div className="flex flex-col items-center">
                                <span className="text-4xl mb-2">📦</span>
                                No damage records found.
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* --- RESOLUTION MODAL --- */}
      {selectedDamage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all scale-100">
                <h3 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800">Resolve Damage</h3>
                
                <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 flex justify-between">
                        <span>Product:</span> <span className="font-bold text-gray-800">{selectedDamage.productName}</span>
                    </p>
                    <p className="text-sm text-gray-600 flex justify-between mt-1">
                        <span>Loss Value:</span> <span className="font-bold text-red-600">Rs. {(Number(selectedDamage.purchasePrice) * Number(selectedDamage.quantity)).toFixed(2)}</span>
                    </p>
                </div>

                <div className="form-control mb-4">
                    <label className="label font-bold text-sm text-gray-700">Action Taken</label>
                    <select 
                        className="select select-bordered w-full bg-white"
                        value={resolutionType}
                        onChange={(e) => setResolutionType(e.target.value)}
                    >
                        <option value="refund">💰 Refund (Supplier pays back)</option>
                        <option value="replace">📦 Replacement (Stock received)</option>
                        <option value="loss">🔥 Total Loss (Write Off)</option>
                    </select>
                </div>

                {/* DYNAMIC FIELDS BASED ON SELECTION */}
                {resolutionType === 'refund' && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200 animate-fadeIn">
                        <div className="form-control mb-2">
                            <label className="label text-xs font-bold uppercase text-blue-800">Select Dealer (For Ledger)</label>
                            <select 
                                className="select select-bordered select-sm w-full bg-white"
                                value={refundSupplierId}
                                onChange={(e) => setRefundSupplierId(e.target.value)}
                            >
                                <option value="">-- Select Supplier --</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label text-xs font-bold uppercase text-blue-800">Refund Amount</label>
                            <input 
                                type="number" 
                                className="input input-bordered input-sm w-full"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className="form-control mb-6">
                    <label className="label font-bold text-sm text-gray-700">Notes / Remarks</label>
                    <textarea 
                        className="textarea textarea-bordered h-24" 
                        placeholder="Enter details about resolution..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                    ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                    <button className="btn flex-1 btn-outline" onClick={() => setSelectedDamage(null)}>Cancel</button>
                    <button className="btn flex-1 btn-primary" onClick={handleResolve}>Confirm Resolution</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default DamageList;

