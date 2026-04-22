require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json());

// =====================
// DATABASE
// =====================
connectDB();

// =====================
// ROUTES
// =====================
app.use('/auth',          require('./routes/auth'));
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
        "POST /products/category/:name",
        "POST /products/add          🔒 Admin",
        "POST /products/update/:id   🔒 Admin",
        "POST /products/delete/:id   🔒 Admin"
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
        "POST /payment/create-order     🔒 Token",
        "POST /payment/verify           🔒 Token",
        "POST /payment/history/:userId  🔒 Token"
      ],
      reviews: [
        "POST /reviews/get/:productId",
        "POST /reviews/add              🔒 Token",
        "POST /reviews/delete/:reviewId 🔒 Token"
      ],
      notifications: [
        "POST /notifications/get/:userId            🔒 Token",
        "POST /notifications/read/:notificationId   🔒 Token",
        "POST /notifications/delete/:notificationId 🔒 Token"
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
        "POST /admin/dashboard               🔒 Admin"
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
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});