import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";

const Login = () => {
    const navigate = useNavigate();

    // useEffect to check if user is already logged in
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${apiUrl}/isLoggedIn`, {
                    credentials: "include",
                });
                if (response.ok) {
                    navigate("/dashboard");
                }
            } catch (error) {
                console.error("Error checking authentication:", error);
            }
        };

        checkStatus();
    }, [navigate]);

    // State to handle form data
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState(""); // Store error messages

    // Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Reset previous error

        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Ensure cookies are sent
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                navigate("/dashboard"); // Redirect on successful login
            } else {
                setError(data.message || "Invalid credentials");
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <label>Email:</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <label>Password:</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <button type="submit">Login</button>
            </form>

            <p>
                Don't have an account? <a href="/signup">Sign up</a>
            </p>
        </div>
    );
};

export default Login;
