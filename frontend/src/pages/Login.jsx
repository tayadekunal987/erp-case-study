import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Login() {

    const navigate = useNavigate();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const handleLogin = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response =
                await api.post(
                    "/auth/login",
                    {
                        email,
                        password
                    }
                );

            localStorage.setItem(
                "token",
                response.data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(
                    response.data.user
                )
            );

            navigate("/dashboard");

        } catch (error) {

            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.code === "ERR_NETWORK" || !error.response) {
                setError(
                    "Cannot connect to backend server. Please verify the backend is running on http://localhost:5000."
                );
            } else {
                setError("Login failed. Please check your credentials.");
            }

        } finally {

            setLoading(false);

        }
    };

    return (
        <div className="login-page">

            <div className="login-card">

                <h1>ERP Management</h1>

                <p>
                    Full-Stack Technical Case Study
                </p>

                <form onSubmit={handleLogin}>

                    <label>Email</label>

                    <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        placeholder="Enter email"
                        required
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        placeholder="Enter password"
                        required
                    />

                    {error && (
                        <div className="error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                </form>

                <div className="demo-credentials">

                    <strong>Demo Accounts (Click to Fill)</strong>

                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button
                            type="button"
                            style={{
                                background: "#4b5563",
                                padding: "7px 10px",
                                fontSize: "12px",
                                flex: 1,
                                cursor: "pointer"
                            }}
                            onClick={() => {
                                setEmail("sales@erp.com");
                                setPassword("Sales@123");
                                setError("");
                            }}
                        >
                            Fill Sales
                        </button>

                        <button
                            type="button"
                            style={{
                                background: "#4b5563",
                                padding: "7px 10px",
                                fontSize: "12px",
                                flex: 1,
                                cursor: "pointer"
                            }}
                            onClick={() => {
                                setEmail("admin@erp.com");
                                setPassword("Admin@123");
                                setError("");
                            }}
                        >
                            Fill Admin
                        </button>
                    </div>

                    <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
                        <p style={{ margin: "3px 0" }}>
                            <strong>Sales:</strong> sales@erp.com / Sales@123
                        </p>
                        <p style={{ margin: "3px 0" }}>
                            <strong>Admin:</strong> admin@erp.com / Admin@123
                        </p>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;