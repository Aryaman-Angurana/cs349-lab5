const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
const port = 4000;

// PostgreSQL connection
// NOTE: use YOUR postgres username and password here
const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'ecommerce',
  password: 'your_password',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// CORS: Give permission to localhost:3000 (ie our React app)
// to use this backend API
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Session information
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

/////////////////////////////////////////////////////////////
// Authentication APIs
// Signup, Login, IsLoggedIn and Logout

// TODO: Implement authentication middleware
// Redirect unauthenticated users to the login page with respective status code
function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.status(400).json({ message: "Unauthorized" });
  }
  next();
}

// TODO: Implement user signup logic
// return JSON object with the following fields: {username, email, password}
// use correct status codes and messages mentioned in the lab document
app.post('/signup', async (req, res) => {
  try {
      const { username, email, password } = req.body;
      const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: "Error: Email is already registered." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query("INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)", [username, email, hashedPassword]);
      res.status(200).json({ message: "User Registered Successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error signing up" });
    }
});

// TODO: Implement user signup logic
// return JSON object with the following fields: {email, password}
// use correct status codes and messages mentioned in the lab document
app.post("/login", async (req, res) => {
  try {
      const { email, password } = req.body;
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (user.rows.length === 0 || !(await bcrypt.compare(password, user.rows[0].password_hash))) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      req.session.user = { id: user.rows[0].user_id, username: user.rows[0].username };
      res.status(200).json({ message: "Login successful" });
    } catch (error) {
      res.status(500).json({ message: "Error logging in" });
    }
});


// TODO: Implement API used to check if the client is currently logged in or not.
// use correct status codes and messages mentioned in the lab document
app.get("/isLoggedIn", async (req, res) => {
  if (req.session.user) {
    return res.status(200).json({ message: "Logged in", username: req.session.user.username });
  }
  res.status(400).json({ message: "Not logged in" });
});

// TODO: Implement API used to logout the user
// use correct status codes and messages mentioned in the lab document
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Failed to log out" });
    res.status(200).json({ message: "Logged out successfully" });
  });
});

////////////////////////////////////////////////////
// APIs for the products
// use correct status codes and messages mentioned in the lab document
// TODO: Fetch and display all products from the database
app.get("/list-products", isAuthenticated, async (req, res) => {
  try {
    const products = await pool.query("SELECT product_id, name, price FROM products ORDER BY product_id");
    res.status(200).json({ message: "Products fetched successfully", products: products.rows });
  } catch (error) {
    res.status(500).json({ message: "Error listing products" });
  }
});

// APIs for cart: add_to_cart, display-cart, remove-from-cart
// TODO: impliment add to cart API which will add the quantity of the product specified by the user to the cart
app.post("/add-to-cart", isAuthenticated, async (req, res) => {
  try {
    // Fetch product details to check stock availability
    const quantity = req.body.quantity;
    const productId = req.body.product_id;
    const userId = req.session.userId;
    const productResult = await pool.query('SELECT * FROM products WHERE product_id = $1', [productId]);
    
    // Check if product exists
    if (productResult.rowCount === 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = productResult.rows[0];
    const availableStock = product.stock_quantity;

    // Fetch current quantity in the cart for this product
    const cartResult = await pool.query('SELECT * FROM cart WHERE user_id = $1 AND item_id = $2', [userId, productId]);
    let currentCartQuantity = 0;

    if (cartResult.rowCount > 0) {
        currentCartQuantity = cartResult.rows[0].quantity;
    }

    // Calculate the total quantity if we add the requested quantity
    const totalQuantity = currentCartQuantity + parseInt(quantity);

    // Check if the total quantity exceeds available stock
    if (totalQuantity > availableStock) {
      return res.status(400).json({ message: `Insufficient stock for ${product.rows[0].name}.` });
    }

    // If the product is already in the cart, update the quantity
    if (cartResult.rowCount > 0) {
        await pool.query('UPDATE cart SET quantity = $1 WHERE user_id = $2 AND item_id = $3', 
                         [totalQuantity, userId, productId]);
    } else {
        // If the product is not in the cart, insert it into the cart
        await pool.query('INSERT INTO cart (user_id, item_id, quantity) VALUES ($1, $2, $3)', 
                         [userId, productId, totalQuantity]);
    }

    res.status(200).json({ message: `Successfully added ${quantity} of ${product.rows[0].name} to your cart.` });
} catch (error) {
    res.status(500).json({ message: "Error adding to cart" });
}
});

// TODO: Implement display-cart API which will returns the products in the cart
app.get("/display-cart", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;  // Get logged-in user ID
    const result = await pool.query(
        `SELECT 
            c.item_id as product_id, 
            p.name as product_name, 
            c.quantity as quantity, 
            p.price as unit_price, 
            (c.quantity * p.price) AS total_item_price
        FROM Cart c
        JOIN Products p ON c.item_id = p.product_id
        WHERE c.user_id = $1
        ORDER BY c.item_id`, 
        [userId]
    );

    const cartItems = result.rows;

    if (cartItems.length === 0) {
        return res.status(200).json({ message: "No items in cart.",cart: [], totalPrice: 0 });
    }

    let totalCartPrice = parseFloat(0);
    cartItems.forEach(item => {
      item.Cart.item_id=item.product_id;
      item.unit_price = parseFloat(item.unit_price).toFixed(2);
      item.total_item_price = parseFloat(item.total_item_price).toFixed(2);
      totalCartPrice += parseFloat(item.total_item_price);
    });

    totalCartPrice = totalCartPrice.toFixed(2);
    // Render the cart page with the fetched cart details
    return res.status(200).json({ message: "Cart fetched successfully.", cart: cartItems, totalPrice: totalCartPrice });

} catch (error) {
    return res.status(500).json({ message: "Error fetching cart" });
}
});

