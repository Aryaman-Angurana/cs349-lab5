import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${apiUrl}/isLoggedIn`, {
          method : "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },

        });
        const data = await response.json();
        
        if (response.ok) {
          navigate("/dashboard");
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
        navigate("/login");
      }
    };

    checkAuth();
  },[]);

  return <div>HomePage</div>;
};

export default Home;
