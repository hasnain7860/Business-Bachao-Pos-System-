import React, { createContext,useEffect, useContext, useState } from 'react';
import Cookies from 'js-cookie';
import useCompanyContext from './Logic/Company.jsx'
import useBrandsContext from './Logic/Brands.jsx'
import useUnitsContext from './Logic/Units.jsx'
import useProductContext from './Logic/Product.jsx'
import useSupplierAndCustomerContext from './Logic/SupplierAndCustomer.jsx'
import usePurchaseContext from './Logic/Purchase.jsx'
import useSalesContext from './Logic/Sales.jsx'
import useSettingsContext from './Logic/Settings.jsx'



// Utility function for updating items in an array
const updateItem = (items, id, updatedItem) =>
  items.map((item) => {
    
    return (
    item.id == id ? { ...item, ...updatedItem } : item)
    });

// Utility function for deleting items from an array
const deleteItem = (items, id) => items.filter((item) => item.id !== id);

// Create the context
const AppContext = createContext();

// Context Provider
export const AppContextProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);


    // companyContext
  const companyContext = useCompanyContext()
  
// brandContext
const brandContext = useBrandsContext()

  // UnitContext
  const unitContext = useUnitsContext()
    // ProductContext
  const productContext = useProductContext()
    // supplierCustomerContext
  const supplierCustomerContext = useSupplierAndCustomerContext()
  
  const settingContext = useSettingsContext()
  
  
  const purchaseContext = usePurchaseContext()
  const SaleContext =useSalesContext()
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
        settingContext
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