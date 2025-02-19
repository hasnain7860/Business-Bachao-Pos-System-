import React, { useState, useEffect } from 'react';
import { useAppContext } from '../Appfullcontext.jsx';
import { useParams, useNavigate } from 'react-router-dom';

const AddPayments = () => {
  const navigate = useNavigate();
  const context = useAppContext();
  
  const sales = context.SaleContext.Sales;
  const edit = context.SaleContext.edit;
  const setIsOpen = context.setIsOpen;
  const isOpen = context.isOpen;

  const openModal = () => setIsOpen(true);
  const closeModal = () => { 
    setIsOpen(false);
    navigate(-1);
  };
  
  const { id } = useParams();
  const [form, setForm] = useState({
    refNo: '',
    amount: '',
    notes: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    openModal();
    if (id) {
      const saleToMatch = sales.find(sale => sale.id === id);
      if (saleToMatch) {
        setForm({
          saleId: saleToMatch.id,
          refNo: saleToMatch.salesRefNo,
          amount: '',
          notes: ''
        });
      }
    }
  }, [id, sales]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const saleToMatch = sales.find(sale => sale.id === id);

    if (!saleToMatch) return;
    const enteredAmount = parseFloat(form.amount);


    const totalPaidFromPayments = saleToMatch.addPayment
    ? saleToMatch.addPayment.reduce((sum, payment) => sum + Number(payment.amount), 0)
    : 0;


  const updatedCredit = saleToMatch.credit - totalPaidFromPayments;
   

    if (enteredAmount > updatedCredit) {
      setError(`Amount exceeds available credits (Max: ${updatedCredit})`);
      return;
    }

    const updatedSale = {
      ...saleToMatch,
      addPayment: saleToMatch.addPayment 
        ? [...saleToMatch.addPayment, form] 
        : [form]
    };

    edit(saleToMatch.id, updatedSale);
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add Payment</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block font-bold">Sale Reference No</label>
              <input
                type="text"
                name="refNo"
                value={form.refNo}
                disabled
                className="w-full p-2 border rounded bg-gray-200"
              />
            </div>
            <div>
              <label className="block font-bold">Amount *</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <div>
              <label className="block font-bold">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Add any notes here..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPayments;
