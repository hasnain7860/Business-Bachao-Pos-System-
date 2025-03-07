
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
    user: { name: '', phoneNo: '', email: '', signature: '' },
    business: { businessName: '', phoneNo: '', email: '', currency: '', role: '', firebaseStorePass: '' }
  });

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

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(adminDb, "client"));
      const users = querySnapshot.docs.map(doc => doc.data());

      for (let user of users) {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (user.email === email && passwordMatch) {
          Cookies.set('userName', user.name, { expires: 3 });
          Cookies.set('userRole', user.role, { expires: 3 });

          // Update form state
          setForm({
            user: { name: '', phoneNo: '', email: '', signature: '' },
            business: { businessName: '', phoneNo: '', email: '', currency: '$', role: '', firebaseStorePass: user.AdminFirebaseObject }
          });
          
          setIsAuthenticated(true);
          return;
        }
      }

      setError("Invalid email or password.");
      setTimeout(() => setError(""), 3000); // Auto-hide error after 3 sec

    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Error during authentication.");
    }
  };

  // Use useEffect to call saveSetting after form state updates
  useEffect(() => {
    if (form.business.firebaseStorePass) {
      ClientDatabaseInitializer(JSON.parse(form.business.firebaseStorePass))   
      syncDataInRealTime(context);
      // .then(() => {
         
        
      //     // setTimeout(() => {
           
      //     // }, 8000); // 2000 milliseconds = 2 seconds
      //   })
      //   .catch((err) => {
      //     console.error('Failed to save setting:', err);
      //   });
    }
  }, [form, saveSetting, context]);

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
