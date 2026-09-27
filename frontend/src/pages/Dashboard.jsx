import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Dashboard() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [stats, setStats] = useState({
        enquiries: 0,
        quotations: 0,
        salesOrders: 0,
        products: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [enqRes, quoteRes, orderRes, prodRes] = await Promise.allSettled([
                    api.get("/enquiries"),
                    api.get("/quotations"),
                    api.get("/sales-orders"),
                    api.get("/products")
                ]);

                setStats({
                    enquiries: enqRes.status === "fulfilled" ? (Array.isArray(enqRes.value.data) ? enqRes.value.data.length : 0) : 0,
                    quotations: quoteRes.status === "fulfilled" ? (quoteRes.value.data.quotations?.length || 0) : 0,
                    salesOrders: orderRes.status === "fulfilled" ? (orderRes.value.data.salesOrders?.length || 0) : 0,
                    products: prodRes.status === "fulfilled" ? (prodRes.value.data.products?.length || 0) : 0
                });
            } catch (err) {
                console.error("Dashboard stats error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="page">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <h1 style={{ margin: 0 }}>ERP Dashboard</h1>
                    <p className="welcome" style={{ margin: "5px 0 0" }}>
                        Welcome back, <strong>{user?.fullName || user?.email || "User"}</strong> ({user?.role || "GUEST"})
                    </p>
                </div>
            </div>

            {/* Quick KPI stats */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "15px",
                marginTop: "25px"
            }}>
                <div className="form-card" style={{ marginTop: 0, padding: "18px", borderLeft: "4px solid #2563eb" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "bold", textTransform: "uppercase" }}>Customer Enquiries</span>
                    <h2 style={{ margin: "8px 0 0", color: "#1e3a8a", fontSize: "28px" }}>{loading ? "..." : stats.enquiries}</h2>
                </div>
                <div className="form-card" style={{ marginTop: 0, padding: "18px", borderLeft: "4px solid #0891b2" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "bold", textTransform: "uppercase" }}>Quotations</span>
                    <h2 style={{ margin: "8px 0 0", color: "#155e75", fontSize: "28px" }}>{loading ? "..." : stats.quotations}</h2>
                </div>
                <div className="form-card" style={{ marginTop: 0, padding: "18px", borderLeft: "4px solid #7c3aed" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "bold", textTransform: "uppercase" }}>Sales Orders</span>
                    <h2 style={{ margin: "8px 0 0", color: "#581c87", fontSize: "28px" }}>{loading ? "..." : stats.salesOrders}</h2>
                </div>
                <div className="form-card" style={{ marginTop: 0, padding: "18px", borderLeft: "4px solid #16a34a" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "bold", textTransform: "uppercase" }}>Inventory Products</span>
                    <h2 style={{ margin: "8px 0 0", color: "#14532d", fontSize: "28px" }}>{loading ? "..." : stats.products}</h2>
                </div>
            </div>

            <div className="dashboard-grid">
                <Link to="/enquiries" className="dashboard-card">
                    <h2>Enquiries</h2>
                    <p>Record customer inquiries, requirements, and product requests</p>
                    <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "13px" }}>Manage Enquiries →</span>
                </Link>

                <Link to="/quotations" className="dashboard-card">
                    <h2>Quotations</h2>
                    <p>Generate pricing quotes, apply taxes/discounts, and send to customers</p>
                    <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "13px" }}>Manage Quotations →</span>
                </Link>

                <Link to="/sales-orders" className="dashboard-card">
                    <h2>Sales Orders</h2>
                    <p>Convert approved quotes to sales orders, reserve stock, and approve</p>
                    <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "13px" }}>Manage Orders →</span>
                </Link>

                <Link to="/inventory" className="dashboard-card">
                    <h2>Inventory</h2>
                    <p>Check physical stock levels, reserved quantities, and available balances</p>
                    <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "13px" }}>Check Stock →</span>
                </Link>

                {user?.role === "ADMIN" && (
                    <Link to="/dispatch" className="dashboard-card">
                        <h2>Dispatch</h2>
                        <p>Process warehouse fulfillment for confirmed orders and record vehicles</p>
                        <span style={{ color: "#2563eb", fontWeight: "bold", fontSize: "13px" }}>Warehouse Dispatch →</span>
                    </Link>
                )}
            </div>
        </div>
    );
}

export default Dashboard;