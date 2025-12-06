import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext';
import { FaPrint, FaFilter, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave } from 'react-icons/fa';

const DailyReceivedReport = () => {
    const { 
        peopleContext, 
        areasContext, 
        creditManagementContext, 
        language 
    } = useAppContext();

    // --- STATE ---
    // Default date aaj ki set ki hai
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedAreaId, setSelectedAreaId] = useState('');

    // --- LOGIC: Filter Data ---
    const reportData = useMemo(() => {
        // 1. Safety Checks
        if (!creditManagementContext?.data || !peopleContext?.data) return [];

        const transactions = creditManagementContext.data;
        const people = peopleContext.data;

        // 2. Filter Transactions
        const filtered = transactions.filter(record => {
            // Rule 1: Hamein sirf wo record chahiye jo 'credit' hain (Janhon ne paisa diya)
            if (record.type !== 'credit') return false;

            // Rule 2: Date match honi chahiye
            if (record.date !== selectedDate) return false;

            // Rule 3: Agar Area select hai, to banda us area ka hona chahiye
            if (selectedAreaId) {
                const person = people.find(p => p.id === record.personId);
                if (!person || person.areaId !== selectedAreaId) return false;
            }

            return true;
        });

        // 3. Map Data (Details Jorna)
        return filtered.map(record => {
            const person = people.find(p => p.id === record.personId) || { name: 'Unknown', areaId: '' };
            const area = areasContext?.data?.find(a => a.id === person.areaId) || { name: 'Unknown Area' };

            return {
                ...record,
                personName: person.name,
                code:person.code,
                personPhone: person.phone,
                areaName: area.name
            };
        });

    }, [creditManagementContext.data, peopleContext.data, areasContext.data, selectedDate, selectedAreaId]);

    // Total Calculation
    const totalReceived = reportData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    // --- PRINT HANDLER ---
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg">
            
            {/* --- CONTROLS SECTION (No Print) --- */}
            <div className="bg-white p-4 rounded-t-lg shadow-sm border-b border-gray-200 no-print">
                <div className="flex flex-wrap items-end gap-4">
                    
                    {/* Date Picker */}
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                            <FaCalendarAlt className="text-blue-600"/> Select Date
                        </label>
                        <input 
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-bold"
                        />
                    </div>

                    {/* Area Filter */}
                    <div className="w-full md:w-64">
                        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-green-600"/> Filter by Area
                        </label>
                        <select
                            value={selectedAreaId}
                            onChange={(e) => setSelectedAreaId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">All Areas (Sab Areas)</option>
                            {areasContext?.data?.map(area => (
                                <option key={area.id} value={area.id}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Summary Badge */}
                    <div className="ml-auto bg-green-100 text-green-800 px-4 py-2 rounded-lg border border-green-200">
                        <span className="text-xs font-bold uppercase block">Total Received</span>
                        <span className="text-xl font-bold">{totalReceived.toLocaleString()}</span>
                    </div>

                    {/* Print Button */}
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-gray-800 text-white px-6 py-2 rounded hover:bg-black transition shadow-sm"
                    >
                        <FaPrint /> Print Report
                    </button>
                </div>
            </div>

            {/* --- REPORT TABLE (Printable) --- */}
            <div className="p-6 bg-white min-h-[500px]">
                
                {/* Header */}
                <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-4">
                    <h2 className="text-2xl font-bold uppercase tracking-wide text-gray-800">
                        Daily Received Payment Report
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Report Date: <span className="font-bold text-black">{selectedDate}</span>
                    </p>
                    {selectedAreaId && (
                        <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-xs rounded border border-gray-300">
                            Filtered Area: {areasContext?.data?.find(a => a.id === selectedAreaId)?.name}
                        </span>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-800 text-white uppercase text-xs tracking-wider">
                                <th className="px-4 py-3 border border-gray-700 w-16 text-center">#</th>
                                <th className="px-4 py-3 border border-gray-700">Customer Name</th>
                                <th className="px-4 py-3 border border-gray-700">Area</th>
                                <th className="px-4 py-3 border border-gray-700">Amount Received</th>
                                <th className="px-4 py-3 border border-gray-700 w-1/4">Note / Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                reportData.map((row, index) => (
                                    <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50 text-gray-700">
                                        <td className="px-4 py-3 border-r border-gray-200 text-center font-bold text-gray-500">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="font-bold text-gray-900">{row.personName} {row.code}</div>
                                            <div className="text-xs text-gray-500 font-mono">{row.personPhone}</div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-gray-600">
                                            {row.areaName}
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 font-bold text-green-700 text-base">
                                            {parseInt(row.amount).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-xs italic text-gray-500">
                                            {row.note || '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-gray-400">
                                        <FaMoneyBillWave className="mx-auto text-4xl mb-2 opacity-20"/>
                                        <p>No payments received on <span className="font-bold">{selectedDate}</span> for this selection.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {/* Footer Total */}
                        {reportData.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-100 border-t-2 border-black">
                                    <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-800 uppercase">
                                        Total Collection:
                                    </td>
                                    <td className="px-4 py-3 font-bold text-green-800 text-lg border-l border-gray-300">
                                        {totalReceived.toLocaleString()}
                                    </td>
                                    <td className="bg-gray-100"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-400 no-print">
                    <span>Generated from System</span>
                    <span>{new Date().toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default DailyReceivedReport;

