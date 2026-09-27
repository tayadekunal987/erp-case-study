import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api";

function Quotations() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [quotations, setQuotations] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [selectedEnquiryId, setSelectedEnquiryId] = useState("");
    const [quotationNumber, setQuotationNumber] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [quoteItems, setQuoteItems] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [quoteRes, enqRes, prodRes] = await Promise.all([
                api.get("/quotations"),
                api.get("/enquiries"),
                api.get("/products")
            ]);
            setQuotations(quoteRes.data.quotations || []);
            setEnquiries(Array.isArray(enqRes.data) ? enqRes.data : []);
            setProductsList(prodRes.data.products || []);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load quotations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Check if enquiryId passed in URL
    useEffect(() => {
        const queryEnquiryId = searchParams.get("enquiryId");
        if (queryEnquiryId && enquiries.length > 0) {
            handleSelectEnquiry(queryEnquiryId);
            setShowForm(true);
        }
    }, [searchParams, enquiries]);

    const handleSelectEnquiry = async (enquiryId) => {
        setSelectedEnquiryId(enquiryId);
        setQuotationNumber(`QT-${Date.now().toString().slice(-5)}`);
        
        // 30 days expiry by default
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        setValidUntil(expiry.toISOString().split("T")[0]);

        if (!enquiryId) {
            setQuoteItems([]);
            return;
        }

        try {
            const res = await api.get(`/enquiries/${enquiryId}`);
            const enquiryProducts = res.data.products || [];
            
            const items = enquiryProducts.map((p) => {
                const prodInfo = productsList.find((item) => item.id === p.product_id);
                const unitPrice = prodInfo ? Number(prodInfo.base_price) : 1000;
                return {
                    productId: p.product_id,
                    productCode: p.product_code,
                    productName: p.product_name,
                    quantity: p.quantity,
                    unitPrice: unitPrice,
                    discountPercent: 0,
                    gstPercent: 18
                };
            });
            setQuoteItems(items);
        } catch (err) {
            console.error("Failed to load enquiry products:", err);
            setError("Failed to fetch enquiry items");
        }
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...quoteItems];
        updated[index][field] = Number(value);
        setQuoteItems(updated);
    };

    const calculateItemTotal = (item) => {
        const base = item.quantity * item.unitPrice;
        const afterDiscount = base - (base * (item.discountPercent || 0) / 100);
        const withGst = afterDiscount + (afterDiscount * (item.gstPercent || 0) / 100);
        return withGst;
    };

    const grandTotal = quoteItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);

    const handleCreateQuotation = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!selectedEnquiryId || !quotationNumber || !validUntil || quoteItems.length === 0) {
            setError("All fields and at least one item are required.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/quotations", {
                enquiryId: Number(selectedEnquiryId),
                quotationNumber,
                validUntil,
                products: quoteItems.map((item) => ({
                    productId: item.productId,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    discountPercent: Number(item.discountPercent || 0),
                    gstPercent: Number(item.gstPercent || 18)
                }))
            });

            setMessage(`Quotation ${quotationNumber} created successfully! Total: ₹${grandTotal.toFixed(2)}`);
            setShowForm(false);
            setSelectedEnquiryId("");
            setQuoteItems([]);
            loadData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create quotation");
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id, status) => {
        setError("");
        setMessage("");
        try {
            await api.patch(`/quotations/${id}/status`, { status });
            setMessage(`Quotation status changed to ${status}`);
            loadData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update quotation");
        }
    };

    const convertToOrder = async (id) => {
        setError("");
        setMessage("");
        try {
            // Correct API route is POST /api/sales-orders/from-quotation/:quotationId
            const res = await api.post(`/sales-orders/from-quotation/${id}`);
            setMessage(`Sales Order #${res.data.salesOrderId} created successfully!`);
            loadData();
            setTimeout(() => {
                navigate("/sales-orders");
            }, 1200);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Could not create Sales Order");
        }
    };

    // Filter enquiries that are NEW
    const newEnquiries = enquiries.filter((e) => e.status === "NEW" || String(e.id) === String(selectedEnquiryId));

    return (
        <div className="page">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h1 style={{ margin: 0 }}>Quotations</h1>
                    <p className="welcome" style={{ margin: "5px 0 0" }}>Create and manage customer pricing quotations</p>
                </div>
                <button
                    onClick={() => {
                        if (!showForm) {
                            setSelectedEnquiryId("");
                            setQuoteItems([]);
                            setQuotationNumber(`QT-${Date.now().toString().slice(-5)}`);
                            const expiry = new Date();
                            expiry.setDate(expiry.getDate() + 30);
                            setValidUntil(expiry.toISOString().split("T")[0]);
                            setShowForm(true);
                        } else {
                            setShowForm(false);
                        }
                    }}
                    style={{ background: showForm ? "#4b5563" : "#2563eb" }}
                >
                    {showForm ? "Cancel" : "+ Create Quotation"}
                </button>
            </div>

            {message && <div className="message">{message}</div>}
            {error && <div className="error">{error}</div>}

            {showForm && (
                <div className="form-card" style={{ marginBottom: "25px" }}>
                    <h2 style={{ marginTop: 0 }}>Generate New Quotation</h2>
                    <form onSubmit={handleCreateQuotation}>
                        <div className="form-grid">
                            <div>
                                <label>Select Customer Enquiry *</label>
                                <select
                                    required
                                    value={selectedEnquiryId}
                                    onChange={(e) => handleSelectEnquiry(e.target.value)}
                                >
                                    <option value="">-- Choose an Enquiry --</option>
                                    {newEnquiries.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.enquiry_number} - {e.company_name} ({e.contact_person})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label>Quotation Number *</label>
                                <input
                                    type="text"
                                    required
                                    value={quotationNumber}
                                    onChange={(e) => setQuotationNumber(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Valid Until Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                />
                            </div>
                        </div>

                        {quoteItems.length > 0 && (
                            <div style={{ marginTop: "20px" }}>
                                <h4>Quotation Items & Pricing</h4>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th style={{ width: "90px" }}>Qty</th>
                                            <th style={{ width: "130px" }}>Unit Price (₹)</th>
                                            <th style={{ width: "110px" }}>Discount (%)</th>
                                            <th style={{ width: "100px" }}>GST (%)</th>
                                            <th style={{ width: "120px" }}>Line Total (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quoteItems.map((item, idx) => (
                                            <tr key={item.productId || idx}>
                                                <td>
                                                    <strong>{item.productCode}</strong> - {item.productName}
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={item.discountPercent}
                                                        onChange={(e) => handleItemChange(idx, "discountPercent", e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="28"
                                                        value={item.gstPercent}
                                                        onChange={(e) => handleItemChange(idx, "gstPercent", e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <strong>₹{calculateItemTotal(item).toFixed(2)}</strong>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px", fontSize: "18px" }}>
                                    <div>
                                        Grand Total: <strong>₹{grandTotal.toFixed(2)}</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                            <button
                                type="submit"
                                disabled={submitting || quoteItems.length === 0}
                            >
                                {submitting ? "Saving Quotation..." : "Create Quotation"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="table-card"><p>Loading quotations...</p></div>
            ) : quotations.length === 0 ? (
                <div className="table-card">
                    <p>No quotations found. Select an inquiry and click "+ Create Quotation" above.</p>
                </div>
            ) : (
                <div className="table-card">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Quotation No.</th>
                                <th>Customer</th>
                                <th>Grand Total</th>
                                <th>Valid Until</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotations.map((q) => (
                                <tr key={q.id}>
                                    <td>{q.id}</td>
                                    <td><strong>{q.quotation_number}</strong></td>
                                    <td>{q.company_name}</td>
                                    <td><strong>₹{Number(q.grand_total || 0).toFixed(2)}</strong></td>
                                    <td>{q.valid_until ? new Date(q.valid_until).toLocaleDateString() : "-"}</td>
                                    <td>
                                        <span className="status" style={{
                                            background: q.status === "ACCEPTED" ? "#dcfce7" :
                                                        q.status === "SENT" ? "#dbeafe" :
                                                        q.status === "REJECTED" ? "#fee2e2" : "#f3f4f6",
                                            color: q.status === "ACCEPTED" ? "#166534" :
                                                   q.status === "SENT" ? "#1e40af" :
                                                   q.status === "REJECTED" ? "#991b1b" : "#374151"
                                        }}>
                                            {q.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            {q.status === "DRAFT" && (
                                                <button
                                                    onClick={() => updateStatus(q.id, "SENT")}
                                                    style={{ padding: "6px 12px", fontSize: "12px", background: "#2563eb" }}
                                                >
                                                    Send to Customer
                                                </button>
                                            )}

                                            {q.status === "SENT" && (
                                                <>
                                                    <button
                                                        onClick={() => updateStatus(q.id, "ACCEPTED")}
                                                        style={{ padding: "6px 12px", fontSize: "12px", background: "#16a34a" }}
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        className="danger"
                                                        onClick={() => updateStatus(q.id, "REJECTED")}
                                                        style={{ padding: "6px 12px", fontSize: "12px" }}
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {q.status === "ACCEPTED" && (
                                                <button
                                                    onClick={() => convertToOrder(q.id)}
                                                    style={{ padding: "6px 12px", fontSize: "12px", background: "#7c3aed" }}
                                                >
                                                    Convert to Sales Order →
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Quotations;