import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";

const Signup = () => {
    const navigate = useNavigate();

    // useEffect to check if the user is already logged in
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${apiUrl}/isLoggedIn`, {
                    credentials: "include",
                });
                const data = await response.json();

                if (response.ok) {
                    navigate("/dashboard");
                }
            } catch (error) {
                console.error("Error checking authentication:", error);
            }
        };

        checkStatus();
    }, [navigate]);

    // State for form inputs and error handling
    const [formData, setFormData] = useState({
        username: "",
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
        setError(""); // Reset error messages

        try {
            const response = await fetch(`${apiUrl}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Maintain session
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                navigate("/dashboard"); // Redirect on successful signup
            } else {
                setError(data.message || "Signup failed");
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <label>Username:</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />

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

                <button type="submit">Sign Up</button>
            </form>

            <p>
                Already have an account? <a href="/login">Login</a>
            </p>
        </div>
    );
};

export default Signup;
