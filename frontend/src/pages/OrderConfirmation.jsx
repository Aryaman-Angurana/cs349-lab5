import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";
import "../css/OrderConfirmation.css";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState("");

  // Check if the user is logged in and fetch order details
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/isLoggedIn`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          fetchOrderConfirmation();
        } else {
          navigate("/login");
        }
      } catch (err) {
        setError("Failed to verify authentication.");
      }
    };

    checkStatus();
  }, [navigate]);

  // Fetch order confirmation details
  const fetchOrderConfirmation = async () => {
    try {
      const response = await fetch(`${apiUrl}/order-confirmation`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // Sort products by product_id
        data.orderItems.sort((a, b) => a.product_id - b.product_id);
        setOrderDetails(data);
      } else {
        setError("Failed to fetch order details.");
      }
    } catch (err) {
      setError("An error occurred while fetching order details.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="order-confirmation-container">
        <h1>Order Confirmation</h1>
        {error && <p className="error">{error}</p>}

        {orderDetails ? (
          <>
            <h3>Order ID: {orderDetails.order.order_id}</h3>
            <h3>Order Date: {orderDetails.order.order_date}</h3>
            <h3>Total Amount: ${orderDetails.order.total_amount}</h3>

            {/* <h3>Delivery Address:</h3> */}
            {/* <p>{orderDetails.address.street}, {orderDetails.address.city}, {orderDetails.address.state}, {orderDetails.address.pincode}</p> */}

            <table className="order-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.orderItems.map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.product_id}</td>
                    <td>{product.product_name}</td>
                    <td>{product.quantity}</td>
                    <td>${product.price}</td>
                    <td>${(product.price * product.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </>
        ) : (
          <p>Loading order details...</p>
        )}
      </div>
    </>
  );
};

export default OrderConfirmation;
