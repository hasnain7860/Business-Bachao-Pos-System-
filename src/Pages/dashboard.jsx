import React, { useState } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { 
  FaUsers, 
  FaChartLine, 
  FaShoppingCart, 
  FaFileInvoice, 
  FaMoneyBillWave, 
  FaRegChartBar, 
  
} from "react-icons/fa";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import { MdInventory, MdReport } from "react-icons/md";
import { BsSun, BsMoon } from "react-icons/bs";
import { FiLogOut } from "react-icons/fi";

const POSDashboard = () => {
  
  const context = useAppContext(); // Destructure context values
  console.log(context.isAuthenticated)
  const customers = context.supplierCustomerContext.customers
  const suppliers = context.supplierCustomerContext.suppliers 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
const userAndBusinessDetail = context.settingContext.settings;
  const toggleSidebar = () => {
    
    setIsSidebarOpen(!isSidebarOpen);
  };
  

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className={`flex {darkMode ? "dark" : ""}`}>

      {/* Main Content */}
      <div className="flex-1 bg-base-100 min-h-screen p-4">
        {/* Navbar */}


        {/* Dashboard Content */}
        <div className=" mt-32  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="card bg-primary text-primary-content p-4 shadow-md">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaShoppingCart />
              <span>Total Sales</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{userAndBusinessDetail[0].business.currency}25,000</p>
          </div>
          <div className="card bg-accent text-accent-content p-4 shadow-md">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>Customers</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{          customers.length }</p>
          </div>
          <div className="card bg-amber-400 text-accent-content p-4 shadow-md">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaUsers />
              <span>suppliers</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{          suppliers.length }</p>
          </div>
          <div className="card bg-secondary text-secondary-content p-4 shadow-md">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <MdInventory />
              <span>Products</span>
            </h2>
            <p className="text-2xl font-bold mt-2">450</p>
          </div>
          <div className="card bg-warning text-warning-content p-4 shadow-md">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <MdReport />
              <span>Reports</span>
            </h2>
            <p className="text-2xl font-bold mt-2">15 Pending</p>
          </div>
          {/* New Cards */}
          <div className="card bg-success text-success-content p-4 shadow-md">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaRegChartBar />
              <span>Total Orders</span>
            </h2>
            <p className="text-2xl font-bold mt-2">3,400</p>
          </div>
          <div className="card bg-info text-info-content p-4 shadow-md">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaMoneyBillWave />
              <span>Total Revenue</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{userAndBusinessDetail[0].business.currency}75,000</p>
          </div>
          <div className="card bg-danger text-danger-content p-4 shadow-md">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              
              <span>Returns</span>
            </h2>
            <p className="text-2xl font-bold mt-2">120</p>
          </div>
          <div className="card bg-dark text-dark-content p-4 shadow-md">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FaFileInvoice />
              <span>Expenses</span>
            </h2>
            <p className="text-2xl font-bold mt-2">{userAndBusinessDetail[0].business.currency}12,500</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSDashboard;