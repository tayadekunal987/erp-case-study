import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function SalesOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const loadOrders = async () => {
        try {
            const response = await api.get("/sales-orders");
            setOrders(response.data.salesOrders || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load sales orders"
            );
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const viewOrderDetails = async (id) => {
        setLoadingDetails(true);
        try {
            const res = await api.get(`/sales-orders/${id}`);
            setSelectedOrder(res.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load order details");
        } finally {
            setLoadingDetails(false);
        }
    };

    const confirmOrder = async (id) => {
        setMessage("");
        setError("");
        try {
            await api.post(`/sales-orders/${id}/confirm`);
            setMessage(`Order #${id} confirmed and inventory stock reserved successfully!`);
            loadOrders();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to confirm order"
            );
        }
    };

    const cancelOrder = async (id) => {
        setMessage("");
        setError("");
        try {
            await api.post(`/sales-orders/${id}/cancel`);
            setMessage(`Order #${id} has been cancelled.`);
            loadOrders();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to cancel order"
            );
        }
    };

    return (
        <div className="page">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h1 style={{ margin: 0 }}>Sales Orders</h1>
                    <p className="welcome" style={{ margin: "5px 0 0" }}>Manage customer orders, inventory reservations, and fulfillments</p>
                </div>
            </div>

            {message && <div className="message">{message}</div>}
            {error && <div className="error">{error}</div>}

            <div className="info-box">
                <p style={{ margin: 0 }}>
                    💡 <strong>Workflow Tip:</strong> To create a Sales Order, accept a quotation on the{" "}
                    <Link to="/quotations" style={{ color: "#2563eb", fontWeight: "bold" }}>Quotations</Link> page,
                    then click "Convert to Sales Order".
                </p>
            </div>

            {/* Modal for Order Details */}
            {selectedOrder && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div className="form-card" style={{ maxWidth: "650px", width: "90%", maxHeight: "85vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ margin: 0 }}>Sales Order #{selectedOrder.salesOrder.id}</h2>
                            <button onClick={() => setSelectedOrder(null)} style={{ background: "#9ca3af", padding: "4px 10px" }}>✕</button>
                        </div>
                        <div style={{ marginTop: "15px", lineHeight: "1.6" }}>
                            <p><strong>Customer:</strong> {selectedOrder.salesOrder.company_name} ({selectedOrder.salesOrder.contact_person})</p>
                            <p><strong>Contact:</strong> {selectedOrder.salesOrder.mobile} | {selectedOrder.salesOrder.email || "N/A"}</p>
                            <p><strong>Quotation Ref:</strong> #{selectedOrder.salesOrder.quotation_id}</p>
                            <p><strong>Status:</strong> <span className="status">{selectedOrder.salesOrder.status}</span></p>
                            <p><strong>Created:</strong> {new Date(selectedOrder.salesOrder.created_at).toLocaleString()}</p>
                        </div>
                        <h3>Ordered Items</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Product Name</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrder.items.map((item) => (
                                    <tr key={item.id}>
                                        <td><strong>{item.product_code}</strong></td>
                                        <td>{item.product_name}</td>
                                        <td>{item.quantity} {item.unit}</td>
                                        <td>₹{Number(item.unit_price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            {user.role === "ADMIN" && selectedOrder.salesOrder.status === "PENDING" && (
                                <button
                                    onClick={() => {
                                        const id = selectedOrder.salesOrder.id;
                                        setSelectedOrder(null);
                                        confirmOrder(id);
                                    }}
                                    style={{ background: "#16a34a" }}
                                >
                                    Confirm Order & Reserve Stock
                                </button>
                            )}
                            {user.role === "ADMIN" && selectedOrder.salesOrder.status === "CONFIRMED" && (
                                <button
                                    onClick={() => {
                                        setSelectedOrder(null);
                                        navigate("/dispatch");
                                    }}
                                    style={{ background: "#2563eb" }}
                                >
                                    Go to Dispatch →
                                </button>
                            )}
                            <button onClick={() => setSelectedOrder(null)} style={{ background: "#6b7280" }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-card">
                {orders.length === 0 ? (
                    <p>No sales orders created yet. Once a quotation is accepted, convert it to a sales order.</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Quotation Ref</th>
                                <th>Company</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td><strong>#{order.id}</strong></td>
                                    <td>Quote #{order.quotation_id}</td>
                                    <td>{order.company_name}</td>
                                    <td>
                                        <span className="status" style={{
                                            background: order.status === "CONFIRMED" ? "#dbeafe" :
                                                        order.status === "DISPATCHED" ? "#dcfce7" :
                                                        order.status === "CANCELLED" ? "#fee2e2" : "#fef3c7",
                                            color: order.status === "CONFIRMED" ? "#1e40af" :
                                                   order.status === "DISPATCHED" ? "#166534" :
                                                   order.status === "CANCELLED" ? "#991b1b" : "#92400e"
                                        }}>
                                            {order.status}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="action-group">
                                            <button
                                                onClick={() => viewOrderDetails(order.id)}
                                                style={{ background: "#4b5563", fontSize: "12px", padding: "6px 12px" }}
                                            >
                                                View Items
                                            </button>

                                            {user?.role === "ADMIN" && order.status === "PENDING" && (
                                                <>
                                                    <button
                                                        onClick={() => confirmOrder(order.id)}
                                                        style={{ background: "#16a34a", fontSize: "12px", padding: "6px 12px" }}
                                                    >
                                                        Confirm & Reserve
                                                    </button>

                                                    <button
                                                        className="danger"
                                                        onClick={() => cancelOrder(order.id)}
                                                        style={{ fontSize: "12px", padding: "6px 12px" }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}

                                            {order.status === "CONFIRMED" && user?.role === "ADMIN" && (
                                                <button
                                                    onClick={() => navigate("/dispatch")}
                                                    style={{ background: "#2563eb", fontSize: "12px", padding: "6px 12px" }}
                                                >
                                                    Dispatch Order →
                                                </button>
                                            )}

                                            {order.status === "CONFIRMED" && user?.role !== "ADMIN" && (
                                                <span style={{ fontSize: "13px", color: "#2563eb", fontWeight: "bold" }}>
                                                    Stock Reserved
                                                </span>
                                            )}

                                            {order.status === "DISPATCHED" && (
                                                <span style={{ fontSize: "13px", color: "#166534", fontWeight: "bold" }}>
                                                    ✓ Dispatched
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default SalesOrders;