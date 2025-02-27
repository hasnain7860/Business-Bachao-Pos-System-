import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import languageData from "../assets/languageData.json"; // Updated JSON path

const CreditManagement = ({ language, customers, salesData, submittedRecords }) => {
  const t = languageData[language]; // Use languageData instead of translations
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  return (
    <div className="p-4 bg-gray-50">
      <h1 className="text-lg font-bold mb-4 text-blue-600">{t.creditManagement}</h1>
      {!selectedCustomer ? (
        <div className="relative mb-4">
          <input
            type="text"
            placeholder={t.searchCustomer}
            className="input input-bordered w-full border-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredCustomers.length > 0 && (
            <div className="absolute z-10 bg-white border rounded shadow-md w-full mt-1 max-h-40 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  {customer.name}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="border p-4 rounded-lg bg-white shadow">
          <h2 className="text-lg font-semibold text-blue-500">{selectedCustomer.name}</h2>
          <button className="text-red-500 float-right" onClick={() => setSelectedCustomer(null)}>
            <FaTimes />
          </button>
          {salesData.filter(sale => sale.customerId === selectedCustomer.id).length > 0 ? (
            <>
              <div className="mt-4 max-h-64 overflow-y-auto">
                <h3 className="text-md font-bold mt-4">{t.salesData}</h3>
                <table className="min-w-full bg-white border border-gray-200 mt-2">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2">{t.saleRefNo}</th>
                      <th className="border px-4 py-2">{t.amountPaid}</th>
                      <th className="border px-4 py-2">{t.credit}</th>
                      <th className="border px-4 py-2">{t.date}</th>
                      <th className="border px-4 py-2">{t.addPayment}</th>
                      <th className="border px-4 py-2">{t.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.filter(sale => sale.customerId === selectedCustomer.id).map(sale => {
                      const totalPayment = Number(sale.amountPaid) + (sale.addPayment ? sale.addPayment.reduce((acc, addPayment) => acc + Number(addPayment ? addPayment.amount : 0), 0) : 0);
                      return (
                        <>
                          <tr className={`${sale.credit === 0 ? "bg-red-200" : "bg-white"} border-b`}>
                            <td className="border px-4 py-2">{sale.salesRefNo}</td>
                            <td className="border px-4 py-2">{totalPayment}</td>
                            <td className="border px-4 py-2">{sale.credit}</td>
                            <td className="border px-4 py-2">{new Date(sale.dateTime).toLocaleDateString()}</td>
                            <td className="border px-4 py-2">
                              {Number(totalPayment) === Number(sale.credit) ? (
                                <span className="text-green-600 block text-center font-semibold bg-green-100 px-3 py-1 rounded-lg">
                                  {t.noMorePayment}
                                </span>
                              ) : (
                                <Link to={`/sales/addPayments/${sale.id}`} className="bg-blue-500 block text-center hover:bg-blue-600 text-white font-medium py-1 px-4 rounded-lg shadow-md transition duration-300 ease-in-out">
                                  {t.addMorePayment}
                                </Link>
                              )}
                            </td>
                            <td className="border px-4 py-2 text-center">
                              <button className="text-blue-600" onClick={() => setDropdownOpen(dropdownOpen === sale.id ? null : sale.id)}>
                                {dropdownOpen === sale.id ? "▲" : "▼"}
                              </button>
                            </td>
                          </tr>
                          {dropdownOpen === sale.id && (
                            <tr>
                              <td colSpan="6" className="border px-4 py-2 bg-gray-100">
                                <div>
                                  <p className="font-bold text-gray-700">{t.paymentDetails}:</p>
                                  <table className="w-full border-collapse border border-gray-300 mt-2">
                                    <thead>
                                      <tr className="bg-gray-200">
                                        <th className="border px-4 py-2">{t.refNo}</th>
                                        <th className="border px-4 py-2">{t.amount}</th>
                                        <th className="border px-4 py-2">{t.notes}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr className="bg-white border-b">
                                        <td className="border px-4 py-2">{t.firstTimePayment}</td>
                                        <td className="border px-4 py-2">{sale.amountPaid}</td>
                                        <td className="border px-4 py-2">N/A</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : ""}
        </div>
      )}
    </div>
  );
};

export default CreditManagement;
