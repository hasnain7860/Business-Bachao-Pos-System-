
import React, { useState } from "react";
import { useAppContext } from "../Appfullcontext.jsx";
import { Navigate } from "react-router-dom";
import { adminDb } from '../Utils/AuthViaFirebase.jsx';
import { collection, getDocs } from "firebase/firestore";
import {syncDataInRealTime} from '../Logic/syncDataInRealTime.jsx'
import bcrypt from 'bcryptjs';
import Cookies from 'js-cookie';

const Login = () => {
  const { isAuthenticated, setIsAuthenticated } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      let authenticated = false;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email === email && bcrypt.compareSync(password, data.password)) {
          authenticated = true;
          
          Cookies.set('userName', data.name, { expires: 3 });
          Cookies.set('userRole', data.role, { expires: 3 });
          
        }
      });

      if (authenticated) {
        syncDataInRealTime()
        
        setIsAuthenticated(true);
        
      } else {
        setError("Invalid email or password.");
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Error during authentication.");
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
