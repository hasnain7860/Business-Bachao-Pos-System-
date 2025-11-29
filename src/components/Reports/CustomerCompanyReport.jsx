import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext';
import { FaPrint, FaFilter } from 'react-icons/fa';
import languageData from '../../assets/languageData.json';

const CustomerCompanyReport = () => {
    const context = useAppContext();
    const { language } = context;

    // --- CRITICAL FIX: Universal Store Mapping ---
    // 1. All stores return 'data'
    // 2. Added Safe Fallbacks || []
    const allSales = context.SaleContext.data || [];
    const allPeoples = context.peopleContext.data || [];
    const allProducts = context.productContext.data || [];
    const allCompanies = context.companyContext.data || []; 

    const settingsData = context.settingContext.data || [];
    const userAndBusinessDetail = settingsData[0] || {};
    
    const currency = userAndBusinessDetail?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.business?.businessName ?? 'Business Bachao';

    // --- Filters State ---
    const [selectedCustomer, setSelectedCustomer] = useState('all');
    const [selectedCompany, setSelectedCompany] = useState('all'); // Stores Company ID now
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    
    const [reportData, setReportData] = useState(null);
    const [showFilters, setShowFilters] = useState(true);

    // --- Memos ---
    const customers = useMemo(() => {
        return [...allPeoples].sort((a,b) => a.name.localeCompare(b.name));
    }, [allPeoples]);

    // Unique Companies (ID & Name)
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

        const salesInRange = allSales.filter(sale => {
            const saleDate = new Date(sale.dateTime);
            return saleDate >= start && saleDate <= end;
        });

        let salesFilteredByCustomer = salesInRange;
        if (selectedCustomer !== 'all') {
            salesFilteredByCustomer = salesInRange.filter(sale => sale.personId === selectedCustomer);
        }

        const finalProductList = [];
        salesFilteredByCustomer.forEach(sale => {
            const customer = allPeoples.find(p => p.id === sale.personId);
            const customerName = customer ? customer.name : (languageData[language]?.walking_customer || 'Walking Customer');
            
            // Process each product in sale
            if (sale.products && Array.isArray(sale.products)) {
                sale.products.forEach(productInSale => {
                    
                    // Find original product to get company ID
                    const mainProduct = allProducts.find(p => p.id === productInSale.id);
                    const productCompanyId = mainProduct ? mainProduct.companyId : 'N/A';
                    
                    // Match Filter
                    if (selectedCompany === 'all' || productCompanyId === selectedCompany) {
                        
                        // Logic for Quantity & Cost
                        // Note: 'SellQuantity' is Base Units in new system
                        const quantity = parseFloat(productInSale.SellQuantity) || 0;
                        
                        // Calculate Revenue (Line Total)
                        let totalSale = 0;
                        if (productInSale.enteredQty && productInSale.newSellPrice) {
                             // New System: Display Qty * Unit Price
                             totalSale = parseFloat(productInSale.enteredQty) * parseFloat(productInSale.newSellPrice);
                        } else {
                             // Old System Fallback
                             const salePrice = parseFloat(productInSale.newSellPrice || productInSale.sellPrice) || 0;
                             totalSale = quantity * salePrice;
                        }

                        // Calculate Cost (Base Qty * Base Cost)
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
                            quantity: quantity, // Showing Base Quantity (Pieces)
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

    const customerName = selectedCustomer === 'all' ? (languageData[language]?.all_customers || 'All Customers') : customers.find(c => c.id === selectedCustomer)?.name;
    const companyName = selectedCompany === 'all' ? (languageData[language]?.all_companies || 'All Companies') : allCompanies.find(c => c.id === selectedCompany)?.name;

    return (
        <div>
            {/* --- Filters (Hidden on Print) --- */}
            <div className={`no-print p-4 border rounded-lg bg-gray-50 ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language]?.customer_company_report || 'Customer/Company Report'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language]?.company_brand || 'Company (Brand)'}</label>
                        <select
                            value={selectedCompany}
                            onChange={e => setSelectedCompany(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                            <option value="all">{languageData[language]?.all_companies || 'All Companies'}</option>
                            {uniqueCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

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
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold h-10"
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
                        <h3 className="text-xl">{languageData[language]?.customer_company_report || 'Customer/Company Report'}</h3>
                        <p>{languageData[language]?.customer || 'Customer'}: {customerName}</p>
                        <p>{languageData[language]?.company_brand || 'Company'}: {companyName}</p>
                        <p>{languageData[language]?.date_range || 'Date Range'}: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    {reportData.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300">
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
                                            <td className="py-2 px-3 border border-gray-300">{item.saleDate}</td>
                                            <td className="py-2 px-3 border border-gray-300">{item.customerName}</td>
                                            <td className="py-2 px-3 border border-gray-300 font-medium">{item.name}</td>
                                            <td className="py-2 px-3 border border-gray-300">{item.companyName}</td>
                                            <td className="py-2 px-3 border border-gray-300 text-right font-bold">{item.quantity}</td>
                                            <td className="py-2 px-3 border border-gray-300 text-right font-semibold">{currency} {item.totalSale.toFixed(2)}</td>
                                            <td className={`py-2 px-3 border border-gray-300 text-right font-bold ${item.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {currency} {item.totalProfit.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-100 font-bold">
                                    <tr>
                                        <td colSpan="4" className="py-3 px-3 border border-gray-300 text-right">{languageData[language]?.totals || 'Totals'}:</td>
                                        <td className="py-3 px-3 border border-gray-300 text-right">{reportData.summary.totalQuantity}</td>
                                        <td className="py-3 px-3 border border-gray-300 text-right">{currency} {reportData.summary.totalSale.toFixed(2)}</td>
                                        <td className={`py-3 px-3 border border-gray-300 text-right ${reportData.summary.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {currency} {reportData.summary.totalProfit.toFixed(2)}
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
                    
                    <div className="print-footer mt-4 font-bold text-right hidden print:block">
                        {languageData[language]?.total_profit || 'Total Profit'}: {currency} {reportData.summary.totalProfit.toFixed(2)}
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

