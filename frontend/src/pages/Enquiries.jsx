import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Enquiries() {
    const navigate = useNavigate();
    const [enquiries, setEnquiries] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [viewDetailsLoading, setViewDetailsLoading] = useState(false);

    // Form state
    const [companyName, setCompanyName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [city, setCity] = useState("");
    const [enquiryNumber, setEnquiryNumber] = useState("");
    const [enquiryDate, setEnquiryDate] = useState(new Date().toISOString().split("T")[0]);
    const [requiredDate, setRequiredDate] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedItems, setSelectedItems] = useState([
        { productId: "", quantity: 1 }
    ]);
    const [submitting, setSubmitting] = useState(false);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [enqRes, prodRes] = await Promise.all([
                api.get("/enquiries"),
                api.get("/products")
            ]);
            setEnquiries(Array.isArray(enqRes.data) ? enqRes.data : []);
            setProductsList(prodRes.data.products || []);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load enquiries");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setCompanyName("");
        setContactPerson("");
        setMobile("");
        setEmail("");
        setCity("");
        setEnquiryNumber(`ENQ-${Date.now().toString().slice(-5)}`);
        setEnquiryDate(new Date().toISOString().split("T")[0]);
        setRequiredDate("");
        setNotes("");
        setSelectedItems([{ productId: productsList[0]?.id || "", quantity: 1 }]);
    };

    const handleOpenForm = () => {
        resetForm();
        setShowForm(true);
    };

    const handleAddItem = () => {
        setSelectedItems([...selectedItems, { productId: productsList[0]?.id || "", quantity: 1 }]);
    };

    const handleRemoveItem = (index) => {
        if (selectedItems.length > 1) {
            setSelectedItems(selectedItems.filter((_, i) => i !== index));
        }
    };

    const handleItemChange = (index, field, value) => {
        const updated = [...selectedItems];
        updated[index][field] = field === "quantity" ? Math.max(1, Number(value)) : value;
        setSelectedItems(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        // Validation
        const validItems = selectedItems.filter(item => item.productId && item.quantity > 0);
        if (validItems.length === 0) {
            setError("Please select at least one product with valid quantity.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/enquiries", {
                companyName,
                contactPerson,
                mobile,
                email,
                city,
                enquiryNumber,
                enquiryDate,
                requiredDate: requiredDate || null,
                notes,
                products: validItems.map(item => ({
                    productId: Number(item.productId),
                    quantity: Number(item.quantity)
                }))
            });

            setMessage(`Enquiry ${enquiryNumber} created successfully!`);
            setShowForm(false);
            loadData();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to create enquiry");
        } finally {
            setSubmitting(false);
        }
    };

    const viewDetails = async (id) => {
        setViewDetailsLoading(true);
        try {
            const res = await api.get(`/enquiries/${id}`);
            setSelectedEnquiry(res.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to fetch enquiry details");
        } finally {
            setViewDetailsLoading(false);
        }
    };

    return (
        <div className="page">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h1 style={{ margin: 0 }}>Customer Enquiries</h1>
                    <p className="welcome" style={{ margin: "5px 0 0" }}>Create and manage customer inquiries and requirements</p>
                </div>
                <button
                    onClick={() => {
                        if (!showForm) handleOpenForm();
                        else setShowForm(false);
                    }}
                    style={{ background: showForm ? "#4b5563" : "#2563eb" }}
                >
                    {showForm ? "Cancel" : "+ New Enquiry"}
                </button>
            </div>

            {message && <div className="message">{message}</div>}
            {error && <div className="error">{error}</div>}

            {showForm && (
                <div className="form-card" style={{ marginBottom: "25px" }}>
                    <h2 style={{ marginTop: 0 }}>Record New Enquiry</h2>
                    <form onSubmit={handleSubmit}>
                        <h4 style={{ margin: "15px 0 10px", color: "#374151" }}>Customer Information</h4>
                        <div className="form-grid">
                            <div>
                                <label>Company Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Acme Industries Ltd."
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Contact Person *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Mobile *</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="9876543210"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="contact@acme.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>City</label>
                                <input
                                    type="text"
                                    placeholder="Mumbai"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Enquiry Number *</label>
                                <input
                                    type="text"
                                    required
                                    value={enquiryNumber}
                                    onChange={(e) => setEnquiryNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        <h4 style={{ margin: "20px 0 10px", color: "#374151" }}>Enquiry Details</h4>
                        <div className="form-grid">
                            <div>
                                <label>Enquiry Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={enquiryDate}
                                    onChange={(e) => setEnquiryDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Required By Date</label>
                                <input
                                    type="date"
                                    value={requiredDate}
                                    onChange={(e) => setRequiredDate(e.target.value)}
                                />
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label>Notes / Requirements</label>
                                <textarea
                                    placeholder="Additional specifications or notes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <h4 style={{ margin: "20px 0 10px", color: "#374151" }}>Requested Products *</h4>
                        {selectedItems.map((item, index) => (
                            <div key={index} style={{ display: "flex", gap: "12px", alignItems: "flex-end", marginBottom: "12px" }}>
                                <div style={{ flex: 3 }}>
                                    <label>Product</label>
                                    <select
                                        required
                                        value={item.productId}
                                        onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                                    >
                                        <option value="">-- Select Product --</option>
                                        {productsList.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.product_code} - {p.product_name} (₹{Number(p.base_price).toFixed(2)}) - Available: {p.available_quantity}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                    />
                                </div>
                                <div style={{ width: "80px" }}>
                                    {selectedItems.length > 1 && (
                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() => handleRemoveItem(index)}
                                            style={{ padding: "10px", width: "100%" }}
                                        >
                                            ✕ Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                style={{ background: "#4b5563" }}
                            >
                                + Add Product
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                            >
                                {submitting ? "Saving Enquiry..." : "Submit Enquiry"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal for Details */}
            {selectedEnquiry && (
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
                    <div className="form-card" style={{ maxWidth: "600px", width: "90%", maxHeight: "85vh", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ margin: 0 }}>Enquiry: {selectedEnquiry.enquiry.enquiry_number}</h2>
                            <button onClick={() => setSelectedEnquiry(null)} style={{ background: "#9ca3af", padding: "4px 10px" }}>✕</button>
                        </div>
                        <div style={{ marginTop: "15px", lineHeight: "1.6" }}>
                            <p><strong>Customer:</strong> {selectedEnquiry.enquiry.company_name} ({selectedEnquiry.enquiry.contact_person})</p>
                            <p><strong>Contact:</strong> {selectedEnquiry.enquiry.mobile} | {selectedEnquiry.enquiry.email || "N/A"}</p>
                            <p><strong>City:</strong> {selectedEnquiry.enquiry.city || "N/A"}</p>
                            <p><strong>Status:</strong> <span className="status">{selectedEnquiry.enquiry.status}</span></p>
                            <p><strong>Notes:</strong> {selectedEnquiry.enquiry.notes || "None"}</p>
                        </div>
                        <h3>Requested Products</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Product Name</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedEnquiry.products.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.product_code}</td>
                                        <td>{p.product_name}</td>
                                        <td>{p.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            {selectedEnquiry.enquiry.status === "NEW" && (
                                <button
                                    onClick={() => {
                                        const enqId = selectedEnquiry.enquiry.id;
                                        setSelectedEnquiry(null);
                                        navigate(`/quotations?enquiryId=${enqId}`);
                                    }}
                                >
                                    Create Quotation →
                                </button>
                            )}
                            <button onClick={() => setSelectedEnquiry(null)} style={{ background: "#6b7280" }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="table-card"><p>Loading enquiries...</p></div>
            ) : enquiries.length === 0 ? (
                <div className="table-card">
                    <p>No enquiries found. Click "+ New Enquiry" above to record the first customer inquiry.</p>
                </div>
            ) : (
                <div className="table-card">
                    <table>
                        <thead>
                            <tr>
                                <th>Enquiry #</th>
                                <th>Company</th>
                                <th>Contact</th>
                                <th>Date</th>
                                <th>Required Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enquiries.map((enq) => (
                                <tr key={enq.id}>
                                    <td><strong>{enq.enquiry_number}</strong></td>
                                    <td>{enq.company_name}</td>
                                    <td>{enq.contact_person} ({enq.mobile})</td>
                                    <td>{new Date(enq.enquiry_date).toLocaleDateString()}</td>
                                    <td>{enq.required_date ? new Date(enq.required_date).toLocaleDateString() : "-"}</td>
                                    <td>
                                        <span className="status" style={{
                                            background: enq.status === "NEW" ? "#dbeafe" : enq.status === "QUOTED" ? "#fef3c7" : "#e5e7eb",
                                            color: enq.status === "NEW" ? "#1e40af" : enq.status === "QUOTED" ? "#92400e" : "#374151"
                                        }}>
                                            {enq.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            <button
                                                onClick={() => viewDetails(enq.id)}
                                                style={{ background: "#4b5563", fontSize: "12px", padding: "6px 12px" }}
                                            >
                                                View Items
                                            </button>
                                            {enq.status === "NEW" && (
                                                <button
                                                    onClick={() => navigate(`/quotations?enquiryId=${enq.id}`)}
                                                    style={{ fontSize: "12px", padding: "6px 12px" }}
                                                >
                                                    Generate Quote
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

export default Enquiries;