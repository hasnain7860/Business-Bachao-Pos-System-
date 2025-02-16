import React, { useState, useEffect , useRef} from "react";
import { Link } from "react-router-dom";
import {
  AiOutlineDown,
  AiOutlineRight,
  AiOutlineDashboard,
} from "react-icons/ai";
import {
  FiSettings,
  FiLogOut,
  FiUsers,
  FiPackage,
  FiShoppingCart,
  FiClipboard,
} from "react-icons/fi";





import {clearAllStores }  from '../../Logic/ClearAllStores.jsx'
import { MdInventory, MdPerson } from "react-icons/md";
import { useAppContext } from '../../Appfullcontext.jsx';

const Navbar = () => {
  const { setIsAuthenticated , settingContext} = useAppContext();
const [language, setLanguage] = useState('en');

const businessName = settingContext?.settings

console.log(businessName)
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
      {/* Navbar */}
   <nav className="fixed top-0 left-0 w-full bg-gray-800 text-white shadow-md z-50 p-4 flex justify-between items-center">
  <button
    onClick={toggleSidebar}    ref={menuButtonRef}
    className="text-xl font-bold px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
  >
    ☰
  </button>
<h1 className="text-2xl font-bold">
  {settingContext?.settings?.business?.businessName || "POS System"}
</h1>
  <div className="flex items-center space-x-4">
          <button
            onClick={toggleLanguage}
            className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
          >
            {language === 'en' ? 'EN' : 'PK'}
          </button>
          <Link
            to="/sales/new"
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            Sales
          </Link>
        </div>
</nav>

      {/* Sidebar */}
      <div   ref={sidebarRef}
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white shadow-md z-40 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 w-64 overflow-y-auto`}
      >
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Menu</h2>
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
              Dashboard
            </Link>
          </li>

          {/* People Section */}
          <li>
            <button
              onClick={() => toggleSection("people")}
              className="w-full flex justify-between items-center text-left text-base py-2 px-4 rounded-md hover:bg-gray-700"
            >
              <FiUsers className="mr-3" />
              People
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
                  Customers
                </Link>
              </li>
              <li>
                <Link
                  to="/people/suppliers"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                  Suppliers
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
              Inventory
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
                  Company
                </Link>
              </li>
              <li>
                <Link
                  to="/inventory/brands"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                  Brands
                </Link>
              </li>
              <li>
                <Link
                  to="/inventory/products"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  to="/inventory/units"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                  Units
                </Link>
              </li>
            </ul>
          </li>

   



          {/* Sales Section */}
          <li>
            <button
              onClick={() => toggleSection("sales")}
              className="w-full flex justify-between items-center text-left text-base py-2 px-4 rounded-md hover:bg-gray-700"
            >
              <FiClipboard size={20} />
              Sales
              {collapsedSections["sales"] ? (
                <AiOutlineRight size={20} />
              ) : (
                <AiOutlineDown size={20} />
              )}
            </button>
            <ul
              className={`mt-2 space-y-2 ${
                collapsedSections["sales"] ? "hidden" : "block"
              }`}
            >

          <li>
            <Link
              to="/sales"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
              <FiClipboard className="mr-3" />
              Sales
            </Link>
          </li>
              <li>
                <Link
                  to="/sales"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                  Sales Report
                </Link>
              </li>
            </ul>
          </li>

          {/* Purchases Section */}
          <li>
            <button
              onClick={() => toggleSection("purchases")}
              className="w-full flex justify-between items-center text-left text-base py-2 px-4 rounded-md hover:bg-gray-700"
            >
              <FiClipboard size={20} />
              Purchases
              {collapsedSections["purchases"] ? (
                <AiOutlineRight size={20} />
              ) : (
                <AiOutlineDown size={20} />
              )}
            </button>
            <ul
              className={`mt-2 space-y-2 ${
                collapsedSections["purchases"] ? "hidden" : "block"
              }`}
            >
              <li>
                <Link
                  to="/purchases"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                  New Purchase
                </Link>
              </li>
              <li>
                <Link
                  to="/purchases/returns"
                  className="block text-sm py-2 px-4 rounded-md hover:bg-gray-600 transition-all"
                >
                  Purchase Returns
                </Link>
              </li>
            </ul>
          </li>
                    {/* Credit Management */}
          <li>
            <Link
              to="/CreditManagement"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
              <MdPerson className="mr-3" />
              Credit Management
            </Link>
          </li>

                    {/* Manage Users */}
          <li>
            <Link
              to="/manage-users"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
              <MdPerson className="mr-3" />
              Manage Users
            </Link>
          </li>

          {/* data sysnc */}
          <li>
            <Link
              to="/data"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >

              Data sync
            </Link>
          </li>

          {/* Settings */}
          <li>
            <Link
              to="/settings"
              className="block text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
              <FiSettings className="mr-3" />
              Settings
            </Link>
          </li>

          {/* Logout */}
          <li>
            <button
              onClick={handleLogout}
              className="w-full text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
            >
              <FiLogOut className="mr-3" />
              Logout
            </button>
            </li>
          
        </ul>
      </div>
    </div>
  );
};

export default Navbar;  