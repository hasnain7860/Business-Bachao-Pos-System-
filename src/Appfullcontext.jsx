
import React, { createContext, useEffect, useContext, useState } from 'react';
import useCompanyContext from './Logic/Company.jsx';
import useBrandsContext from './Logic/Brands.jsx';
import useUnitsContext from './Logic/Units.jsx';
import useProductContext from './Logic/Product.jsx';
import useSupplierAndCustomerContext from './Logic/SupplierAndCustomer.jsx';
import usePurchaseContext from './Logic/Purchase.jsx';
import useSalesContext from './Logic/Sales.jsx';
import useSettingsContext from './Logic/Settings.jsx';
import useCreditManagementContext from './Logic/CreditManagement.jsx';

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
 
  // Contexts
  const companyContext = useCompanyContext();
  const brandContext = useBrandsContext();
  const unitContext = useUnitsContext();
  const productContext = useProductContext();
  const supplierCustomerContext = useSupplierAndCustomerContext();
  const settingContext = useSettingsContext();
  const creditManagementContext = useCreditManagementContext();
  const purchaseContext = usePurchaseContext();
  const SaleContext = useSalesContext();

  const { settings } = settingContext;

 
  useEffect(() => {
    // Check if settings is an array and has at least one element
    if (settings && settings.length > 0 && settings[0].business && settings[0].business.firebaseStorePass) {
      console.log("true firebase: " + settings[0].business.firebaseStorePass);
      setIsAuthenticated(true);
    }
  }, [settings]); // Dependency array includes settings to run effect when settings change

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        companyContext,
        brandContext,
        unitContext,
        productContext,
        supplierCustomerContext,
        purchaseContext,
        SaleContext,
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
