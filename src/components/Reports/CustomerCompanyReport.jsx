import React, { useState, useRef, useMemo } from 'react';
import { useAppContext } from '../../Appfullcontext'; // Path update karein
import { FaPrint, FaFilter } from 'react-icons/fa';
import languageData from '../../assets/languageData.json'; // Path update karein

const CustomerCompanyReport = () => {
    const context = useAppContext();
    const { language } = context;

    // --- Data from context ---
    const allSales = context.SaleContext.Sales || [];
    const allPeoples = context.peopleContext.people || [];
    const allProducts = context.productContext.products || []; // Products chahiye company ke liye

    const userAndBusinessDetail = context.settingContext.settings;
    const currency = userAndBusinessDetail?.[0]?.business?.currency ?? 'Rs';
    const businessName = userAndBusinessDetail?.[0]?.business?.businessName ?? 'Business Bachao';

    // --- Filters State ---
    const [selectedCustomer, setSelectedCustomer] = useState('all');
    const [selectedCompany, setSelectedCompany] = useState('all');
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    
    const [reportData, setReportData] = useState(null);
    const [showFilters, setShowFilters] = useState(true);

    // Customers ki list
    const customers = useMemo(() => {
        return allPeoples;
    }, [allPeoples]);

    // Companies ki unique list (Products se)
    const uniqueCompanies = useMemo(() => {
        const companies = new Set(allProducts.map(p => p.company).filter(Boolean));
        return ['all', ...Array.from(companies)];
    }, [allProducts]);

    // Report generate karne ka function
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
            const customerName = customer ? customer.name : (languageData[language].walking_customer || 'Walking Customer');
            
            sale.products.forEach(product => {
                const productCompany = allProducts.find(p => p.id === product.id)?.company || 'N/A';
                
                if (selectedCompany === 'all' || productCompany === selectedCompany) {
                    
                    const quantity = parseInt(product.SellQuantity, 10) || 0;
                    const salePrice = parseFloat(product.newSellPrice || product.sellPrice) || 0;
                    const purchasePrice = parseFloat(product.purchasePrice) || 0;

                    const totalSale = salePrice * quantity;
                    const totalCost = purchasePrice * quantity;
                    const totalProfit = totalSale - totalCost;

                    finalProductList.push({
                        id: product.id,
                        name: product.name,
                        company: productCompany,
                        customerName: customerName,
                        saleDate: new Date(sale.dateTime).toLocaleDateString(),
                        quantity,
                        totalSale,
                        totalProfit,
                    });
                }
            });
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

    const customerName = selectedCustomer === 'all' ? (languageData[language].all_customers || 'All Customers') : customers.find(c => c.id === selectedCustomer)?.name;

    return (
        <div>
            {/* --- Filters (No Print) --- */}
            <div className={`no-print ${showFilters ? '' : 'hidden'}`}>
                <h3 className="text-xl font-semibold mb-4">{languageData[language].customer_company_report || 'Customer/Company Report'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language].customer || 'Customer'}</label>
                        <select
                            value={selectedCustomer}
                            onChange={e => setSelectedCustomer(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                            <option value="all">{languageData[language].all_customers || 'All Customers'}</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language].company_brand || 'Company (Brand)'}</label>
                        <select
                            value={selectedCompany}
                            onChange={e => setSelectedCompany(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                            {uniqueCompanies.map(c => <option key={c} value={c}>{c === 'all' ? (languageData[language].all_companies || 'All Companies') : c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language].start_date || 'Start Date'}</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{languageData[language].end_date || 'End Date'}</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"/>
                    </div>

                    <button 
                        onClick={handleGenerateReport} 
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold"
                    >
                        {languageData[language].generate || 'Generate'}
                    </button>
                </div>
            </div>

            {/* --- Report Data --- */}
            {reportData && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 text-blue-600">
                            <FaFilter /> {languageData[language].change_filters || 'Change Filters'}
                        </button>
                        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                            <FaPrint /> {languageData[language].print || 'Print'}
                        </button>
                    </div>

                    <div className="print-header">
                        <h2>{businessName}</h2>
                        <h3>{languageData[language].customer_company_report || 'Customer/Company Report'}</h3>
                        <p>{languageData[language].customer || 'Customer'}: {customerName}</p>
                        <p>{languageData[language].company_brand || 'Company'}: {selectedCompany}</p>
                        <p>{languageData[language].date_range || 'Date Range'}: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th>{languageData[language].date || 'Date'}</th>
                                    <th>{languageData[language].customer_name || 'Customer Name'}</th>
                                    <th>{languageData[language].product_name || 'Product Name'}</th>
                                    <th>{languageData[language].company_brand || 'Company'}</th>
                                    <th className="text-right">{languageData[language].quantity || 'Qty'}</th>
                                    <th className="text-right">{languageData[language].total_sale || 'Total Sale'}</th>
                                    <th className="text-right">{languageData[language].total_profit || 'Total Profit'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.data.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-50">
                                        <td>{item.saleDate}</td>
                                        <td>{item.customerName}</td>
                                        <td className="font-medium">{item.name}</td>
                                        <td>{item.company}</td>
                                        <td className="text-right font-bold">{item.quantity}</td>
                                        <td className="text-right font-semibold">{currency} {item.totalSale.toFixed(2)}</td>
                                        <td className={`text-right font-bold ${item.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {currency} {item.totalProfit.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="4" className="text-right">{languageData[language].totals || 'Totals'}:</td>
                                    <td className="text-right">{reportData.summary.totalQuantity}</td>
                                    <td className="text-right">{currency} {reportData.summary.totalSale.toFixed(2)}</td>
                                    <td className={`text-right ${reportData.summary.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {currency} {reportData.summary.totalProfit.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="print-footer">
                        {languageData[language].total_profit || 'Total Profit'}: {currency} {reportData.summary.totalProfit.toFixed(2)}
                    </div>
                </div>
            )}
            {reportData && reportData.data.length === 0 && !showFilters && (
                 <div className="text-center p-10">
                    <p className="text-gray-500">{languageData[language].no_data_found || 'No data found for the selected filters.'}</p>
                    <button onClick={() => setShowFilters(true)} className="mt-4 flex items-center gap-2 text-blue-600 mx-auto">
                        <FaFilter /> {languageData[language].change_filters || 'Change Filters'}
                    </button>
                 </div>
            )}
        </div>
    );
};

export default CustomerCompanyReport;


