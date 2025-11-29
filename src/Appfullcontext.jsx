import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORE_NAMES } from './Utils/IndexedDb.jsx';
import useUniversalStore from './Logic/useUniversalStore.jsx';
import { ClientDatabaseInitializer } from './Utils/ClientFirebaseDb.jsx';
import useNotificationContext from './Logic/Notifications.jsx'; 

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [uid, setUid] = useState(null);
  const [email, setEmail] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);
  const [language, setLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(true);

  // --- UNIVERSAL STORES (Using Correct Keys) ---
  
  const peopleStore = useUniversalStore(STORE_NAMES.people);
  const productStore = useUniversalStore(STORE_NAMES.products);
  const unitStore = useUniversalStore(STORE_NAMES.units);
  
  // ✅ FIX 1: Singular 'cost' use karo
  const costStore = useUniversalStore(STORE_NAMES.cost); 
  
  const purchaseStore = useUniversalStore(STORE_NAMES.purchases);
  const salesStore = useUniversalStore(STORE_NAMES.sales);
  const areasContext = useUniversalStore(STORE_NAMES.areas);
  const preordersContext = useUniversalStore(STORE_NAMES.preorders);
  const damageContext = useUniversalStore(STORE_NAMES.damage);
  const purchaseReturnContext = useUniversalStore(STORE_NAMES.purchaseReturns);
  const sellReturnContext = useUniversalStore(STORE_NAMES.sellReturns);
  const supplierCustomerStore = useUniversalStore(STORE_NAMES.suppliers);
  
  // ✅ FIX 2: 'creditManagement' use karo
  const creditManagementContext = useUniversalStore(STORE_NAMES.creditManagement);
  
  const settingContext = useUniversalStore(STORE_NAMES.settings);
  const notificationContext = useNotificationContext();

  // --- COMPANY WRAPPER ---
  const companyStore = useUniversalStore(STORE_NAMES.company);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const companyContext = {
    ...companyStore, 
    selectedCompany,
    select: (id) => setSelectedCompany(companyStore.data.find((c) => c.id === id) || null),
    remove: async (id) => {
      await companyStore.remove(id);
      if (selectedCompany?.id === id) setSelectedCompany(null);
    }
  };

  useEffect(() => {
    const sessionData = localStorage.getItem('userSession');
    if (sessionData) {
      try {
        const parsedData = JSON.parse(sessionData);
        if (parsedData.isAuthenticated && parsedData.token && parsedData.clientDbConfig) {
          setIsAuthenticated(true);
          setAuthToken(parsedData.token);
          setUid(parsedData.uid);
          setEmail(parsedData.email);
          setSubscriptionStatus(parsedData.subscriptionStatus);
          setSubscriptionEndDate(parsedData.subscriptionEndDate);
          ClientDatabaseInitializer(JSON.parse(parsedData.clientDbConfig));
        } else {
          localStorage.removeItem('userSession');
        }
      } catch (error) {
        console.error("Failed to parse session:", error);
        localStorage.removeItem('userSession');
      }
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('userSession');
    setIsAuthenticated(false);
    setAuthToken(null);
    setUid(null);
    setEmail(null);
    setSubscriptionStatus('inactive');
    setSubscriptionEndDate(null);
  };

  return (
    <AppContext.Provider
      value={{
        language, setLanguage,
        isOpen, setIsOpen,
        isAuthenticated, setIsAuthenticated,
        authToken, setAuthToken,
        uid, setUid,
        email, setEmail,
        subscriptionStatus, setSubscriptionStatus,
        subscriptionEndDate, setSubscriptionEndDate,
        logout,

        // Data Contexts
        peopleContext: peopleStore,
        productContext: productStore,
        unitContext: unitStore,
        costContext: costStore,
        purchaseContext: purchaseStore,
        SaleContext: salesStore,
        areasContext,
        preordersContext,
        damageContext,
        purchaseReturnContext,
        SellReturnContext: sellReturnContext,
        supplierCustomerContext: supplierCustomerStore,
        creditManagementContext,
        settingContext,
        notificationContext, 
        companyContext, 
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};


