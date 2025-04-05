import { useState, useEffect } from 'react';
import { addItem, getItems, deleteItem as deleteFromDB, putItem, STORE_NAMES } from '../Utils/IndexedDb.jsx';

const usePeopleContext = () => {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const storedPeople = await getItems(STORE_NAMES.people);
      setPeople(storedPeople);
    };
    loadData();
  }, []);
  
  const refreshData = async () => {
    const updatedPeople = await getItems(STORE_NAMES.people);
    setPeople(updatedPeople);
  };

  const addPerson = async (newPerson) => {
    await addItem(STORE_NAMES.people, newPerson);
    setPeople((prev) => [...prev, { ...newPerson }]);
  };

  const editPerson = async (id, updatedPerson) => {
    await putItem(STORE_NAMES.people, { ...updatedPerson, id });
    setPeople((prev) => prev.map(person => person.id === id ? { ...updatedPerson, id } : person));
  };

  const deletePerson = async (id) => {
    await deleteFromDB(STORE_NAMES.people, id);
    setPeople((prev) => prev.filter(person => person.id !== id));
  };

  const peopleContext = {
    people,
    setPeople,
    add:addPerson,
    edit:editPerson,
    delete:deletePerson,
    refreshData,
  };

  return peopleContext;
}

export default usePeopleContext;