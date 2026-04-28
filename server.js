require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();

const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRES'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// =====================
// MIDDLEWARE
// =====================
app.use(helmet());
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true
}));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth requests. Please try again later." }
});

// =====================
// DATABASE
// =====================
connectDB();

// =====================
// ROUTES
// =====================
app.use('/auth',          authLimiter, require('./routes/auth'));
app.use('/user',          require('./routes/user'));
app.use('/products',      require('./routes/products'));
app.use('/cart',          require('./routes/cart'));
app.use('/favourites',    require('./routes/favourites'));
app.use('/address',       require('./routes/address'));
app.use('/orders',        require('./routes/orders'));
app.use('/payment',       require('./routes/payment'));
app.use('/reviews',       require('./routes/reviews'));
app.use('/notifications', require('./routes/notifications'));
app.use('/coupons',       require('./routes/coupons'));
app.use('/banners',       require('./routes/banners'));
app.use('/categories',    require('./routes/categories'));
app.use('/admin',         require('./routes/admin'));
app.use('/contact',       require('./routes/contact'));
app.use('/content',       require('./routes/content'));
app.use('/returns',       require('./routes/returns'));
app.use('/location',      require('./routes/location'));

app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    dbState: mongoose.connection.readyState
  });
});

// =====================
// HOME
// =====================
app.get('/', (req, res) => {
  res.json({
    message: "🚀 Ecommerce API is running!",
    version: "2.0.0",
    security: "JWT + bcrypt + OTP Email ✅",
    docs: "Send Bearer <token> in Authorization header for protected routes.",
    routes: {
      auth: [
        "POST /auth/signup",
        "POST /auth/login",
        "POST /auth/logout              🔒 Token",
        "POST /auth/forgot-password",
        "POST /auth/verify-otp",
        "POST /auth/reset-password"
      ],
      user: [
        "POST /user/profile/:userId          🔒 Token",
        "POST /user/profile/update/:userId   🔒 Token",
        "POST /user/change-password/:userId  🔒 Token",
        "POST /user/delete/:userId           🔒 Token"
      ],
      products: [
        "POST /products/all",
        "POST /products/single/:id",
        "POST /products/search",
        "POST /products/filter",
        "POST /products/recent",
        "POST /products/category/:name",
        "POST /products/add          🔒 Admin",
        "POST /products/update/:id   🔒 Admin",
        "POST /products/delete/:id   🔒 Admin"
      ],
      location: [
        "POST /location/live/update/:userId 🔒 Token",
        "POST /location/current/:userId     🔒 Token",
        "POST /location/live/:userId        🔒 Token",
        "POST /location/live/stop/:userId   🔒 Token"
      ],
      cart: [
        "POST /cart/get/:userId               🔒 Token",
        "POST /cart/add/:userId/:productId    🔒 Token",
        "POST /cart/update/:userId/:productId 🔒 Token",
        "POST /cart/remove/:userId/:productId 🔒 Token",
        "POST /cart/clear/:userId             🔒 Token"
      ],
      favourites: [
        "POST /favourites/get/:userId                🔒 Token",
        "POST /favourites/add/:userId/:productId     🔒 Token",
        "POST /favourites/remove/:userId/:productId  🔒 Token"
      ],
      orders: [
        "POST /orders/place           🔒 Token",
        "POST /orders/get/:userId     🔒 Token",
        "POST /orders/detail/:orderId 🔒 Token",
        "POST /orders/cancel/:orderId 🔒 Token",
        "POST /orders/track/:orderId  🔒 Token"
      ],
      address: [
        "POST /address/get/:userId          🔒 Token",
        "POST /address/add/:userId          🔒 Token",
        "POST /address/update/:addressId    🔒 Token",
        "POST /address/delete/:addressId    🔒 Token"
      ],
      payment: [
        "POST /payment/create-order     🔒 Token (online/cod)",
        "POST /payment/verify           🔒 Token",
        "POST /payment/history/:userId  🔒 Token"
      ],
      content: [
        "POST /content/about",
        "POST /content/terms",
        "POST /content/privacy",
        "POST /content/get/about",
        "POST /content/get/terms",
        "POST /content/get/privacy",
        "POST /content/all",
        "POST /content/update/:key      🔒 Admin"
      ],
      contact: [
        "POST /contact/submit",
        "POST /contact/my/:userId       🔒 Token",
        "POST /contact/all              🔒 Admin",
        "POST /contact/status/:contactId 🔒 Admin"
      ],
      returns: [
        "POST /returns/request          🔒 Token",
        "POST /returns/my/:userId       🔒 Token",
        "POST /returns/all              🔒 Admin",
        "POST /returns/update/:requestId 🔒 Admin"
      ],
      reviews: [
        "POST /reviews/get/:productId",
        "POST /reviews/add              🔒 Token",
        "POST /reviews/delete/:reviewId 🔒 Token"
      ],
      notifications: [
        "POST /notifications/get/:userId            🔒 Token",
        "POST /notifications/read/:notificationId   🔒 Token",
        "POST /notifications/delete/:notificationId 🔒 Token",
        "POST /notifications/unread-count/:userId   🔒 Token",
        "POST /notifications/read-all/:userId       🔒 Token"
      ],
      coupons: [
        "POST /coupons/apply",
        "POST /coupons/add              🔒 Admin",
        "POST /coupons/delete/:couponId 🔒 Admin"
      ],
      banners: [
        "POST /banners/get",
        "POST /banners/add              🔒 Admin",
        "POST /banners/delete/:bannerId 🔒 Admin"
      ],
      categories: [
        "POST /categories/get",
        "POST /categories/add                 🔒 Admin",
        "POST /categories/delete/:categoryId  🔒 Admin"
      ],
      admin: [
        "POST /admin/orders/all              🔒 Admin",
        "POST /admin/orders/ship/:orderId    🔒 Admin",
        "POST /admin/orders/deliver/:orderId 🔒 Admin",
        "POST /admin/orders/status/:orderId  🔒 Admin",
        "POST /admin/users/all               🔒 Admin",
        "POST /admin/dashboard               🔒 Admin",
        "POST /admin/offers/broadcast        🔒 Admin"
      ]
    }
  });
});

// =====================
// 404 HANDLER
// =====================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});

const shutdown = async () => {
  console.log("Received shutdown signal. Closing server...");
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log("Mongo connection closed.");
    } catch (err) {
      console.error("Error while closing Mongo connection:", err.message);
    } finally {
      process.exit(0);
    }
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
