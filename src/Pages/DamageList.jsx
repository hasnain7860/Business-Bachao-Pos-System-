import React, { useState } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle, XCircle, ArrowRightLeft, Trash2 } from 'lucide-react'; // Switched to Lucide for consistency
import { v4 as uuidv4 } from 'uuid';

const DamageList = () => {
  const context = useAppContext();
  
  // Context Data
  const damages = context.damageContext.damages || [];
  const updateDamage = context.damageContext.edit;
  const deleteDamage = context.damageContext.delete; // Needed for delete
  const products = context.productContext.products; 
  const updateProduct = context.productContext.edit;
  
  const suppliers = context.peopleContext.people; 
  const addTransaction = context.creditManagementContext.add; 

  // Modal State
  const [selectedDamage, setSelectedDamage] = useState(null); 
  const [resolutionType, setResolutionType] = useState("refund");
  const [resolutionNote, setResolutionNote] = useState("");
  
  const [refundSupplierId, setRefundSupplierId] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);

  // --- DELETE LOGIC ---
  const handleDelete = async (dmg) => {
    if (!window.confirm("Are you sure you want to delete this damage record?")) return;

    // Logic: If status is 'Pending', it means we deducted stock but haven't resolved it.
    // Deleting it implies it was a mistake, so we should ADD STOCK BACK.
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
            alert("Record deleted and Stock restored successfully.");
        } else {
            alert("Record deleted. Product not found, so stock was not restored.");
        }
    } else {
        // If Resolved, stock/money was already handled. Just remove the record.
        alert("Resolved record deleted from history.");
    }

    await deleteDamage(dmg.id);
  };

  // --- RESOLUTION LOGIC ---
  const handleResolve = async () => {
    if(!selectedDamage) return;

    let finalStatus = 'Resolved';
    let details = resolutionNote;

    // Case 1: Refund
    if (resolutionType === 'refund') {
        if (!refundSupplierId) return alert("Please select the Supplier who provided the refund.");
        if (refundAmount <= 0) return alert("Please enter a valid refund amount.");

        const transactionRecord = {
            id: uuidv4(),
            personId: refundSupplierId,
            date: new Date().toISOString(),
            amount: Number(refundAmount),
            type: 'payment', 
            remarks: `Damage Refund: ${selectedDamage.productName} (Qty: ${selectedDamage.quantity})`,
            refNo: selectedDamage.refNo
        };
        
        await addTransaction(transactionRecord);
        
        const supplierName = suppliers.find(s => s.id === refundSupplierId)?.name;
        details += ` (Refund of ${refundAmount} from ${supplierName})`;
    } 
    
    // Case 2: Replacement
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
    
    // Case 3: Loss
    else if (resolutionType === 'loss') {
        details += " (Written Off as Business Loss)";
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
      const estimatedValue = (Number(dmg.purchasePrice || 0) * Number(dmg.quantity || 0));
      setRefundAmount(estimatedValue); 
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-red-700">Damage / Loss Management</h1>
        <Link to="/damage/add">
            <button className="btn btn-error gap-2 text-white"><Plus className="w-4 h-4" /> Report New Damage</button>
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow h-[75vh]">
        <table className="table w-full">
            <thead className="bg-gray-100 sticky top-0">
                <tr>
                    <th>Date</th>
                    <th>Ref</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Cost Value</th>
                    <th>Status</th>
                    <th>Resolution</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {damages.map(dmg => (
                    <tr key={dmg.id}>
                        <td>{new Date(dmg.date).toLocaleDateString()}</td>
                        <td className="font-mono text-xs">{dmg.refNo}</td>
                        <td>
                            <div className="font-bold">{dmg.productName}</div>
                            <div className="text-xs text-gray-500">Batch: {dmg.batchCode}</div>
                        </td>
                        <td className="font-bold text-red-600">{dmg.quantity}</td>
                        <td>{Number(dmg.purchasePrice || 0) * Number(dmg.quantity || 0)}</td>
                        <td>
                            <span className={`badge ${dmg.status === 'Pending' ? 'badge-warning' : 'badge-success'}`}>
                                {dmg.status}
                            </span>
                        </td>
                        <td className="text-sm max-w-xs">
                            {dmg.resolution ? (
                                <div className="flex flex-col">
                                    <span className="uppercase font-bold text-xs text-gray-700">{dmg.resolution}</span>
                                    <span className="text-xs text-gray-500 truncate" title={dmg.resolutionNote}>{dmg.resolutionNote}</span>
                                </div>
                            ) : '-'}
                        </td>
                        <td>
                            <div className="flex items-center gap-2">
                                {dmg.status === 'Pending' && (
                                    <button 
                                        className="btn btn-xs btn-outline btn-primary"
                                        onClick={() => openModal(dmg)}
                                    >
                                        Resolve
                                    </button>
                                )}
                                {/* DELETE BUTTON */}
                                <button 
                                    className="btn btn-xs btn-ghost text-red-500 hover:bg-red-50"
                                    onClick={() => handleDelete(dmg)}
                                    title="Delete Record"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                {damages.length === 0 && <tr><td colSpan="8" className="text-center py-4">No damage records found.</td></tr>}
            </tbody>
        </table>
      </div>

      {/* --- RESOLUTION MODAL --- */}
      {selectedDamage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Resolve Damage</h3>
                
                <div className="mb-4">
                    <p className="text-sm text-gray-600">Product: <span className="font-bold text-gray-800">{selectedDamage.productName}</span></p>
                    <p className="text-sm text-gray-600">Loss Value: <span className="font-bold text-red-600">Rs. {(Number(selectedDamage.purchasePrice) * Number(selectedDamage.quantity)).toFixed(2)}</span></p>
                </div>

                <div className="form-control mb-4">
                    <label className="label font-bold">Action Taken</label>
                    <select 
                        className="select select-bordered w-full"
                        value={resolutionType}
                        onChange={(e) => setResolutionType(e.target.value)}
                    >
                        <option value="refund">Refund (Dealer pays back)</option>
                        <option value="replace">Replacement (Stock received)</option>
                        <option value="loss">Total Loss (Write Off)</option>
                    </select>
                </div>

                {resolutionType === 'refund' && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200 animate-fade-in-down">
                        <div className="form-control mb-2">
                            <label className="label text-xs font-bold uppercase text-blue-800">Select Dealer (For Ledger)</label>
                            <select 
                                className="select select-bordered select-sm w-full"
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

                <div className="form-control mb-4">
                    <label className="label font-bold">Notes / Remarks</label>
                    <textarea 
                        className="textarea textarea-bordered" 
                        placeholder="Details..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                    ></textarea>
                </div>

                <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
                    <button className="btn btn-ghost" onClick={() => setSelectedDamage(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleResolve}>Confirm Resolution</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default DamageList;