import React, { useEffect, useState } from "react";
import api from "../api";

function Dispatch() {
    const [dispatches, setDispatches] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [selectedOrderId, setSelectedOrderId] = useState("");
    const [dispatchNumber, setDispatchNumber] = useState("");
    const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split("T")[0]);
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [driverName, setDriverName] = useState("");
    const [orderItems, setOrderItems] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [dispRes, ordersRes] = await Promise.all([
                api.get("/dispatches"),
                api.get("/sales-orders")
            ]);
            setDispatches(dispRes.data.dispatches || []);
            setSalesOrders(ordersRes.data.salesOrders || []);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load dispatches");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSelectOrder = async (orderId) => {
        setSelectedOrderId(orderId);
        setDispatchNumber(`DSP-${Date.now().toString().slice(-5)}`);
        setDispatchDate(new Date().toISOString().split("T")[0]);

        if (!orderId) {
            setOrderItems([]);
            return;
        }

        try {
            const res = await api.get(`/sales-orders/${orderId}`);
            const items = res.data.items || [];
            setOrderItems(items.map(item => ({
                productId: item.product_id,
                productCode: item.product_code,
                productName: item.product_name,
                quantity: item.quantity,
                unit: item.unit
            })));
        } catch (err) {
            console.error("Failed to load order items:", err);
            setError("Could not load products for this sales order");
        }
    };

    const handleQuantityChange = (index, value) => {
        const updated = [...orderItems];
        updated[index].quantity = Math.max(1, Number(value));
        setOrderItems(updated);
    };

    const handleCreateDispatch = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!selectedOrderId || !dispatchNumber || !dispatchDate || !vehicleNumber || !driverName || orderItems.length === 0) {
            setError("Please fill in all dispatch details and at least one item.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/dispatches", {
                salesOrderId: Number(selectedOrderId),
                dispatchNumber,
                dispatchDate,
                vehicleNumber,
                driverName,
                products: orderItems.map(item => ({
                    productId: Number(item.productId),
                    quantity: Number(item.quantity)
                }))
            });

            setMessage(`Dispatch ${dispatchNumber} processed successfully! Physical and reserved stock updated.`);
            setShowForm(false);
            setSelectedOrderId("");
            setOrderItems([]);
            setVehicleNumber("");
            setDriverName("");
            loadData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create dispatch");
        } finally {
            setSubmitting(false);
        }
    };

    // Filter confirmed orders eligible for dispatch
    const confirmedOrders = salesOrders.filter(so => so.status === "CONFIRMED");

    return (
        <div className="page">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h1 style={{ margin: 0 }}>Warehouse Dispatch</h1>
                    <p className="welcome" style={{ margin: "5px 0 0" }}>Process order fulfillments, track shipments, and deduct inventory</p>
                </div>
                {user.role === "ADMIN" && (
                    <button
                        onClick={() => {
                            if (!showForm) {
                                setSelectedOrderId("");
                                setOrderItems([]);
                                setDispatchNumber(`DSP-${Date.now().toString().slice(-5)}`);
                                setVehicleNumber("");
                                setDriverName("");
                                setShowForm(true);
                            } else {
                                setShowForm(false);
                            }
                        }}
                        style={{ background: showForm ? "#4b5563" : "#2563eb" }}
                    >
                        {showForm ? "Cancel" : "+ New Dispatch"}
                    </button>
                )}
            </div>

            {message && <div className="message">{message}</div>}
            {error && <div className="error">{error}</div>}

            {showForm && (
                <div className="form-card" style={{ marginBottom: "25px" }}>
                    <h2 style={{ marginTop: 0 }}>Create Order Dispatch</h2>
                    
                    {confirmedOrders.length === 0 ? (
                        <div className="info-box" style={{ marginTop: 0 }}>
                            <p style={{ margin: 0 }}>
                                ⚠️ No CONFIRMED sales orders are currently pending dispatch.
                                Confirm an order in the <strong>Sales Orders</strong> page first to reserve stock.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleCreateDispatch}>
                            <div className="form-grid">
                                <div>
                                    <label>Select Confirmed Sales Order *</label>
                                    <select
                                        required
                                        value={selectedOrderId}
                                        onChange={(e) => handleSelectOrder(e.target.value)}
                                    >
                                        <option value="">-- Choose Sales Order --</option>
                                        {confirmedOrders.map((so) => (
                                            <option key={so.id} value={so.id}>
                                                Order #{so.id} - {so.company_name} (Quote #{so.quotation_id})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label>Dispatch Note Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={dispatchNumber}
                                        onChange={(e) => setDispatchNumber(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label>Dispatch Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={dispatchDate}
                                        onChange={(e) => setDispatchDate(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label>Vehicle Number *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="MH-12-AB-1234"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label>Driver Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ramesh Kumar"
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {orderItems.length > 0 && (
                                <div style={{ marginTop: "20px" }}>
                                    <h4>Items to Dispatch</h4>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Product Name</th>
                                                <th style={{ width: "120px" }}>Quantity</th>
                                                <th>Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderItems.map((item, idx) => (
                                                <tr key={item.productId || idx}>
                                                    <td><strong>{item.productCode}</strong></td>
                                                    <td>{item.productName}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                        />
                                                    </td>
                                                    <td>{item.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div style={{ marginTop: "20px" }}>
                                <button
                                    type="submit"
                                    disabled={submitting || orderItems.length === 0}
                                    style={{ background: "#16a34a" }}
                                >
                                    {submitting ? "Processing Dispatch..." : "Confirm & Dispatch"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {loading ? (
                <div className="table-card"><p>Loading dispatches...</p></div>
            ) : dispatches.length === 0 ? (
                <div className="table-card">
                    <p>No dispatch notes recorded yet. When a Sales Order is confirmed, create a dispatch note to fulfill it.</p>
                </div>
            ) : (
                <div className="table-card">
                    <table>
                        <thead>
                            <tr>
                                <th>Dispatch #</th>
                                <th>Sales Order ID</th>
                                <th>Dispatch Date</th>
                                <th>Vehicle Number</th>
                                <th>Driver Name</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dispatches.map((d) => (
                                <tr key={d.id}>
                                    <td><strong>{d.dispatch_number}</strong></td>
                                    <td>Order #{d.sales_order_id}</td>
                                    <td>{new Date(d.dispatch_date).toLocaleDateString()}</td>
                                    <td>{d.vehicle_number}</td>
                                    <td>{d.driver_name}</td>
                                    <td>{new Date(d.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Dispatch;