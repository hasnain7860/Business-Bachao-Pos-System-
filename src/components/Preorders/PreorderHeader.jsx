import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../Appfullcontext';
import languageData from '../../assets/languageData.json';

const PreorderHeader = ({ preorderRefNo, selectedCustomer, setSelectedCustomer, selectedArea, setSelectedArea }) => {
    const navigate = useNavigate();
    const context = useAppContext();
    const { language } = context;

    // --- CRITICAL FIX: Universal Store Mapping ---
    // 1. 'customers' are in 'peopleContext.data'
    // 2. 'areas' are in 'areasContext.data'
    const customers = context.peopleContext.data || [];
    const areas = context.areasContext.data || [];
    
    const [searchTerm, setSearchTerm] = useState("");

    const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

    return (
        <div className="grid md:grid-cols-3 gap-4">
            {/* Preorder Reference */}
            <div className="bg-white rounded-lg p-4 shadow">
                <label className="text-sm font-semibold text-gray-600">{languageData[language].preorder_ref_no || 'Ref No'}</label>
                <input type="text" value={preorderRefNo} readOnly className="input input-bordered w-full bg-gray-50 mt-1" />
            </div>

            {/* Customer Selection */}
            <div className="bg-white rounded-lg p-4 shadow">
                <label className="text-sm font-semibold text-gray-600">{languageData[language].customer_name || 'Customer'}</label>
                 {selectedCustomer ? (
                    <div className="mt-1">
                        <input type="text" value={selectedCustomerData?.name || ''} readOnly className="input input-bordered w-full" />
                        <button type="button" onClick={() => setSelectedCustomer("")} className="btn btn-sm btn-ghost text-red-500 mt-1">
                            {languageData[language].change || 'Change'}
                        </button>
                    </div>
                ) : (
                    <div className="relative w-full mt-1">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={languageData[language].search_placeholder || 'Search...'}
                            className="input input-bordered w-full"
                        />
                        {searchTerm && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {customers
                                    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map(customer => (
                                        <div key={customer.id} className="p-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => {
                                                setSelectedCustomer(customer.id);
                                                if(customer.areaId) setSelectedArea(customer.areaId); // Automatically select customer's area
                                                setSearchTerm("");
                                            }}>
                                            <span>{customer.name}</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Area Selection */}
            <div className="bg-white rounded-lg p-4 shadow">
                <label className="text-sm font-semibold text-gray-600">{languageData[language].area || 'Area'}</label>
                <select 
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="select select-bordered w-full mt-1"
                    required
                >
                    <option value="">{languageData[language].select_area || 'Select Area'}</option>
                    {areas.map(area => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default PreorderHeader;

