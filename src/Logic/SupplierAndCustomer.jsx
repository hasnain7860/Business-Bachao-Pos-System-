import { useState, useEffect } from 'react';
import { addItem, getItems, deleteAndTrackItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useSupplierAndCustomerContext = () => {
  // Suppliers and Customers context
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const storedSuppliers = await getItems(STORE_NAMES.suppliers);
      const storedCustomers = await getItems(STORE_NAMES.customers);
      setSuppliers(storedSuppliers);
      setCustomers(storedCustomers);
    };
    loadData();
  }, []);

  const addCustomer = async (newCustomer) => {
    const id = await addItem(STORE_NAMES.customers, newCustomer);
    setCustomers((prev) => [...prev, { ...newCustomer, id }]);
  };

  const editCustomer = async (id, updatedCustomer) => {
    setCustomers((prev) => prev.map(customer => customer.id == id ? { ...updatedCustomer, id } : customer));
    await putItem(STORE_NAMES.customers, { ...updatedCustomer, id });
  };

  const deleteCustomer = async (id) => {
    await deleteFromDB(STORE_NAMES.customers, id);
    setCustomers((prev) => prev.filter(customer => customer.id !== id));
  };

  const supplierCustomerContext = {
    suppliers,
    setSuppliers,
    addSupplier: async (supplier) => {
      const id = await addItem(STORE_NAMES.suppliers, supplier);
      setSuppliers((prev) => [...prev, { ...supplier, id }]);
    },
    editSupplier: async (id, supplier) => {
      setSuppliers((prev) => prev.map(s => s.id === id ? { ...supplier, id } : s));
      await putItem(STORE_NAMES.suppliers, { ...supplier, id });
    },
    deleteSupplier: async (id) => {
      await deleteFromDB(STORE_NAMES.suppliers, id);
      setSuppliers((prev) => prev.filter(s => s.id !== id));
    },
    customers,
    setCustomers,
    addCustomer,
    editCustomer,
    deleteCustomer,
  };

  return supplierCustomerContext;
  
}

export default useSupplierAndCustomerContext