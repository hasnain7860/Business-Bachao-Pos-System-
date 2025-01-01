import { useState, useEffect } from 'react';
import { updateItem, deleteItem } from './UpdateDeleteUntils.jsx';
import { addItem, getItems, deleteAndTrackItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const useCompanyContext = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    const loadCompanies = async () => {
      const storedCompanies = await getItems(STORE_NAMES.company);
      setCompanies(storedCompanies);
    };
    loadCompanies();
  }, []);

  const addCompany = async (newCompany) => {
    const id = await addItem(STORE_NAMES.company, newCompany);
    setCompanies((prev) => [...prev, { ...newCompany, id }]);
  };

  const editCompany = async (id, updatedCompany) => {
    setCompanies((prev) => updateItem(prev, id, updatedCompany));

    // Use putItem to update the company in IndexedDB
    await putItem(STORE_NAMES.company, { ...updatedCompany, id });
    if (selectedCompany?.id === id) setSelectedCompany(null);
  };

  const deleteCompany = async (id) => {
    await deleteFromDB(STORE_NAMES.company, id);
    setCompanies((prev) => deleteItem(prev, id));
    if (selectedCompany?.id === id) setSelectedCompany(null);
  };

  const companyContext = {
    companies,
    selectedCompany,
    add: addCompany,
    edit: editCompany,
    delete: deleteCompany,
    select: (id) => setSelectedCompany(companies.find((c) => c.id === id) || null),
  };

  return companyContext;
};

export default useCompanyContext;