import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";

const Dashboard = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("User");

    // Check if user is logged in
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${apiUrl}/isLoggedIn`, {
                    method: "GET",
                    credentials: "include", // Include session cookies
                });

                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.username);
                } else {
                    navigate("/login"); // Redirect if not authenticated
                }
            } catch (error) {
                console.error("Error checking login status:", error);
                navigate("/login");
            }
        };

        checkStatus();
    }, [navigate]);

    return (
        <div>
            <Navbar />
            <h1>Hi {username}!</h1>
            <div>Welcome to the E-commerce App</div>
        </div>
    );
};

export default Dashboard;
