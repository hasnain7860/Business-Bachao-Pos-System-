import React from 'react';
import languageData from '../../assets/languageData.json';

// <-- ======================================================= -->
// <-- FIX #1: Naye props receive karein -->
// <-- ======================================================= -->
const PreorderSummary = ({
    subtotal,         // Calculated prop from parent
    totalBill,        // Calculated prop from parent
    discount,
    setDiscount,
    notes,
    setNotes,
    onSave,
    language,
    isEditing         // Prop from parent
}) => {
    
    // <-- ======================================================= -->
    // <-- FIX #2: Saari calculation logic DELETE kar di hai -->
    // <-- Yeh component ab sirf data display karta hai -->
    // <-- ======================================================= -->

    return (
        <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-blue-800">
                {languageData[language].preorder_summary}
            </h3>

            {/* Subtotal (ab prop se aa raha hai) */}
            <div className="flex justify-between items-center mb-4 text-gray-700">
                <span className="font-semibold">{languageData[language].subtotal}:</span>
                <span className="font-bold">Rs. {subtotal.toFixed(2)}</span>
            </div>

            {/* Discount Input */}
            <div className="mb-4">
                <label className="text-sm font-semibold text-gray-600 mb-2 block">
                    {languageData[language].discount} (Rs.):
                </label>
                <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                    className="input input-bordered w-full text-lg font-semibold"
                    placeholder="0"
                />
            </div>
            
            {/* Final Total (ab prop se aa raha hai) */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg mb-4 shadow-md">
                <label className="text-white text-sm font-semibold block mb-1">
                    {languageData[language].estimated_total}:
                </label>
                <div className="text-3xl font-bold text-white">
                    Rs. {totalBill.toFixed(2)}
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">{languageData[language].notes}</label>
                <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="textarea textarea-bordered w-full"
                    placeholder="Any special instructions...">
                </textarea>
            </div>

            {/* <-- ======================================================= -->
            {/* <-- FIX #3: Button text ko dynamic banayein -->
            {/* <-- ======================================================= --> */}
            <button onClick={onSave} className="btn btn-primary w-full mt-6">
                {isEditing 
                    ? (languageData[language].update_preorder || 'Update Preorder') 
                    : (languageData[language].save_preorder || 'Save Preorder')
                }
            </button>
        </div>
    );
};

export default PreorderSummary;

