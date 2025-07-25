import React, { useState, useEffect, useRef } from "react";
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
  FiClipboard,
} from "react-icons/fi";
import { MdInventory } from "react-icons/md";
import Cookies from 'js-cookie';
// Language data for translations
import languageData from "../../assets/languageData.json";

import Syncauto from "../Syncauto.jsx";
import {clearAllStores }  from '../../Logic/ClearAllStores.jsx'



import { useAppContext } from '../../Appfullcontext.jsx';


const Navbar = () => {
    const { setIsAuthenticated, settingContext, language, setLanguage } = useAppContext();
    const [notificationCount, setNotificationCount] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});
    
    const sidebarRef = useRef(null);
    const menuButtonRef = useRef(null);

    const businessName = settingContext?.settings[0]?.business?.businessName || "POS System";
    const userRole = Cookies.get('userRole') || 'seller'; // Default 'seller' agar role set na ho

    // --- Navigation Links Data Structure ---
    // Yahan humne saare links ko ek array mein daal diya hai
    const navLinks = [
        { path: "/", labelKey: "dashboard", icon: AiOutlineDashboard, roles: ['Admin', 'seller'] },
        { path: "/people", labelKey: "people", icon: FiUsers, roles: ['Admin', 'seller'] },
        {
            labelKey: "inventory", icon: MdInventory, roles: ['Admin'],
            children: [
                { path: "/inventory/company", labelKey: "company", roles: ['Admin'] },
                { path: "/inventory/products", labelKey: "products", roles: ['Admin'] },
                { path: "/inventory/upload-Products", labelKey: "upload_products", roles: ['Admin'] },
                { path: "/inventory/units", labelKey: "units", roles: ['Admin'] },
            ]
        },
        {
            labelKey: "return", icon: MdInventory, roles: ['Admin'],
            children: [
                { path: "/return/sell_return", labelKey: "sell_return", roles: ['Admin'] },
                { path: "/return/purchase_return", labelKey: "purchase_return", roles: ['Admin'] },
            ]
        },
        { path: "/sales", labelKey: "sales", icon: FiClipboard, roles: ['Admin'] },
        { path: "/purchases", labelKey: "purchases", icon: FiClipboard, roles: ['Admin'] },
        { path: "/CreditManagement", labelKey: "credit_management", icon: FiClipboard, roles: ['Admin', 'seller'] },
        { path: "/Cost", labelKey: "cost_management", icon: FiClipboard, roles: ['Admin', 'seller'] },
        { path: "/data", labelKey: "data_sync", icon: FiClipboard, roles: ['Admin'] },
        { path: "/settings", labelKey: "settings", icon: FiSettings, roles: ['Admin'] },
    ];

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'en' ? 'ur' : 'en'));
    };

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
    
    const toggleSection = (sectionKey) => {
        setCollapsedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    };

    const handleLogout = async () => {
        await clearAllStores();
        Cookies.remove('userName');
        Cookies.remove('userRole');
        await setIsAuthenticated(false);
        // alert ko hata kar console log use karein ya toast notification
        console.log("Logging out...");
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                sidebarRef.current && !sidebarRef.current.contains(event.target) &&
                menuButtonRef.current && !menuButtonRef.current.contains(event.target)
            ) {
                setIsSidebarOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Sidebar Links Renderer ---
    // Yeh function data structure se links generate karega
    const renderNavLinks = (links) => {
        return links.filter(link => link.roles.includes(userRole)).map((link, index) => {
            const key = link.labelKey || index;
            const Icon = link.icon;

            // Agar link ke andar children hain (nested section)
            if (link.children) {
                return (
                    <li key={key}>
                        <button
                            onClick={() => toggleSection(key)}
                            className="w-full flex justify-between items-center text-left text-base py-2 px-4 rounded-md hover:bg-gray-700"
                        >
                            <span className="flex items-center">
                                {Icon && <Icon className="mr-3" />}
                                {languageData[language][link.labelKey]}
                            </span>
                            {collapsedSections[key] ? <AiOutlineRight size={20} /> : <AiOutlineDown size={20} />}
                        </button>
                        <ul className={`mt-2 space-y-2 ${collapsedSections[key] ? "hidden" : "block"}`}>
                            {renderNavLinks(link.children)}
                        </ul>
                    </li>
                );
            }

            // Simple link
            return (
                <li key={key}>
                    <Link
                        to={link.path}
                        className="text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all"
                    >
                        {Icon && <Icon className="mr-3" />}
                        {languageData[language][link.labelKey]}
                    </Link>
                </li>
            );
        });
    };
    
    return (
        <div>
            <Syncauto />
            {/* Navbar */}
            <nav className={`fixed top-0 left-0 w-full bg-gray-800 text-white shadow-md z-50 p-4 flex items-center transition-all duration-300 h-20 justify-between ${language === 'ur' ? 'flex-row-reverse' : ''}`}>
                <button onClick={toggleSidebar} ref={menuButtonRef} className="text-xl font-bold px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600">
                    ☰
                </button>
                <h1 className="text-2xl font-bold">{businessName}</h1>
                <div className={`flex items-center space-x-4 transition-all duration-300 ${language === 'ur' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Link to="/notifications" className="relative p-2 bg-gray-700 rounded-full hover:bg-gray-600">
                        🔔
                        {notificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {notificationCount}
                            </span>
                        )}
                    </Link>
                    <button onClick={toggleLanguage} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
                        {languageData[language].toggle_language}
                    </button>
                    <Link to="/sales/new" className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
                        {languageData[language].sales}
                    </Link>
                </div>
            </nav>

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className={`fixed top-20 ${language === "ur" ? "right-0" : "left-0"} h-full bg-gray-800 text-white shadow-md z-40 transform ${isSidebarOpen ? "translate-x-0" : language === "ur" ? "translate-x-full" : "-translate-x-full"} transition-transform duration-300 w-64 overflow-y-auto`}
                style={{ direction: language === "ur" ? "rtl" : "ltr" }}
            >
                <div className="flex flex-col justify-between h-full">
                    <ul className="p-2">
                        {renderNavLinks(navLinks)}
                        {/* Logout Link (alag se, kyunki iska logic different hai) */}
                        <li>
                            <button onClick={handleLogout} className="w-full text-base py-2 px-4 flex items-center rounded-md hover:bg-gray-700 transition-all">
                                <FiLogOut className="mr-3" />
                                {languageData[language].logout}
                            </button>
                        </li>
                    </ul>
                    <div className="text-base pb-20 pl-5">
                        version 3.0.0
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
