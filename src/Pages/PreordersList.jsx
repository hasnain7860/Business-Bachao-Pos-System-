import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../Appfullcontext';
import languageData from "../assets/languageData.json";

// Helper function to get status color
const getStatusBadgeColor = (status) => {
    switch (status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        case 'Delivered': return 'bg-green-100 text-green-800';
        case 'Cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const PreordersList = () => {
    const navigate = useNavigate();
    const { preordersContext, peopleContext, areasContext, language } = useAppContext();

    // --- CRITICAL FIX: Universal Store Mapping ---
    // 1. 'preorders' -> 'data'
    // 2. 'delete' -> 'remove'
    // 3. 'people' -> 'data'
    // 4. 'areas' -> 'data'
    const { data: preordersData, edit: editPreorder, remove: deletePreorder } = preordersContext;
    
    // Safety Checks
    const preorders = preordersData || [];
    const people = peopleContext.data || [];
    const areas = areasContext.data || [];

    // Filters State
    const [filterArea, setFilterArea] = useState('');
    const [filterStatus, setFilterStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState('');

    const [errorMessage, setErrorMessage] = useState('');

    const getPersonName = (id) => people.find(p => p.id === id)?.name || 'N/A';
    const getAreaName = (id) => areas.find(a => a.id === id)?.name || 'N/A';

    const filteredPreorders = useMemo(() => {
        return preorders
            .filter(p => filterStatus ? p.status === filterStatus : true)
            .filter(p => filterArea ? p.areaId === filterArea : true)
            .filter(p => {
                if (!searchQuery) return true;
                const personName = getPersonName(p.personId).toLowerCase();
                const refNo = (p.preorderRefNo || "").toLowerCase();
                return personName.includes(searchQuery.toLowerCase()) || refNo.includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => new Date(b.preorderDate) - new Date(a.preorderDate));
    }, [preorders, filterArea, filterStatus, searchQuery, people]);

    // Action Handlers
    const handleConvertToSale = (preorder) => {
        navigate('/sales/new', { state: { preorderData: preorder } });
    };

    const handleEditPreorder = (preorder) => {
        navigate(`/preorders/edit/${preorder.id}`);
    };

    const handleCancelPreorder = async (preorder) => {
        if (window.confirm("Are you sure you want to cancel this preorder?")) {
            await editPreorder(preorder.id, { ...preorder, status: 'Cancelled' });
        }
    };
    
    const handleDeletePreorder = async (preorder) => {
        setErrorMessage(''); 
        // Adding a basic safety confirm because accidental deletions are bad UX
        if(window.confirm(languageData[language].areYouSureDelete || "Delete this preorder permanently?")) {
            await deletePreorder(preorder.id);
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{languageData[language].preorder_list || 'Preorder List'}</h1>
                <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/preorders/new')}
                >
                    + {languageData[language].new_preorder}
                </button>
            </div>

            {errorMessage && (
                <div className="alert alert-error shadow-lg mb-4">
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                    type="text"
                    placeholder={languageData[language].search_placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input input-bordered w-full"
                />
                <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="select select-bordered w-full">
                    <option value="">{languageData[language].all_areas}</option>
                    {areas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select select-bordered w-full">
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>

            {/* Preorders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPreorders.map(preorder => (
                    <div key={preorder.id} className="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <span className="font-bold text-primary text-lg">{preorder.preorderRefNo}</span>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(preorder.status)}`}>
                                    {preorder.status}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800">{getPersonName(preorder.personId)}</h3>
                            <p className="text-gray-500">{getAreaName(preorder.areaId)}</p>
                            <p className="text-sm text-gray-400 mt-1">{new Date(preorder.preorderDate).toLocaleString()}</p>
                            <div className="divider my-3"></div>
                            <div className="text-right">
                                <span className="text-gray-600">Total Bill: </span>
                                <span className="font-bold text-2xl text-gray-900">Rs. {preorder.totalBill}</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                            <button 
                                className="btn btn-success flex-1"
                                onClick={() => handleConvertToSale(preorder)}
                                disabled={preorder.status !== 'Pending'}
                            >
                                Convert to Sale
                            </button>
                            <div className="dropdown dropdown-top dropdown-end">
                                <label tabIndex={0} className="btn btn-ghost">⋮</label>
                                <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                                    <li><button onClick={() => navigate(`/preorders/view/${preorder.id}`)}>View Details</button></li>
                                    <li>
                                        <button 
                                            onClick={() => handleEditPreorder(preorder)} 
                                            disabled={preorder.status !== 'Pending'}
                                        >
                                            Edit Preorder
                                        </button>
                                    </li>
                                    <li><button onClick={() => handleCancelPreorder(preorder)} disabled={preorder.status !== 'Pending'}>Cancel Preorder</button></li>
                                    <li><button onClick={() => handleDeletePreorder(preorder)} className="text-red-500">Delete</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {filteredPreorders.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No preorders found with the selected filters.</p>
                </div>
            )}
        </div>
    );
};

export default PreordersList;

