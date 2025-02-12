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
  
});

// TODO: Implement display-cart API which will returns the products in the cart
app.get("/display-cart", isAuthenticated, async (req, res) => {

});

// TODO: Implement remove-from-cart API which will remove the product from the cart
app.post("/remove-from-cart", isAuthenticated, async (req, res) => {


});
// TODO: Implement update-cart API which will update the quantity of the product in the cart
app.post("/update-cart", isAuthenticated, async (req, res) => {

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