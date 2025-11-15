import React, { createContext, useEffect, useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Logout ke baad redirect ke liye
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
import usePreordersContext from './Logic/usePreordersContext.jsx';
import usePurchaseReturnContext from './Logic/PurchaseReturn.jsx';

// Utility functions (Aapke original code se)
const updateItem = (items, id, updatedItem) =>
  items.map((item) => (item.id === id ? { ...item, ...updatedItem } : item));
const deleteItem = (items, id) => items.filter((item) => item.id !== id);

// Create the context
const AppContext = createContext();

// Context Provider
export const AppContextProvider = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null); // <-- Naya state token ke liye
  const [uid, setUid] = useState(null); // <-- Naya state uid ke liye
  const [email, setEmail] = useState(null); // <-- Naya state email ke liye
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);
  
  // App UI state
  const [language, setLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(true);

  // Contexts
  const companyContext = useCompanyContext();
  const purchaseReturnContext = usePurchaseReturnContext();
  const unitContext = useUnitsContext();
  const productContext = useProductContext();
  const areasContext = useAreasContext();
  const preordersContext = usePreordersContext();
  const peopleContext = usePeopleContext();
  const supplierCustomerContext = useSupplierAndCustomerContext();
  const settingContext = useSettingsContext();
  const costContext = useCostContext();
  const notificationContext = useNotificationContext()
  const creditManagementContext = useCreditManagementContext();
  const purchaseContext = usePurchaseContext();
  const SaleContext = useSalesContext();
  const SellReturnContext = useSellReturnContext()

  // Session ko check karne ke liye useEffect
  useEffect(() => {
    const sessionData = localStorage.getItem('userSession');
    if (sessionData) {
      try {
        const parsedData = JSON.parse(sessionData);
        if (parsedData.isAuthenticated && parsedData.token && parsedData.clientDbConfig) {
          // Sab kuch theek hai, state set karein
          setIsAuthenticated(true);
          setAuthToken(parsedData.token); // <-- Token set karein
          setUid(parsedData.uid); // <-- Uid set karein
          setEmail(parsedData.email); // <-- Email set karein
          setSubscriptionStatus(parsedData.subscriptionStatus);
          setSubscriptionEndDate(parsedData.subscriptionEndDate);
          
          // Client DB initialize karein
          ClientDatabaseInitializer(JSON.parse(parsedData.clientDbConfig));
        } else {
          // Session data corrupt hai, clear karein
          localStorage.removeItem('userSession');
        }
      } catch (error) {
        console.error("Failed to parse user session:", error);
        localStorage.removeItem('userSession');
      }
    }
  }, []); // Yeh sirf ek baar chalega jab app load hogi

  // --- Naya Logout Function ---
  const logout = () => {
    // Clear local storage
    localStorage.removeItem('userSession');
    
    // Clear cookies (optional, agar aap set kar rahe hain)
    Cookies.remove('userName');
    Cookies.remove('userRole');

    // Clear context state
    setIsAuthenticated(false);
    setAuthToken(null);
    setUid(null);
    setEmail(null);
    setSubscriptionStatus('inactive');
    setSubscriptionEndDate(null);

    // Context ke states ko bhi reset karna chahiye (optional, par achhi practice hai)
    // companyContext.reset();
    // productContext.reset();
    // ...etc

    // User ko login page par bhej dein
    // Note: Iske liye AppContextProvider ko <Router> ke andar hona chahiye
    // Agar nahi hai to ye error dega. 
    // Iska behtar tareeqa ye hai ke App component mein logic likhein
    // window.location.href = '/login'; // Ye simple tareeqa hai
  };

  return (
    <AppContext.Provider
      value={{
        // App state
        language,
        setLanguage,
        isOpen,
        setIsOpen,
        
        // Auth state & functions
        isAuthenticated,
        setIsAuthenticated,
        authToken, // <-- Provide karein
        setAuthToken,
        uid, // <-- Provide karein
        setUid,
        email, // <-- Provide karein
        setEmail,
        logout, // <-- Logout function provide karein
        
        // Subscription state
        subscriptionStatus,
        setSubscriptionStatus,
        subscriptionEndDate,
        setSubscriptionEndDate,

        // Sub-contexts
        preordersContext,
        areasContext,
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

