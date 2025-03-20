import React, { useState, useEffect , useRef} from "react";
import { Link } from "react-router-dom";
import {
  AiOutlineDown,
  AiOutlineRight,
  AiOutlineDashboard,
} from "react-icons/ai";

import languageData from "../../assets/languageData.json";

import clsx from "clsx";

import {
  FiSettings,
  FiLogOut,
  FiUsers,
  FiPackage,
  FiShoppingCart,
  FiClipboard,
} from "react-icons/fi";

import Syncauto from "../Syncauto.jsx";



import {clearAllStores }  from '../../Logic/ClearAllStores.jsx'
import { MdInventory, MdPerson } from "react-icons/md";
import { useAppContext } from '../../Appfullcontext.jsx';


const Navbar = () => {
  const { setIsAuthenticated , settingContext,language,setLanguage} = useAppContext();
const [notificationCount, setNotificationCount] = useState(0)

const businessName = settingContext?.settings[0]?.business?.businessName || "POS System"



const toggleLanguage = () => {
  setLanguage((prevLanguage) => (prevLanguage === 'en' ? 'ur' : 'en'));
}; 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const [collapsedSections, setCollapsedSections] = useState({
  people: true,
  inventory: true,
  sales: true,
  purchases: true,
});
  

 

  // Toggle Sidebar
 
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Toggle Collapse for sections
  const toggleSection = (section) => {
    setCollapsedSections((prevState) => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

  // Handle Logout
  const handleLogout =async () => {
   await clearAllStores()
   await setIsAuthenticated(false);
    
    alert("Logging out...");
    // Add your logout logic here
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);


  return (
    <div>
      <Syncauto></Syncauto>
      {/* Navbar */}
      <nav 
  className={`fixed top-0 left-0 w-full bg-gray-800 text-white shadow-md z-50 p-4 flex items-center transition-all duration-300 
  justify-between  ${language === 'ur' ? 'flex-row-reverse' : ''}`}
>
  {/* ☰ Menu Button */}
  <button
    onClick={toggleSidebar}
    ref={menuButtonRef}
    className="text-xl font-bold px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
  >
    ☰
  </button>

  {/* Business Name */}
  <h1 className="text-2xl font-bold">
    {businessName}
  </h1>

  {/* Language, Notifications & Sales Button */}
  <div 
    className={`flex items-center space-x-4 transition-all duration-300 
    ${language === 'ur' ? 'flex-row-reverse space-x-reverse' : ''}`}
  >
    {/* Notification Icon */}
    <Link to="/notifications" className="relative p-2 bg-gray-700 rounded-full hover:bg-gray-600">
      🔔
      {notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {notificationCount}
        </span>
      )}
    </Link>

    {/* Language Toggle Button */}
    <button
      onClick={toggleLanguage}
      className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
    >
      {languageData[language].toggle_language}
    </button>

    {/* Sales Button */}
    <Link
      to="/sales/new"
      className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
    >
      {languageData[language].sales}
    </Link>
  </div>
</nav>



      {/* Sidebar */}
      <div
  ref={sidebarRef}
  className={`fixed top-0 ${
    language === "ur" ? "right-0" : "left-0"
  } h-full bg-gray-800 text-white shadow-md z-40 transform ${
    isSidebarOpen ? "translate-x-0" : language === "ur" ? "translate-x-full" : "-translate-x-full"
  } transition-transform duration-300 w-64 overflow-y-auto`}
  style={{ direction: language === "ur" ? "rtl" : "ltr" }}
>
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{languageData[language].menu}</h2>
          <button
            onClick={toggleSidebar}
            className="text-lg font-bold bg-gray-700 p-1 rounded-md hover:bg-gray-600"
          >
            ✖
          </button>
        </div>
        <ul className="p-4 space-y-2">
          {/* Dashboard */}
          <li>
            <Link
              to="/"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
              <AiOutlineDashboard className="mr-3" />
             {languageData[language].dashboard}
            </Link>
          </li>

          {/* People Section */}
          <li>
            <button
              onClick={() => toggleSection("people")}
              className="w-full flex justify-between items-center text-left text-base py-2 px-4 rounded-md hover:bg-gray-700"
            >
              <FiUsers className="mr-3" />
                {languageData[language].people}
              
              {collapsedSections["people"] ? (
                <AiOutlineRight size={20} />
              ) : (
                <AiOutlineDown size={20} />
              )}
            </button>
            <ul
              className={`mt-2 space-y-2 ${
                collapsedSections["people"] ? "hidden" : "block"
              }`}
            >
              <li>
                <Link
                  to="/people/customers"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
     {languageData[language].customers}
                </Link>
              </li>
              <li>
                <Link
                  to="/people/suppliers"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                       {languageData[language].suppliers}
                </Link>
              </li>
            </ul>
          </li>

          {/* Inventory Section */}
          <li>
            <button
              onClick={() => toggleSection("inventory")}
              className="w-full flex justify-between items-center text-left text-base py-2 px-4 rounded-md hover:bg-gray-700"
            >
              <MdInventory className="mr-3" />
                {languageData[language].inventory}
              {collapsedSections["inventory"] ? (
                <AiOutlineRight size={20} />
              ) : (
                <AiOutlineDown size={20} />
              )}
            </button>
            <ul
              className={`mt-2 space-y-2 ${
                collapsedSections["inventory"] ? "hidden" : "block"
              }`}
            >
              <li>
                <Link
                  to="/inventory/company"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                       {languageData[language].company}
                </Link>
              </li>
            
             
              <li>
                <Link
                  to="/inventory/products"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                       {languageData[language].products}
                </Link>
              </li>
              <li>
                <Link
                  to="/inventory/upload-Products"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                       {languageData[language].upload_products}
                </Link>
              </li>
              <li>
                <Link
                  to="/inventory/units"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                       {languageData[language].units} 
                </Link>
              </li>
            </ul>
          </li>

   



          {/* Sales Section */}

          <li>
            <Link
              to="/sales"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
                 <FiClipboard className="mr-3" />
          {languageData[language].sales}
            </Link>
          </li>



      
        
      

          {/* Purchases Section */}

          <li>
            <Link
              to="/purchases"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
                 <FiClipboard className="mr-3" />
                 {languageData[language].purchases}
            </Link>
          </li>


                    {/* Credit Management */}
          <li>
            <Link
              to="/CreditManagement"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
                {languageData[language].credit_management}
           
            </Link>
          </li>
                    {/* Cost Management */}
          <li>
            <Link
              to="/Cost"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
                   {languageData[language].cost_management}
            </Link>
          </li>

                    {/* Manage Users */}
          {/* <li>
            <Link
              to="/manage-users"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
              <MdPerson className="mr-3" />
              Manage Users
            </Link>
          </li> */}

          {/* data sysnc */}
          <li>
            <Link
              to="/data"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
  {languageData[language].data_sync}
              
            </Link>
          </li>

          {/* Settings */}
          <li>
            <Link
              to="/settings"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
              <FiSettings className="mr-3" />
              {languageData[language].settings}
            </Link>
          </li>

          {/* Logout */}
          <li>
            <button
              onClick={handleLogout}
              className="w-full text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
              <FiLogOut className="mr-3" />
              {languageData[language].logout}
            </button>
            </li>
          
        </ul>
        <div className="absolute bottom-0 pl-5">
        version 1.0.5
          </div>
        </div>
        
      
    </div>
  );
};

export default Navbar;             