
import React, { useState, useEffect } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { Navigate } from "react-router-dom";
import { adminDb } from '../Utils/AuthViaFirebase.jsx';
import { collection, getDocs } from "firebase/firestore";
import bcrypt from 'bcryptjs';
import Cookies from 'js-cookie';
import { syncDataInRealTime } from "../Logic/syncDataInRealTime.jsx"
import { ClientDatabaseInitializer } from "../Utils/ClientFirebaseDb.jsx";


const Login = () => {
  const context = useAppContext();
  const { isAuthenticated, setIsAuthenticated } = context;
  const { saveSetting } = context.settingContext;
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [form, setForm] = useState({

    business: { firebaseStorePass: '' }
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // File: Login.js (Updated handleSubmit function)

const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
        setError("Both fields are required.");
        return;
    }

    try {
     
      const apiUrl = import.meta.env.PROD 
  ? "/api/login" 
  : `${import.meta.env.VITE_API_BASE_URL}/api/login`;
console.log("condition" + import.meta.env.PROD )
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed.');
        }

        // Login successful!
        Cookies.set('userName', data.name, { expires: 3 });
        Cookies.set('userRole', data.role, { expires: 3 });

        // IMPORTANT: Subscription status ko context mein save karein
        // Hum yeh agle step mein karenge. Abhi ke liye client DB initialize karein.
        ClientDatabaseInitializer(JSON.parse(data.adminFirebaseObject));

        // Context aur local storage mein user data save karein taaki session bana rahe
        const sessionData = {
            isAuthenticated: true,
            subscriptionStatus: data.subscriptionStatus,
            subscriptionEndDate: data.subscriptionEndDate,
            clientDbConfig: data.adminFirebaseObject,
            email:data.email,
            uid:data.uid
            
        };
        localStorage.setItem('userSession', JSON.stringify(sessionData));

        setIsAuthenticated(true);
        // Context mein subscription status bhi set karna hoga.

    } catch (err) {
        setError(err.message);
        setTimeout(() => setError(""), 3000);
    }
};


  // Use useEffect to call saveSetting after form state updates
  useEffect(() => {
    if (form.business.firebaseStorePass) {
      ClientDatabaseInitializer(JSON.parse(form.business.firebaseStorePass))   
    
    }
  }, [form, context]);

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark transition"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm">
            <a href="/forgot-password" className="text-primary hover:underline">
              Forgot Password?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
