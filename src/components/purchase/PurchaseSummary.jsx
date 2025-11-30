import React from 'react';
import { FaCalculator, FaSave } from 'react-icons/fa';

const PurchaseSummary = ({ totalBill, credit, paidAmount, paymentMode, onPaymentChange, onModeChange, onSave, isEditMode }) => {
    return (
        <div className="bg-white rounded-lg p-6 shadow-lg lg:sticky lg:top-4 border-t-4 border-blue-600">
            <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2"><FaCalculator/> {isEditMode ? 'Update Bill' : 'Bill Summary'}</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase">Payment Mode</label>
                    <select value={paymentMode} onChange={(e) => onModeChange(e.target.value)} className="select select-bordered w-full mt-1">
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank Transfer</option>
                    </select>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Total Bill</span>
                        <span className="text-xl font-bold text-blue-600">₨ {totalBill?.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Credit</span>
                        <span className="text-lg font-bold text-red-500">₨ {credit?.toFixed(0)}</span>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase">Amount Paid</label>
                    <input 
                        type="number" 
                        value={paidAmount === 0 ? '' : paidAmount} 
                        onChange={(e) => onPaymentChange(e.target.value)} 
                        className="input input-bordered input-primary w-full text-lg font-bold mt-1"
                        placeholder="0"
                    />
                </div>
            </div>

            <button onClick={onSave} className={`btn w-full mt-6 text-lg font-bold shadow-lg gap-2 ${isEditMode ? 'btn-warning' : 'btn-primary'}`}>
                <FaSave /> {isEditMode ? 'Update Purchase' : 'Save Purchase'}
            </button>
        </div>
    );
};

export default PurchaseSummary;

