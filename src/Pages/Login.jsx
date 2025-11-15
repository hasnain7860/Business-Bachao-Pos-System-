import React, { useState, useEffect } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { Navigate } from "react-router-dom";
// import { adminDb } from '../Utils/AuthViaFirebase.jsx'; // Iski zaroorat nahi
// import { collection, getDocs } from "firebase/firestore"; // Iski zaroorat nahi
// import bcrypt from 'bcryptjs'; // Iski zaroorat nahi
import Cookies from 'js-cookie';
// import { syncDataInRealTime } from "../Logic/syncDataInRealTime.jsx" // Unused
import { ClientDatabaseInitializer } from "../Utils/ClientFirebaseDb.jsx";

const Login = () => {
  const context = useAppContext();
  const { 
    isAuthenticated, 
    setIsAuthenticated, 
    setSubscriptionStatus, // Context se lein
    setSubscriptionEndDate, // Context se lein
    setAuthToken, // Context se lein (Abhi add karenge)
    setEmail, // Context se lein (Abhi add karenge)
    setUid, // Context se lein (Abhi add karenge)
  } = context;
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state add karein

  // Ye state shayad ab yahan zaroori nahi, kyunki settingContext ab AppContext mein hai
  // const [form, setForm] = useState({
  //   business: { firebaseStorePass: '' }
  // });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      setError("Both fields are required.");
      return;
    }

    setIsLoading(true); // Loading shuru
    setError(""); // Purana error clear karein

    try {
      const apiUrl = import.meta.env.PROD
        ? "/api/login"
        : `${import.meta.env.VITE_API_BASE_URL}/api/login`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }
console.log("data.............." + JSON.stringify(data))
      // Login successful!
      // Cookies (Aapki marzi hai, lekin localStorage session PWA ke liye behtar hai)
      Cookies.set('userName', data.name, { expires: 365 });
      Cookies.set('userRole', data.role, { expires: 365 });

      // Client DB initialize karein
      ClientDatabaseInitializer(JSON.parse(data.adminFirebaseObject));

      // PWA ke liye localStorage mein poora session save karein
      const sessionData = {
        isAuthenticated: true,
        token: data.token, // <-- Naya token save karein
        uid: data.uid,
        email: data.email,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionEndDate: data.subscriptionEndDate,
        clientDbConfig: data.adminFirebaseObject,
      };
      localStorage.setItem('userSession', JSON.stringify(sessionData));

      // Context state ko update karein
      setIsAuthenticated(true);
      setAuthToken(data.token); // Context mein token set karein
      setUid(data.uid); // Context mein uid set karein
      setEmail(data.email); // Context mein email set karein
      setSubscriptionStatus(data.subscriptionStatus);
      setSubscriptionEndDate(data.subscriptionEndDate);

      // Ab Navigate component khud hi redirect kar dega
      
    } catch (err) { {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    } } finally {
      setIsLoading(false); // Loading khatam
    }
  };

  // Ye useEffect ab zaroori nahi lag raha
  // useEffect(() => {
  //   if (form.business.firebaseStorePass) {
  //     ClientDatabaseInitializer(JSON.parse(form.business.firebaseStorePass))   
  //   }
  // }, [form, context]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />; // 'replace' add karein
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={`w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
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

