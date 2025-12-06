import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext';
import { FaPrint, FaFilter } from 'react-icons/fa';
import languageData from '../../assets/languageData.json';

const CustomerCompanyReport = () => {
    const context = useAppContext();
    const { language } = context;

    // --- CRITICAL FIX: Universal Store Mapping ---
    const allSales = context.SaleContext.data || [];
    const allPeoples = context.peopleContext.data || [];
    const allProducts = context.productContext.data || [];
    const allCompanies = context.companyContext.data || []; 
    const allAreas = context.areasContext?.data || []; // Added Areas Context

    const settingsData = context.settingContext.data || [];
    const userAndBusinessDetail = settingsData[0] || {};
    
    const currency = userAndBusinessDetail?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.business?.businessName ?? 'Business Bachao';

    // --- Filters State ---
    const [selectedArea, setSelectedArea] = useState('all'); // New Area State
    const [selectedCustomer, setSelectedCustomer] = useState('all');
    const [selectedCompany, setSelectedCompany] = useState('all');
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    
    const [reportData, setReportData] = useState(null);
    const [showFilters, setShowFilters] = useState(true);

    // --- Memos ---
    
    // Filter Customers based on selected Area (Optional but good UX)
    const customers = useMemo(() => {
        let peoples = [...allPeoples];
        
        // If an area is selected, only show customers from that area in the dropdown
        if (selectedArea !== 'all') {
            peoples = peoples.filter(p => p.areaId === selectedArea);
        }

        return peoples.sort((a,b) => a.name.localeCompare(b.name));
    }, [allPeoples, selectedArea]);

    // Unique Companies
    const uniqueCompanies = useMemo(() => {
        const companyIds = new Set(allProducts.map(p => p.companyId).filter(Boolean));
        
        return Array.from(companyIds).map(id => {
            const company = allCompanies.find(c => c.id === id);
            return company ? { id: company.id, name: company.name } : null;
        })
        .filter(Boolean)
        .sort((a,b) => a.name.localeCompare(b.name));

    }, [allProducts, allCompanies]);

    // Helper: Get Company Name by ID
    const getCompanyName = (companyId) => {
        const company = allCompanies.find(c => c.id === companyId);
        return company ? company.name : (languageData[language]?.not_assigned || 'N/A');
    };

    // --- Report Generation ---
    const handleGenerateReport = () => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // 1. Filter by Date
        let filteredSales = allSales.filter(sale => {
            const saleDate = new Date(sale.dateTime);
            return saleDate >= start && saleDate <= end;
        });

        // 2. Filter by Area (New Logic)
        if (selectedArea !== 'all') {
            filteredSales = filteredSales.filter(sale => {
                const person = allPeoples.find(p => p.id === sale.personId);
                return person && person.areaId === selectedArea;
            });
        }

        // 3. Filter by Specific Customer
        if (selectedCustomer !== 'all') {
            filteredSales = filteredSales.filter(sale => sale.personId === selectedCustomer);
        }

        const finalProductList = [];
        
        filteredSales.forEach(sale => {
            const customer = allPeoples.find(p => p.id === sale.personId);
            const customerName = customer ? customer.name : (languageData[language]?.walking_customer || 'Walking Customer');
            
            // Process each product in sale
            if (sale.products && Array.isArray(sale.products)) {
                sale.products.forEach(productInSale => {
                    
                    // Find original product to get company ID
                    const mainProduct = allProducts.find(p => p.id === productInSale.id);
                    const productCompanyId = mainProduct ? mainProduct.companyId : 'N/A';
                    
                    // 4. Filter by Company
                    if (selectedCompany === 'all' || productCompanyId === selectedCompany) {
                        
                        // Logic for Quantity & Cost
                        const quantity = parseFloat(productInSale.SellQuantity) || 0;
                        
                        // Calculate Revenue
                        let totalSale = 0;
                        if (productInSale.enteredQty && productInSale.newSellPrice) {
                             totalSale = parseFloat(productInSale.enteredQty) * parseFloat(productInSale.newSellPrice);
                        } else {
                             const salePrice = parseFloat(productInSale.newSellPrice || productInSale.sellPrice) || 0;
                             totalSale = quantity * salePrice;
                        }

                        // Calculate Cost
                        const purchasePrice = parseFloat(productInSale.purchasePrice) || 0; 
                        const totalCost = quantity * purchasePrice;
                        
                        const totalProfit = totalSale - totalCost;

                        finalProductList.push({
                            id: productInSale.id,
                            name: productInSale.name,
                            companyId: productCompanyId,
                            companyName: getCompanyName(productCompanyId),
                            customerName: customerName,
                            saleDate: new Date(sale.dateTime).toLocaleDateString(),
                            quantity: quantity,
                            totalSale,
                            totalProfit,
                        });
                    }
                });
            }
        });

        const summary = finalProductList.reduce((acc, item) => {
            acc.totalSale += item.totalSale;
            acc.totalProfit += item.totalProfit;
            acc.totalQuantity += item.quantity;
            return acc;
        }, { totalSale: 0, totalProfit: 0, totalQuantity: 0 });

        setReportData({ data: finalProductList, summary });
        setShowFilters(false);
    };
    
    const handlePrint = () => window.print();

    // Helper for display names
    const areaName = selectedArea === 'all' ? 'All Areas' : allAreas.find(a => a.id === selectedArea)?.name;
    const customerName = selectedCustomer === 'all' ? (languageData[language]?.all_customers || 'All Customers') : customers.find(c => c.id === selectedCustomer)?.name;
    const companyName = selectedCompany === 'all' ? (languageData[language]?.all_companies || 'All Companies') : allCompanies.find(c => c.id === selectedCompany)?.name;

    return (
        <div>
            {/* --- Filters (Hidden on Print) --- */}
            <div className={`no-print p-4 border rounded-lg bg-gray-50 ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language]?.customer_company_report || 'Customer/Company Report'}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    
                    {/* 1. AREA FILTER */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Area</label>
                        <select
                            value={selectedArea}
                            onChange={e => {
                                setSelectedArea(e.target.value);
                                setSelectedCustomer('all'); // Reset customer when area changes
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                            <option value="all">All Areas</option>
                            {allAreas.map(area => (
                                <option key={area.id} value={area.id}>{area.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. CUSTOMER FILTER */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language]?.customer || 'Customer'}</label>
                        <select
                            value={selectedCustomer}
                            onChange={e => setSelectedCustomer(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                            <option value="all">{languageData[language]?.all_customers || 'All Customers'}</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* 3. COMPANY FILTER */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language]?.company_brand || 'Company'}</label>
                        <select
                            value={selectedCompany}
                            onChange={e => setSelectedCompany(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                            <option value="all">{languageData[language]?.all_companies || 'All Companies'}</option>
                            {uniqueCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* 4. DATE RANGE */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language]?.start_date || 'Start Date'}</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language]?.end_date || 'End Date'}</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/>
                    </div>

                    <button 
                        onClick={handleGenerateReport} 
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold h-10 w-full"
                    >
                        {languageData[language]?.generate || 'Generate'}
                    </button>
                </div>
            </div>

            {/* --- Report Display --- */}
            {reportData && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 text-blue-600 hover:underline">
                            <FaFilter /> {languageData[language]?.change_filters || 'Change Filters'}
                        </button>
                        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                            <FaPrint /> {languageData[language]?.print || 'Print'}
                        </button>
                    </div>

                    <div className="print-header hidden print:block mb-4">
                        <h2 className="text-2xl font-bold">{businessName}</h2>
                        <h3 className="text-xl uppercase tracking-wide text-gray-600 mb-2">{languageData[language]?.customer_company_report || 'Customer/Company Report'}</h3>
                        
                        <div className="grid grid-cols-2 gap-x-8 text-sm border-b border-black pb-2">
                            <p><span className="font-bold">Area:</span> {areaName}</p>
                            <p><span className="font-bold">{languageData[language]?.date_range || 'Date Range'}:</span> {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                            <p><span className="font-bold">{languageData[language]?.customer || 'Customer'}:</span> {customerName}</p>
                            <p><span className="font-bold">{languageData[language]?.company_brand || 'Company'}:</span> {companyName}</p>
                        </div>
                    </div>

                    {reportData.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300 text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-2 px-3 border border-gray-300 text-left">{languageData[language]?.date || 'Date'}</th>
                                        <th className="py-2 px-3 border border-gray-300 text-left">{languageData[language]?.customer_name || 'Customer Name'}</th>
                                        <th className="py-2 px-3 border border-gray-300 text-left">{languageData[language]?.product_name || 'Product Name'}</th>
                                        <th className="py-2 px-3 border border-gray-300 text-left">{languageData[language]?.company_brand || 'Company'}</th>
                                        <th className="py-2 px-3 border border-gray-300 text-right">{languageData[language]?.quantity || 'Qty'}</th>
                                        <th className="py-2 px-3 border border-gray-300 text-right">{languageData[language]?.total_sale || 'Total Sale'}</th>
                                        <th className="py-2 px-3 border border-gray-300 text-right">{languageData[language]?.total_profit || 'Total Profit'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.data.map((item, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-3 border border-gray-300 whitespace-nowrap">{item.saleDate}</td>
                                            <td className="py-2 px-3 border border-gray-300">{item.customerName}</td>
                                            <td className="py-2 px-3 border border-gray-300 font-medium">{item.name}</td>
                                            <td className="py-2 px-3 border border-gray-300">{item.companyName}</td>
                                            <td className="py-2 px-3 border border-gray-300 text-right font-bold">{item.quantity}</td>
                                            <td className="py-2 px-3 border border-gray-300 text-right font-semibold">{currency} {item.totalSale.toLocaleString()}</td>
                                            <td className={`py-2 px-3 border border-gray-300 text-right font-bold ${item.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {currency} {item.totalProfit.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-100 font-bold">
                                    <tr>
                                        <td colSpan="4" className="py-3 px-3 border border-gray-300 text-right uppercase">{languageData[language]?.totals || 'Totals'}:</td>
                                        <td className="py-3 px-3 border border-gray-300 text-right">{reportData.summary.totalQuantity}</td>
                                        <td className="py-3 px-3 border border-gray-300 text-right">{currency} {reportData.summary.totalSale.toLocaleString()}</td>
                                        <td className={`py-3 px-3 border border-gray-300 text-right ${reportData.summary.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {currency} {reportData.summary.totalProfit.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center p-10 no-print">
                            <p className="text-gray-500">{languageData[language]?.no_data_found || 'No data found for the selected filters.'}</p>
                        </div>
                    )}
                    
                    <div className="print-footer mt-4 font-bold text-right hidden print:block text-xl border-t-2 border-black pt-2">
                        {languageData[language]?.total_profit || 'Total Profit'}: {currency} {reportData.summary.totalProfit.toLocaleString()}
                    </div>
                </div>
            )}
            
            {/* Show helper if no data and filters hidden */}
            {reportData && reportData.data.length === 0 && !showFilters && (
                 <div className="text-center p-10 mt-6 bg-white rounded-lg shadow no-print">
                    <p className="text-gray-500">{languageData[language]?.no_data_found || 'No data found for the selected filters.'}</p>
                    <button onClick={() => setShowFilters(true)} className="mt-4 flex items-center gap-2 text-blue-600 mx-auto hover:underline">
                        <FaFilter /> {languageData[language]?.change_filters || 'Change Filters'}
                    </button>
                 </div>
            )}
        </div>
    );
};

export default CustomerCompanyReport;

