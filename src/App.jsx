import { useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useNavigate
} from "react-router-dom";
import "./App.css";
import Navbar from "./components/element/Navbar";
import Layout from "./Layout";
import Dashboard from "./Pages/dashboard";
import Login from "./Pages/Login.jsx";
import Profile from "./Pages/Profile.jsx";
import Settings from "./Pages/Settings.jsx";
import Suppliers from "./Pages/suppliers.jsx";
import Customer from "./Pages/customer.jsx";
import Company from "./Pages/Company.jsx";
import Brands from "./Pages/Brands.jsx";
import Unit from "./Pages/Unit.jsx";
import AddProduct from "./Pages/AddProduct.jsx";
import Products from "./Pages/Products.jsx";
import Purchases from "./Pages/Purchases.jsx";
import NewPurchases from "./Pages/NewPurchases.jsx";
import DataSync from "./Pages/DataSync.jsx";
import Sales from "./Pages/Sales.jsx";
import NewSales from "./Pages/NewSales.jsx";
import SalesView from "./Pages/SalesView.jsx";
import ProtectedRoute from "./components/element/ProtectedRoute";
// import eruda from 'eruda';

function App() {
    // eruda.init();

    return (
        <Router>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Dashboard />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Profile />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Settings />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/people/suppliers"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Suppliers />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/people/customers"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Customer />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/Company"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Company />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/brands"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Brands />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/units"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Unit />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/addProduct"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AddProduct />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/edit-product/:id"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AddProduct />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/Products"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Products />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/purchases/"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Purchases />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/purchases/new"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <NewPurchases />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sales"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Sales />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sales/new"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <NewSales />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                     <Route
                    path="/sales/view/:id"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <SalesView />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                     <Route
                  
                    path="/sales/view/:id/print"
                    element={
                        <ProtectedRoute>
                          
                                <SalesView />
                            
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/data"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <DataSync />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
