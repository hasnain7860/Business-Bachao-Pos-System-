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
import CreditManagement from "./Pages/CreditManagement.jsx";
import Settings from "./Pages/Settings.jsx";
import People from "./Pages/People.jsx";    
import Suppliers from "./Pages/suppliers.jsx";
import Customer from "./Pages/customer.jsx";
import Company from "./Pages/Company.jsx";

import Unit from "./Pages/Unit.jsx";
import AddProduct from "./Pages/AddProduct.jsx";
import Products from "./Pages/Products.jsx";
import Purchases from "./Pages/Purchases.jsx";
import NewPurchases from "./Pages/NewPurchases.jsx";
import DataSync from "./Pages/DataSync.jsx";
import Sales from "./Pages/Sales.jsx";
import Cost from "./Pages/Cost.jsx";
import AddPurchaseReturn from "./Pages/AddPurchaseReturn.jsx";
import NewSales from "./Pages/NewSales.jsx";
import SalesView from "./Pages/SalesView.jsx";
import ProtectedRoute from "./components/element/ProtectedRoute";

import AddPayments from "./Pages/AddPayments";
import ViewPayments from "./Pages/ViewPayments";
import Notification from "./Pages/Notification";
import ProductUploadPage from "./Pages/ProductUploadPage";
import PurchaseReturn from "./Pages/PurchaseReturn.jsx";
import SellReturn from "./Pages/SellReturn.jsx";
import AddSellReturn from "./Pages/AddSellReturn.jsx";
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
                    path="/notifications"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Notification/>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/CreditManagement"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <CreditManagement />
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
                    path="/people"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <People/>
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
                    path="/inventory/addProduct/:id"
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
                    path="/inventory/upload-Products"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ProductUploadPage />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                  <Route
                    path="/return/sell_return"
                    element={
                        <ProtectedRoute>
                            <Layout>
                            <SellReturn/>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                 <Route
                    path="/return/sell_return/add"
                    element={
                        <ProtectedRoute>
                            <Layout>
                            <AddSellReturn/>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                  <Route
                    path="/return/purchase_return"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <PurchaseReturn/>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                 <Route
                    path="/return/purchase_return/add"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AddPurchaseReturn/>
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
                    path="/sales/return/:id"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <SellReturn/>
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
                    path="/:ref/addPayments/:id"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AddPayments />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                 <Route
                    path="/:ref/viewPayments/:id"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ViewPayments />
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
                    path="/Cost"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Cost />
                            </Layout>
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
