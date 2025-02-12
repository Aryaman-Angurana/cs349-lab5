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
    await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)", [username, email, hashedPassword]);
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

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Failed to log out" });
    res.status(200).json({ message: "Logged out successfully" });
  });
});

app.get("/isLoggedIn", (req, res) => {
  if (req.session.user) {
    return res.status(200).json({ message: "Logged in", username: req.session.user.username });
  }
  res.status(400).json({ message: "Not logged in" });
});

app.get("/list-products", isAuthenticated, async (req, res) => {
  try {
    const products = await pool.query("SELECT product_id, name, price FROM products");
    res.status(200).json({ message: "Products fetched successfully", products: products.rows });
  } catch (error) {
    res.status(500).json({ message: "Error listing products" });
  }
});

app.post("/add-to-cart", isAuthenticated, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const product = await pool.query("SELECT * FROM products WHERE id = $1", [product_id]);
    if (product.rows.length === 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    if (quantity > product.rows[0].stock) {
      return res.status(400).json({ message: `Insufficient stock for ${product.rows[0].name}.` });
    }
    await pool.query("INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart.quantity + $3", [req.session.user.id, product_id, quantity]);
    res.status(200).json({ message: `Successfully added ${quantity} of ${product.rows[0].name} to your cart.` });
  } catch (error) {
    res.status(500).json({ message: "Error adding to cart" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
