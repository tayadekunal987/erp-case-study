import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <nav className="navbar">

            <div className="navbar-brand">
                <Link to="/dashboard">
                    ERP System
                </Link>
            </div>

            <div className="navbar-links">

                <Link to="/dashboard">
                    Dashboard
                </Link>

                <Link to="/enquiries">
                    Enquiries
                </Link>

                <Link to="/quotations">
                    Quotations
                </Link>

                <Link to="/sales-orders">
                    Sales Orders
                </Link>

                <Link to="/inventory">
                    Inventory
                </Link>

                {user.role === "ADMIN" && (
                    <Link to="/dispatch">
                        Dispatch
                    </Link>
                )}

            </div>

            <div className="navbar-user">

                <span>
                    {user.email || "User"}
                </span>

                <span className="role-badge">
                    {user.role || ""}
                </span>

                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>

            </div>

        </nav>
    );
}

export default Navbar;