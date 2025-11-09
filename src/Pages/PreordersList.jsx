import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../Appfullcontext';
import languageData from "../assets/languageData.json";
// 1. Modal component import karein
import DeleteConfirmationModal from '../components/element/DeleteConfirmationModal.jsx';

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
    const { preordersContext, customersContext, areasContext, language } = useAppContext();
    const { preorders, edit: editPreorder, delete: deletePreorder } = preordersContext;
    const customers = customersContext.customers || [];
    const areas = areasContext.areas || [];

    // Filters State
    const [filterArea, setFilterArea] = useState('');
    const [filterStatus, setFilterStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState('');

    const [modalState, setModalState] = useState({ isOpen: false, deleteId: null });
    const [errorMessage, setErrorMessage] = useState('');

    const getCustomerName = (id) => customers.find(c => c.id === id)?.name || 'N/A';
    const getAreaName = (id) => areas.find(a => a.id === id)?.name || 'N/A';

    const filteredPreorders = useMemo(() => {
        // ... (Filter logic theek hai) ...
        return preorders
            .filter(p => filterStatus ? p.status === filterStatus : true)
            .filter(p => filterArea ? p.areaId === filterArea : true)
            .filter(p => {
                if (!searchQuery) return true;
                const customerName = getCustomerName(p.customerId).toLowerCase();
                const refNo = p.preorderRefNo.toLowerCase();
                return customerName.includes(searchQuery.toLowerCase()) || refNo.includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => new Date(b.preorderDate) - new Date(a.preorderDate));
    }, [preorders, filterArea, filterStatus, searchQuery, customers]);

    // Action Handlers
    const handleConvertToSale = (preorder) => {
        navigate('/sales/new', { state: { preorderData: preorder } });
    };

    // <-- ======================================================= -->
    // <-- FIX #1: Naya 'Edit' function add kiya hai -->
    // <-- ======================================================= -->
    const handleEditPreorder = (preorder) => {
        // Hum user ko naye route par bhej rahe hain
        // Aap ko 'App.jsx' mein yeh route add karna hoga:
        // <Route path="/preorders/edit/:id" element={<NewPreorder />} />
        navigate(`/preorders/edit/${preorder.id}`);
    };

    const handleCancelPreorder = (preorder) => {
        // WARNING: window.confirm() bura UX hai. Ise bhi DeleteConfirmationModal se replace karein.
        if (window.confirm("Are you sure you want to cancel this preorder?")) {
            editPreorder(preorder.id, { ...preorder, status: 'Cancelled' });
        }
    };
    
    const handleDeleteRequest = (preorder) => {
        setErrorMessage(''); 
        if (preorder.status === 'Delivered') {
            setErrorMessage(`Cannot delete "${preorder.preorderRefNo}". It is already linked to a completed sale.`);
            return;
        }
        setModalState({ isOpen: true, deleteId: preorder.id });
    };

    const handleConfirmDelete = () => {
        if (modalState.deleteId) {
            deletePreorder(modalState.deleteId);
        }
        setModalState({ isOpen: false, deleteId: null });
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            {/* ... (Header) ... */}
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

            {/* ... (Filters Section) ... */}
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
                            {/* ... (Card details) ... */}
                            <div className="flex justify-between items-start mb-3">
                                <span className="font-bold text-primary text-lg">{preorder.preorderRefNo}</span>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(preorder.status)}`}>
                                    {preorder.status}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800">{getCustomerName(preorder.customerId)}</h3>
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
                                    {/* <-- ======================================================= --> */}
                                    {/* <-- FIX #2: Naya 'Edit' button add kiya hai --> */}
                                    {/* <-- ======================================================= --> */}
                                    <li>
                                        <button 
                                            onClick={() => handleEditPreorder(preorder)} 
                                            disabled={preorder.status !== 'Pending'}
                                        >
                                            Edit Preorder
                                        </button>
                                    </li>
                                    <li><button onClick={() => handleCancelPreorder(preorder)} disabled={preorder.status !== 'Pending'}>Cancel Preorder</button></li>
                                    <li><button onClick={() => handleDeleteRequest(preorder)} className="text-red-500">Delete</button></li>
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

            <DeleteConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, deleteId: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Preorder"
                message={`Are you sure you want to delete this preorder? This action cannot be undone.`}
            />
        </div>
    );
};

export default PreordersList;


