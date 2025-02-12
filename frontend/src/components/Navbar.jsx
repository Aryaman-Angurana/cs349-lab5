import React from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";

const Navbar = () => {
    const navigate = useNavigate();

    // Logout function
    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${apiUrl}/logout`, {
                method: "POST",
                credentials: "include", // Ensure session-based logout
            });

            if (response.ok) {
                navigate("/login"); // Redirect to login page after logout
            } else {
                console.error("Logout failed");
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    return (
        <nav className="navbar">
            <ul>
                <li>
                    <button onClick={() => navigate("/dashboard")}>Home</button>
                </li>
                <li>
                    <button onClick={() => navigate("/products")}>Products</button>
                </li>
                <li>
                    <button onClick={() => navigate("/cart")}>Cart</button>
                </li>
                <li>
                    <button onClick={handleLogout}>Logout</button>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