// TODO: Implement remove-from-cart API which will remove the product from the cart
app.post("/remove-from-cart", isAuthenticated, async (req, res) => {
  try {
    const productId= req.body.product_id;  // Get the product ID from the form
    const userId = req.session.userId;  // Get the user ID from session
      // Check if the product exists in the user's cart
      const cartResult = await pool.query('SELECT * FROM Cart WHERE user_id = $1 AND item_id = $2', [userId, productId]);
      
      if (cartResult.rowCount === 0) {
          return res.status(400).json({ message: "Item not present in your cart." });
      }
      // If the product exists, delete it from the cart
      await pool.query('DELETE FROM Cart WHERE user_id = $1 AND item_id = $2', [userId, productId]);
      
      res.status(200).json({ message: "Item removed from your cart successfully." });
  } catch (error) {
      return res.status(500).json({ message: "Error removing from cart" });
  }
});
// TODO: Implement update-cart API which will update the quantity of the product in the cart
app.post("/update-cart", isAuthenticated, async (req, res) => {
  try {
    // Fetch product details to check stock availability
    const quantity = req.body.quantity;
    const productId = req.body.product_id;
    const userId = req.session.userId;
    const productResult = await pool.query('SELECT * FROM products WHERE product_id = $1', [productId]);
    
    // Check if product exists
    if (productResult.rowCount === 0) {
      throw new Error("Invalid product ID");
    }

    const product = productResult.rows[0];
    const availableStock = product.stock_quantity;

    // Fetch current quantity in the cart for this product
    const cartResult = await pool.query('SELECT * FROM cart WHERE user_id = $1 AND item_id = $2', [userId, productId]);
    let currentCartQuantity = 0;

    if (cartResult.rowCount > 0) {
        currentCartQuantity = cartResult.rows[0].quantity;
    }

    // Calculate the total quantity if we add the requested quantity
    const totalQuantity = currentCartQuantity + parseInt(quantity);

    if (totalQuantity <= 0) {
      await pool.query('DELETE FROM cart WHERE user_id = $1 AND item_id = $2', [userId, productId]);
      return res.status(200).json({ message: `Cart updated successfully` });
    }
    // Check if the total quantity exceeds available stock
    if (totalQuantity > availableStock) {
      return res.status(400).json({ message: `Requested quantity exceeds available stock` });
    }

    // If the product is already in the cart, update the quantity
    if (cartResult.rowCount > 0) {
        await pool.query('UPDATE cart SET quantity = $1 WHERE user_id = $2 AND item_id = $3', 
                         [totalQuantity, userId, productId]);
    } else {
        // If the product is not in the cart, insert it into the cart
        await pool.query('INSERT INTO cart (user_id, item_id, quantity) VALUES ($1, $2, $3)', 
                         [userId, productId, totalQuantity]);
    }

    res.status(200).json({ message: `Cart updated successfully` });
} catch (error) {
    res.status(500).json({ message: "Error adding to cart" });
}
});

// APIs for placing order and getting confirmation
// TODO: Implement place-order API, which updates the order,orderitems,cart,orderaddress tables
app.post("/place-order", isAuthenticated, async (req, res) => {

});

// API for order confirmation
// TODO: same as lab4
app.get("/order-confirmation", isAuthenticated, async (req, res) => {

});

////////////////////////////////////////////////////
// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});