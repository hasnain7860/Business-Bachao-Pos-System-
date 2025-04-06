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
  const peoples = context.peopleContext.people;
 
  const salesData = context.SaleContext.Sales;
  const t = languageData[language];
  const submittedRecords = context.creditManagementContext.submittedRecords;
  const addRecords = context.creditManagementContext.add;
  console.log(submittedRecords);
  const [searchTerm, setSearchTerm] = useState("");
  const sellReturns = context.SellReturnContext.sellReturns
  const [selectedPeople, setSelectedPeople] = useState(null)
  const [showPopup, setShowPopup] = useState(false);
  const [formType, setFormType] = useState("");
  const [formData, setFormData] = useState({
    id: uuidv4(),
    date: new Date().toISOString().substring(0, 10),
    amount: "",
    note: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const filteredPeoples = useMemo(
    () =>
      peoples.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, peoples]
  );

  const handlePeopleSelect = (people) => {
    setSelectedPeople(people);
    setSearchTerm("");
  };

  const handleSubmit = () => {
    if (!formData.amount) return;

    const newRecord = {
      id: uuidv4(),
      personId: selectedPeople.id,
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
        record.type === "payment" && record.personId === selectedPeople?.id
    )
    .reduce((acc, record) => acc + record.amount, 0);

  const totalSalesPayment = salesData
    .filter((sale) => sale.personId === selectedPeople?.id)
    .reduce((acc, sale) => acc + Number(sale.amountPaid), 0);

 

  const totalPayment =
    Number(totalRecordsPayment) +
    Number(totalSalesPayment)

  const totalExistRecordCredit = submittedRecords
    .filter(
      (record) =>
        record.type === "credit" && record.personId === selectedPeople?.id
    )
    .reduce((acc, record) => acc + record.amount, 0);

  const totalSalesCredit = salesData
    .filter((sale) => sale.personId === selectedPeople?.id)
    .reduce((acc, sale) => acc + sale.credit, 0);

  const grandCredit = Number(totalSalesCredit) + Number(totalExistRecordCredit);

  // Replace the existing totalReturns calculation
  const totalReturns = useMemo(() => {
    return sellReturns
      .filter(returnItem => returnItem.people === selectedPeople?.id)
      .reduce((acc, returnItem) => {
        return acc + (returnItem.paymentDetails?.creditAdjustment || 0);
      }, 0);
  }, [sellReturns, selectedPeople]);

  // Update the remaining credit calculation
  const remainingCredit = Number(grandCredit) - Number(totalRecordsPayment) - Number(totalReturns);

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
      {!selectedPeople ? (
        <div className="relative mb-4">
          <input
            type="text"
            placeholder={t.searchCustomer}
            className="input input-bordered w-full border-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredPeoples.length > 0 && (
            <div className="absolute z-10 bg-white border rounded shadow-md w-full mt-1 max-h-40 overflow-y-auto">
              {filteredPeoples.map((people) => (
                <div
                  key={people.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handlePeopleSelect(people)}
                >
                  {people.name}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="border p-4 rounded-lg bg-white shadow">
          <h2 className="text-lg font-semibold text-blue-500">
            {selectedPeople.name}
          </h2>
          <button
            className="text-red-500 float-right"
            onClick={() => setSelectedPeople(null)}
          >
            <FaTimes />
          </button>
          {salesData.filter((sale) => sale.personId === selectedPeople.id)
            .length > 0 ? (
            <>
              <div className="mt-4 max-h-64 overflow-y-auto">
                <h3 className="text-md font-bold mt-4">{t.salesData}</h3>
                <table className="min-w-full bg-white border border-gray-200 mt-2">
                  <thead>
                    <tr>
                      <th className="border px-4 py-2">{t.saleRefNo}</th>
                      <th className="border px-4 py-2">{t.totalPayment}</th>
                      <th className="border px-4 py-2">{t.amountPaid}</th>
                      <th className="border px-4 py-2">{t.credit}</th>
                      <th className="border px-4 py-2">{t.date}</th>

                    </tr>
                  </thead>
                  <tbody>
                    {salesData
                      .filter((sale) => sale.personId === selectedPeople.id)
                      .map((sale) => {

                        return (
                          <>
                            <tr
                              className={`${sale.credit === 0 ? "bg-red-200" : "bg-white"
                                } border-b`}
                            >
                              <td className="border px-4 py-2">{sale.salesRefNo}</td>
                              <td className="border px-4 py-2">{sale.totalBill}</td>
                              <td className="border px-4 py-2">{sale.amountPaid}</td>
                              <td className="border px-4 py-2">{sale.credit}</td>
                              <td className="border px-4 py-2">{new Date(sale.dateTime).toLocaleDateString()}</td>

                            </tr>

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
          {selectedPeople && salesData.some(sale => 
  sale.personId === selectedPeople.id && sale.returns?.length > 0
) && (
  <div className="mt-4 max-h-64 overflow-y-auto">
    <h3 className="text-lg font-semibold">{t.returnRecords}</h3>
    <table className="min-w-full bg-white border border-gray-300 mt-2">
      <thead>
        <tr className="bg-gray-200">
          <th className="border px-4 py-2">{t.saleRefNo}</th>
          <th className="border px-4 py-2">{t.returnDate}</th>
          <th className="border px-4 py-2">{t.returnAmount}</th>
          <th className="border px-4 py-2">{t.returnedProducts}</th>
        </tr>
      </thead>
      <tbody>
        {salesData
          .filter(sale => sale.personId === selectedPeople.id && sale.returns?.length > 0)
          .map(sale => (
            sale.returns.map((ret, index) => (
              <tr key={`${sale.id}-${index}`} className="border-b">
                <td className="border px-4 py-2">{sale.salesRefNo}</td>
                <td className="border px-4 py-2">
                  {new Date(ret.dateTime).toLocaleDateString()}
                </td>
                <td className="border px-4 py-2">{ret.returnPrice}</td>
                <td className="border px-4 py-2">
                  {ret.returnedProducts.map(p => 
                    `${p.name} (${p.returnQuantity})`
                  ).join(', ')}
                </td>
              </tr>
            ))
          ))}
      </tbody>
    </table>
  </div>
)}
          {selectedPeople && sellReturns.some(ret => ret.people === selectedPeople.id) && (
  <div className="mt-4 max-h-64 overflow-y-auto">
    <h3 className="text-lg font-semibold">{t.returnRecords}</h3>
    <table className="min-w-full bg-white border border-gray-300 mt-2">
      <thead>
        <tr className="bg-gray-200">
          <th className="border px-4 py-2">{t.returnRefNo}</th>
          <th className="border px-4 py-2">{t.saleRefNo}</th>
          <th className="border px-4 py-2">{t.returnAmount}</th>
          <th className="border px-4 py-2">{t.cashReturn}</th>
          <th className="border px-4 py-2">{t.creditAdjustment}</th>
      
        </tr>
      </thead>
      <tbody>
        {sellReturns
          .filter(ret => ret.people === selectedPeople.id)
          .map((ret) => (
            <tr key={ret.id} className="border-b">
              <td className="border px-4 py-2">{ret.returnRefNo}</td>
              <td className="border px-4 py-2">{ret.salesRef || '-'}</td>
              <td className="border px-4 py-2">{ret.totalAmount}</td>
              <td className="border px-4 py-2">
                {ret.paymentDetails?.cashReturn || 0}
              </td>
              <td className="border px-4 py-2">
                {ret.paymentDetails?.creditAdjustment || 0}
              </td>
              
            </tr>
          ))}
      </tbody>
    </table>
  </div>
)}
          {selectedPeople &&
            submittedRecords.filter(
              (record) => record.personId === selectedPeople.id
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
                        (record) => record.personId === selectedPeople.id
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


<div className="mt-8 bg-gray-100 p-4 rounded-lg">
  <h2 className="text-xl font-bold mb-4 border-b pb-2">Credit Summary</h2>
  
  <div className="grid grid-cols-2 gap-4">
    <div>
      <h3 className="text-md font-bold text-gray-700">Initial Sales</h3>
      <ul className="list-disc pl-4 space-y-2">
        <li>Total Bills Amount: {salesData
          .filter((sale) => sale.personId === selectedPeople?.id)
          .reduce((acc, sale) => acc + Number(sale.totalBill), 0)}</li>
        <li>Initial Payments: {salesData
          .filter((sale) => sale.personId === selectedPeople?.id)
          .reduce((acc, sale) => acc + Number(sale.amountPaid), 0)}</li>
        <li>Initial Credit: {totalSalesCredit}</li>
      </ul>
    </div>

    <div>
      <h3 className="text-md font-bold text-gray-700">Later Transactions</h3>
      <ul className="list-disc pl-4 space-y-2">
        <li>Additional Payments: {totalRecordsPayment}</li>
        <li>Additional Credit: {totalExistRecordCredit}</li>
        <li>Returns Adjusted: {totalReturns}</li>
      </ul>
    </div>
  </div>

  <div className="mt-4 border-t pt-4">
    <h3 className="text-lg font-bold text-gray-800">Final Summary</h3>
    <ul className="list-disc pl-4 space-y-2">
      <li>Total Credit: {grandCredit}</li>
      <li>Total Payments: {totalPayment}</li>
      <li>Total Returns: {totalReturns}</li>
      <li className="text-xl font-bold text-blue-600">
        Remaining Credit: {remainingCredit}
      </li>
    </ul>
  </div>

  <div className="mt-4 p-4 bg-yellow-100 rounded">
    <p className="text-sm">
      To add new payment for this person, click the "Add Payment" button below
    </p>
  </div>
</div>











        
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
