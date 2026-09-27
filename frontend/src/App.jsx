import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Enquiries from "./pages/Enquiries";
import Quotations from "./pages/Quotations";
import SalesOrders from "./pages/SalesOrders";
import Inventory from "./pages/Inventory";
import Dispatch from "./pages/Dispatch";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {

    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <>
                                <Navbar />
                                <Dashboard />
                            </>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/enquiries"
                    element={
                        <ProtectedRoute>
                            <>
                                <Navbar />
                                <Enquiries />
                            </>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/quotations"
                    element={
                        <ProtectedRoute>
                            <>
                                <Navbar />
                                <Quotations />
                            </>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/sales-orders"
                    element={
                        <ProtectedRoute>
                            <>
                                <Navbar />
                                <SalesOrders />
                            </>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/inventory"
                    element={
                        <ProtectedRoute>
                            <>
                                <Navbar />
                                <Inventory />
                            </>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dispatch"
                    element={
                        <ProtectedRoute>
                            <>
                                <Navbar />
                                <Dispatch />
                            </>
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;