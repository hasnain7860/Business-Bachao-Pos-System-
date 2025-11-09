
import React, { createContext, useEffect, useContext, useState , useRef } from 'react';
import useCompanyContext from './Logic/Company.jsx';

import useUnitsContext from './Logic/Units.jsx';
import useProductContext from './Logic/Product.jsx';
import useCostContext from './Logic/Cost.jsx';
import useSupplierAndCustomerContext from './Logic/SupplierAndCustomer.jsx';
import usePurchaseContext from './Logic/Purchase.jsx';
import useSalesContext from './Logic/Sales.jsx';
import useSettingsContext from './Logic/Settings.jsx';
import useCreditManagementContext from './Logic/CreditManagement.jsx';
import useNotificationContext from './Logic/Notifications.jsx';
import { ClientDatabaseInitializer } from './Utils/ClientFirebaseDb.jsx';
import useSellReturnContext from './Logic/SellReturn.jsx';
import usePeopleContext from './Logic/People.jsx';
import useAreasContext from './Logic/useAreasContext.jsx';
import usePurchaseReturnContext from './Logic/PurchaseReturn.jsx';

// Utility function for updating items in an array
const updateItem = (items, id, updatedItem) =>
  items.map((item) => (item.id === id ? { ...item, ...updatedItem } : item));

// Utility function for deleting items from an array
const deleteItem = (items, id) => items.filter((item) => item.id !== id);

// Create the context
const AppContext = createContext();

// Context Provider
export const AppContextProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
 const afterFirstTimeCheck = useRef(false);
 const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);
  // Contexts
  const companyContext = useCompanyContext();
 const purchaseReturnContext = usePurchaseReturnContext();
  const unitContext = useUnitsContext();
  const productContext = useProductContext();
  const areasContext = useAreasContext();
  const peopleContext = usePeopleContext();
  const supplierCustomerContext = useSupplierAndCustomerContext();
  const settingContext = useSettingsContext();
  const costContext = useCostContext();
  const notificationContext = useNotificationContext()
  const creditManagementContext = useCreditManagementContext();
  const purchaseContext = usePurchaseContext();
  const SaleContext = useSalesContext();
 const  SellReturnContext =  useSellReturnContext()
  const { settings } = settingContext;
  const [language, setLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(true);
   // Session ko check karne ke liye useEffect ko update karein
  useEffect(() => {
    const sessionData = localStorage.getItem('userSession');
    if (sessionData) {
      const parsedData = JSON.parse(sessionData);
      setIsAuthenticated(true);
      setSubscriptionStatus(parsedData.subscriptionStatus);
      setSubscriptionEndDate(parsedData.subscriptionEndDate);
      ClientDatabaseInitializer(JSON.parse(parsedData.clientDbConfig));
    }
  }, []); // Yeh sirf ek baar chalega jab app load hogi

 
  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        isOpen,
        setIsOpen,
        isAuthenticated,
        areasContext,
        setIsAuthenticated,
        notificationContext,
        companyContext,
        peopleContext,
        purchaseReturnContext,
        unitContext,
        productContext,
        supplierCustomerContext,
        purchaseContext,
        costContext,
        SaleContext,
        SellReturnContext,
        settingContext,
        creditManagementContext,    
        subscriptionStatus, // Provide to app
        setSubscriptionStatus, // To update from login
        subscriptionEndDate,
        setSubscriptionEndDate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
