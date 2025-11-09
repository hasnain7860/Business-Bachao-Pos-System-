import { useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useNavigate,
    Link
} from "react-router-dom";
import "./App.css";
import Navbar from "./components/element/Navbar";
import Layout from "./Layout";
import Dashboard from "./Pages/dashboard";
import Login from "./Pages/Login.jsx";

import CreditManagement from "./Pages/CreditManagement.jsx";
import Settings from "./Pages/Settings.jsx";
import People from "./Pages/People.jsx";


import Company from "./Pages/Company.jsx";
import Cookies from 'js-cookie';
import Unit from "./Pages/Unit.jsx";
import AddProduct from "./Pages/AddProduct.jsx";
import Products from "./Pages/Products.jsx";
import Purchases from "./Pages/Purchases.jsx";
import NewPurchases from "./Pages/NewPurchases.jsx";
import DataSync from "./Pages/DataSync.jsx";
import Sales from "./Pages/Sales.jsx";
import EditSale from "./Pages/EditSale.jsx"
import Reports from './Pages/reports.jsx'
import Cost from "./Pages/Cost.jsx";
import AddPurchaseReturn from "./Pages/AddPurchaseReturn.jsx";
import NewSales from "./Pages/NewSales.jsx";
import SalesView from "./Pages/SalesView.jsx";
import ProtectedRoute from "./components/element/ProtectedRoute";
import Areas from './Pages/Areas.jsx'
import AddPayments from "./Pages/AddPayments";
import ViewPayments from "./Pages/ViewPayments";
import Notification from "./Pages/Notification";
import Preorders from './Pages/PreordersList.jsx'
import NewPreorders from './Pages/NewPreorder.jsx'

import ProductUploadPage from "./Pages/ProductUploadPage";
import PurchaseReturn from "./Pages/PurchaseReturn.jsx";
import SellReturn from "./Pages/SellReturn.jsx";
import AddSellReturn from "./Pages/AddSellReturn.jsx";
import { useEffect } from "react";
// import eruda from 'eruda';


// AdminOnlyRoute component to restrict access to admin-only routes
const AdminOnlyRoute = ({ children }) => {
    const Navigate = useNavigate()
    const role = Cookies.get('userRole') || 'Admin'; // Default to 'admin' for demo
    if (role !== 'Admin') {
        useEffect(() => {
            Navigate("/sales")
        }, [role])

    }


    return children;
};


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
                    path="/notifications"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Notification />
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
                    path="/Preorders"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Preorders/>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/preorders/new"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <NewPreorders/>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AdminOnlyRoute>
                                    <Settings />
                                </AdminOnlyRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/people"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <People />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/areas"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Areas />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/inventory/Company"
                    element={
                        <ProtectedRoute>

                            <Layout>
                                <AdminOnlyRoute>
                                    <Company />
                                </AdminOnlyRoute>
                            </Layout>



                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/inventory/units"
                    element={
                        <ProtectedRoute>

                            <Layout>
                                <AdminOnlyRoute>
                                    <Unit/>
                                </AdminOnlyRoute>
                            </Layout>


                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/addProduct"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AdminOnlyRoute>
                                    <AddProduct />
                                </AdminOnlyRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/addProduct/:id"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AdminOnlyRoute>
                                    <AddProduct />
                                </AdminOnlyRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/edit-product/:id"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AdminOnlyRoute>
                                    <AddProduct />
                                </AdminOnlyRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/Products"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AdminOnlyRoute>
                                    <Products />
                                </AdminOnlyRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/inventory/upload-Products"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AdminOnlyRoute>
                                    <ProductUploadPage />
                                </AdminOnlyRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/return/sell_return"
                    element={
                        <ProtectedRoute>
                            <Layout>
                      
                                <SellReturn />
                        
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/return/sell_return/add"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AddSellReturn />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/return/sell_return/add/:id"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AddSellReturn />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/return/purchase_return"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                                                 <AdminOnlyRoute>
                                <PurchaseReturn />
                                    </AdminOnlyRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/return/purchase_return/add"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                                                 <AdminOnlyRoute>
                                <AddPurchaseReturn />
                                    </AdminOnlyRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/return/purchase_return/add/:id"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                                                 <AdminOnlyRoute>
                                <AddPurchaseReturn />
                                    </AdminOnlyRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/purchases/"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                    <AdminOnlyRoute>
                                <Purchases />
                                    </AdminOnlyRoute>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/purchases/new"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                    <AdminOnlyRoute>
                                <NewPurchases />
                                    </AdminOnlyRoute>
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
                                <SellReturn />
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
                    path="/sales/edit/:id"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <EditSale />
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
                    path="/report"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Reports />
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
