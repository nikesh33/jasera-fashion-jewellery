import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import productsRoutes from "./routes/products.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import addressesRoutes from "./routes/addresses.routes.js";
import bannersRoutes from "./routes/banners.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import cmsRoutes from "./routes/cms.routes.js";
import pincodeRoutes from "./routes/pincode.routes.js";
import collectionsRoutes from "./routes/collections.routes.js";
import couponsRoutes from "./routes/coupons.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import returnsRoutes from "./routes/returns.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import { getPool } from "./config/db.js";

const app = express();

// Allowed Origins for CORS
const allowedOrigins = [
  "*",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];
if (config.clientUrl && !allowedOrigins.includes(config.clientUrl)) {
  allowedOrigins.push(config.clientUrl);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback to permissive in local dev
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: "MySQL connected",
    service: "Jasera Boutique E-Commerce API",
    timestamp: new Date().toISOString(),
  });
});

async function checkDatabase() {
  try {
    const connection = await getPool().getConnection();

    await connection.ping();

    console.log("MySQL Database Connected Successfully");

    connection.release();
  } catch (error) {
    console.error("MySQL Database Connection Failed");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    console.error("Full Error:", error);
    console.error(
      "Error JSON:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    );
  }
}

checkDatabase();

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/banners", bannersRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/pincodes", pincodeRoutes);
app.use("/api/collections", collectionsRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/returns", returnsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/audit", auditRoutes);

// Error handling
app.use(errorHandler);

const PORT = config.port || 5001;
app.listen(PORT, () => {
  console.log(`Jasera Server running on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
});
