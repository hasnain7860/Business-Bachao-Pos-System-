<div className="mt-4 max-h-64 overflow-y-auto">
  <h3 className="text-md font-bold mt-4">Sales Data</h3>
  <table className="min-w-full bg-white border border-gray-200 mt-2">
    <thead>
      <tr>
        <th className="border px-4 py-2">Sale Ref No</th>
        <th className="border px-4 py-2">Amount Paid</th>
        <th className="border px-4 py-2">Credit</th>
        <th className="border px-4 py-2">Date</th>
        <th className="border px-4 py-2">Add Payment to this Sale</th>
        <th className="border px-4 py-2">Action</th>
      </tr>
    </thead>
    <tbody>
      {salesData
        .filter((sale) => sale.customerId === selectedCustomer.id)
        .map((sale) => {
          const totalPayment =
            Number(sale.amountPaid) + (sale.addPayment
              ? sale.addPayment.reduce(
                  (acc, addPayment) =>
                    acc + Number(addPayment ? addPayment.amount : 0),
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
                <td className="border px-4 py-2">
                  {new Date(sale.dateTime).toLocaleDateString()}
                </td>
                <td className="border px-4 py-2">
                  {Number(totalPayment) === Number(sale.credit) ? (
                    <span className="text-green-600 font-semibold bg-green-100 px-3 py-1 rounded-lg">
                      No Need More Payment
                    </span>
                  ) : (
                    <Link
                      to={`/sales/addPayments/${sale.id}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
                    >
                      Add More Payment
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
                      <p className="font-bold text-gray-700">Payment Details:</p>
                      <table className="w-full border-collapse border border-gray-300 mt-2">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border px-4 py-2">Ref No</th>
                            <th className="border px-4 py-2">Amount</th>
                            <th className="border px-4 py-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white border-b">
                            <td className="border px-4 py-2">First Time Payment</td>
                            <td className="border px-4 py-2">{sale.amountPaid}</td>
                            <td className="border px-4 py-2">N/A</td>
                          </tr>
                          {sale.addPayment &&
                            sale.addPayment.map((payment, index) => (
                              <PaymentDetails key={index} payment={payment} />
                            ))}
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

{selectedCustomer &&
  submittedRecords.filter(
    (record) => record.customerId === selectedCustomer.id
  ).length > 0 && (
    <div className="mt-4 max-h-64 overflow-y-auto">
      <h3 className="text-lg font-semibold">Existing Records</h3>
      <table className="min-w-full bg-white border border-gray-300 mt-2">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">Type</th>
            <th className="border px-4 py-2">Amount</th>
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Notes</th>
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
