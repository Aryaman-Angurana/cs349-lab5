import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";

const Products = () => {
    const navigate = useNavigate();

    // State to store fetched products
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [quantities, setQuantities] = useState({}); // To track selected quantities

    // Check if user is logged in and fetch products
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

                // Fetch products after confirming authentication
                fetchProducts();
            } catch (error) {
                console.error("Error checking login status:", error);
                navigate("/login");
            }
        };

        checkStatus();
    }, [navigate]);

    // Fetch products from backend
    const fetchProducts = async () => {
        try {
            const response = await fetch(`${apiUrl}/list-products`, {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const data = (await response.json()).products;
                setProducts(data.sort((a, b) => a.id - b.id)); // Sort by product_id
                setQuantities(
                    data.reduce((acc, product) => {
                        acc[product.product_id] = 0; // Default quantity to 1
                        return acc;
                    }, {})
                );
            } else {
                console.error("Failed to fetch products");
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    // Handle search functionality
    const handleSearch = (e) => {
        e.preventDefault();
        const filteredProducts = products.filter((product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setProducts(filteredProducts);
    };

    // Handle quantity change
    const handleQuantityChange = (productId, change) => {
        setQuantities((prevQuantities) => {
            const newQuantity = Math.max(0, prevQuantities[productId] + change);
            return { ...prevQuantities, [productId]: newQuantity };
        });
    };

    // Add product to cart
    const addToCart = async (productId) => {
        const quantity = quantities[productId];

        try {
            const response = await fetch(`${apiUrl}/add-to-cart`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product_id :productId,quantity : quantity }),
            });
            const data = await response.json();

            if (response.ok) {
                alert("Product added to cart!");
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
        }
    };

    return (
        <>
            <Navbar />
            <div>
                <h1>Product List</h1>

                {/* Search Bar */}
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search by product name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit">Search</button>
                </form>

                {/* Product Table */}
                <table>
                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Product Name</th>
                            <th>Price</th>
                            <th>Stock Available</th>
                            <th>Quantity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.product_id}>
                                <td>{product.product_id}</td>
                                <td>{product.name}</td>
                                <td>${product.price}</td>
                                <td>{product.stock_quantity}</td>
                                <td>
                                    <button
                                        onClick={() => handleQuantityChange(product.product_id, -1)}
                                        disabled={quantities[product.product_id] <= 0}
                                    >
                                        -
                                    </button>
                                    {quantities[product.product_id]}
                                    <button
                                        onClick={() => handleQuantityChange(product.product_id, 1)}
                                        disabled={quantities[product.product_id] >= product.stock_quantity}
                                    >
                                        +
                                    </button>
                                </td>
                                <td>
                                    <button onClick={() => addToCart(product.product_id)}>
                                        Add to Cart
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default Products;
