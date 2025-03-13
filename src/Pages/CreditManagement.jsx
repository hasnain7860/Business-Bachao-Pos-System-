import React, { useState, useMemo } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { FaPlus, FaTimes } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";
import PaymentDetails from "../components/element/PaymentDetails.jsx";
import languageData from "../assets/languageData.json";
import { useNavigate } from 'react-router-dom';

const CreditManagement = () => {
  const context = useAppContext();
  const { language } = context;
  const navigate = useNavigate();
  const customers = context.supplierCustomerContext.customers;
  const salesData = context.SaleContext.Sales;
  const t = languageData[language];
  const submittedRecords = context.creditManagementContext.submittedRecords;
  const addRecords = context.creditManagementContext.add;
  console.log(submittedRecords);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [formType, setFormType] = useState("");
  const [formData, setFormData] = useState({
    id: uuidv4(),
    date: new Date().toISOString().substring(0, 10),
    amount: "",
    note: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, customers]
  );

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm("");
  };

  const handleSubmit = () => {
    if (!formData.amount) return;

    const newRecord = {
      id: uuidv4(),
      customerId: selectedCustomer.id,
      type: formType,
      amount: parseFloat(formData.amount),
      date: formData.date,
      note: formData.note,
    };

    addRecords(newRecord);
    setShowPopup(false);
    setFormData({
      id: uuidv4(),
      date: new Date().toISOString().substring(0, 10),
      amount: "",
      note: "",
    });
  };

  const totalRecordsPayment = submittedRecords
    .filter(
      (record) =>
        record.type === "payment" && record.customerId === selectedCustomer?.id
    )
    .reduce((acc, record) => acc + record.amount, 0);

  const totalSalesPayment = salesData
    .filter((sale) => sale.customerId === selectedCustomer?.id)
    .reduce((acc, sale) => acc + Number(sale.amountPaid), 0);

  const totalAddPayment = salesData
    .filter(
      (sale) => sale.customerId === selectedCustomer?.id && sale.addPayment
    )
    .reduce(
      (acc, sale) =>
        acc +
        sale.addPayment.reduce(
          (acc, addpayment) => acc + Number(addpayment.amount),
          0
        ),
      0
    );

  const totalPayment =
    Number(totalRecordsPayment) +
    Number(totalSalesPayment) +
    Number(totalAddPayment);

  const totalExistRecordCredit = submittedRecords
    .filter(
      (record) =>
        record.type === "credit" && record.customerId === selectedCustomer?.id
    )
    .reduce((acc, record) => acc + record.amount, 0);

  const totalSalesCredit = salesData
    .filter((sale) => sale.customerId === selectedCustomer?.id)
    .reduce((acc, sale) => acc + sale.credit, 0);

  const grandCredit = Number(totalSalesCredit) + Number(totalExistRecordCredit);

  return (
    <div className="p-4 bg-gray-50">
      <div className={`mt-4 ${language === 'ur' ? "text-right" : "text-left"}`}>
        <button
          className="bg-gray-300 text-black px-4 py-2 rounded"
          onClick={() => navigate(-1)}
        >
          {languageData[language].back}
        </button>
      </div>

      <h1 className="text-lg font-bold mb-4 text-blue-600">
        {t.creditManagement}
      </h1>
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
          <h2 className="text-lg font-semibold text-blue-500">
            {selectedCustomer.name}
          </h2>
          <button
            className="text-red-500 float-right"
            onClick={() => setSelectedCustomer(null)}
          >
            <FaTimes />
          </button>
          {salesData.filter((sale) => sale.customerId === selectedCustomer.id)
            .length > 0 ? (
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
                    {salesData
                      .filter((sale) => sale.customerId === selectedCustomer.id)
                      .map((sale) => {
                        const totalPayment =
                          Number(sale.amountPaid) +
                          (sale.addPayment
                            ? sale.addPayment.reduce(
                                (acc, addPayment) =>
                                  acc +
                                  Number(addPayment ? Number(addPayment.amount) : 0),
                                0
                              )
                            : 0);
                        return (
                          <>
                            <tr
                              className={`${
                                sale.credit === 0 ? "bg-red-200" : "bg-white"
                              } border-b`}
                            >
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
                                <button
                                  className="text-blue-600"
                                  onClick={() =>
                                    setDropdownOpen(
                                      dropdownOpen === sale.id ? null : sale.id
                                    )
                                  }
                                >
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
                                        {sale.addPayment &&
                                        sale.addPayment.map((payment) => (
                                        <tr className="bg-white border-b">
                                          <td className="border px-4 py-2">{payment.refNo}</td>
                                          <td className="border px-4 py-2">{payment.amount}</td>
                                          <td className="border px-4 py-2">N/A</td>
                                        </tr>
                       )) }
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
          ) : (
            ""
          )}
          {selectedCustomer &&
            submittedRecords.filter(
              (record) => record.customerId === selectedCustomer.id
            ).length > 0 && (
              <div className="mt-4 max-h-64 overflow-y-auto">
                <h3 className="text-lg font-semibold">{t.existingRecords}</h3>
                <table className="min-w-full bg-white border border-gray-300 mt-2">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border px-4 py-2">{t.type}</th>
                      <th className="border px-4 py-2">{t.amount}</th>
                      <th className="border px-4 py-2">{t.date}</th>
                      <th className="border px-4 py-2">{t.notes}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedRecords
                      .filter(
                        (record) => record.customerId === selectedCustomer.id
                      )
                      .map((record) => (
                        <tr key={record.id} className="border-b">
                          <td className="border px-4 py-2">{record.type}</td>
                          <td className="border px-4 py-2">{record.amount}</td>
                          <td className="border px-4 py-2">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="border px-4 py-2">{record.note}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          <h3 className="text-md font-bold mt-4">
            {t.totalPayment}: {totalPayment}
          </h3>
          <h3 className="text-md font-bold mt-4">
            {t.grandCredit}: {grandCredit}
          </h3>

          <div className="mt-4 flex space-x-2">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={() => {
                setShowPopup(true);
                setFormType("payment");
              }}
            >
              {t.addPayment}
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => {
                setShowPopup(true);
                setFormType("credit");
              }}
            >
              {t.addCredit}
            </button>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg w-80">
            <h3 className="text-lg font-bold">{t.add} {formType}</h3>
            <input
              type="date"
              className="w-full p-2 border rounded mt-2"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
            <input
              type="number"
              placeholder={t.amount}
              className="w-full p-2 border rounded mt-2"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />
            <input
              type="text"
              placeholder={t.note}
              className="w-full p-2 border rounded mt-2"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
            />
            <div className="mt-4 flex space-x-2">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={handleSubmit}
              >
                {t.add}
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => setShowPopup(false)}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagement;
