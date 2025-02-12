import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";
import "../css/Cart.css";

const Cart = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [pincode, setPincode] = useState("");
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [message, setMessage] = useState("");
    
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${apiUrl}/isLoggedIn`, {
                    method: "GET",
                    credentials: "include",
                });
                if (!response.ok) {
                    navigate("/login");
                    return;
                }
                fetchCart();
            } catch (error) {
                console.error("Error checking login status:", error);
                navigate("/login");
            }
        };
        checkStatus();
    }, [navigate]);

    const fetchCart = async () => {
        try {
            const response = await fetch(`${apiUrl}/display-cart`, {
                method: "GET",
                credentials: "include",
            });
            const data = await response.json();
            var cart_data = data.cart;
            if (response.ok) {
                setCart(cart_data.sort((a, b) => a.product_id - b.product_id));
                setTotalPrice(data.totalPrice);
            } else {
                setMessage("Your cart is empty");
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    };

    const updateQuantity = async (productId, change, currentQuantity) => {
        const newQuantity = change;
        try {
            await fetch(`${apiUrl}/update-cart`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product_id : productId, quantity: newQuantity }),
            });
            fetchCart();
        } catch (error) {
            console.error("Error updating cart quantity:", error);
        }
    };

    const removeFromCart = async (productId) => {
        try {
            await fetch(`${apiUrl}/remove-from-cart`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product_id :  productId }),
            });
            fetchCart();
        } catch (error) {
            console.error("Error removing item from cart:", error);
        }
    };

    const handlePinCodeChange = async (e) => {
        const enteredPincode = e.target.value;
        setPincode(enteredPincode);
        if (enteredPincode.length === 6) {
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${enteredPincode}`);
                const data = await response.json();
                if (data[0].Status === "Success") {
                    setCity(data[0].PostOffice[0].Name);
                    setState(data[0].PostOffice[0].State);
                } else {
                    setCity("");
                    setState("");
                }
            } catch (error) {
                console.error("Error fetching pincode details:", error);
            }
        }
    };

    const handleCheckout = async () => {
        // if (!pincode || !street || !city || !state) {
        //     alert("Please fill in all address fields");
        //     return;
        // }
        try {
            const response = await fetch(`${apiUrl}/place-order`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({address: { pincode, street, city, state } }),
            });
            const data = await response.json();
            if (response.ok) {
                alert("Order placed successfully!");
                navigate("/order-confirmation");
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Error placing order:", error);
        }
    };

    return (
        <div className="cart-container">
            <h1>Your Cart</h1>
            {message && <p className="cart-message">{message}</p>}
            
                <>{cart.length > 0 && (
                    <table className="cart-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Quantity</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item) => (
                                <tr key={item.product_id}>
                                    <td>{item.product_name}</td>
                                    <td>${item.unit_price}</td>
                                    <td>{item.stock_quantity}</td>
                                    <td>
                                        <button onClick={() => updateQuantity(item.product_id, -1, item.quantity)}>-</button>
                                        {item.quantity}
                                        <button onClick={() => updateQuantity(item.product_id, 1, item.quantity)}>+</button>
                                    </td>
                                    <td>${item.total_item_price}</td>
                                    <td>
                                        <button onClick={() => removeFromCart(item.product_id)}>Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>)}
                    <h3>Total Price: ${totalPrice}</h3>
                    <form>
                        <input type="text" placeholder="Pincode" value={pincode} onChange={handlePinCodeChange} />
                        <input type="text" placeholder="Street" value={street} onChange={(e) => setStreet(e.target.value)} />
                        <input type="text" placeholder="City" value={city} readOnly />
                        <input type="text" placeholder="State" value={state} readOnly />
                    </form>
                    <button onClick={handleCheckout} disabled={cart.length === 0}>Proceed to Checkout</button>
                </>
            
        </div>
    );
};

export default Cart;
