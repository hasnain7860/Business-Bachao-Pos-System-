import React from 'react'

const PaymentDetails = ({ payment , index}) => {
  return (
    <tr
    key={index}
    className="bg-white border-b"
  >
    <td className="border px-4 py-2">
      {payment.refNo}
    </td>
    <td className="border px-4 py-2">
      {payment.amount}
    </td>
    <td className="border px-4 py-2">
      {payment.notes || "N/A"}
    </td>
  </tr>
  )
}

export default PaymentDetails