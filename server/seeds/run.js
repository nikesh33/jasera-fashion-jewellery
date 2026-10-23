import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runSeeds() {
  console.log("🌱 Seeding generic sample data...");

  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "jasera",
  });

  try {
    // 1. Admin user (1 row)
    console.log("Seeding admin user...");
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    await pool.query(
      `INSERT INTO admin_users (full_name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         password_hash = VALUES(password_hash),
         is_active = 1`,
      ["Admin User", "admin@example.com", adminPasswordHash],
    );

    // 2. Customer user (1 row)
    console.log("Seeding customer...");
    const customerPasswordHash = await bcrypt.hash("customer123", 10);
    await pool.query(
      `INSERT INTO users (full_name, email, email_verified, phone, phone_verified, password_hash, status)
       VALUES (?, ?, 1, ?, 1, ?, 'active')
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         password_hash = VALUES(password_hash)`,
      [
        "Customer User",
        "customer@example.com",
        "9999999999",
        customerPasswordHash,
      ],
    );

    // 3. Clear catalog tables
    console.log("Cleaning catalog tables...");
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    await pool.query("TRUNCATE TABLE product_images");
    await pool.query("TRUNCATE TABLE product_variants");
    await pool.query("TRUNCATE TABLE products");
    await pool.query("TRUNCATE TABLE categories");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    // 4. Category (1 row)
    console.log("Seeding category...");
    await pool.query(
      `INSERT INTO categories (name, slug, description, image_url, display_order, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "Sample Category",
        "sample-category",
        "A generic sample category used for demonstration.",
        "https://via.placeholder.com/600x600?text=Sample+Category",
        1,
        "active",
      ],
    );
    const [catRows] = await pool.query(
      "SELECT id FROM categories WHERE slug = ?",
      ["sample-category"],
    );
    const categoryId = catRows[0].id;

    // 5. Product (1 row)
    console.log("Seeding product...");
    const [pRes] = await pool.query(
      `INSERT INTO products (
        name, slug, short_description, long_description, category_id,
        material, occasion, gemstone, selling_price, mrp, cost_price,
        weight_grams, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "Sample Product",
        "sample-product",
        "Short description of the sample product.",
        "Long description of the sample product used for demonstration.",
        categoryId,
        "Sample Material",
        "Casual",
        "None",
        499.0,
        999.0,
        180.0,
        20.0,
        "active",
      ],
    );
    const productId = pRes.insertId;

    // 6. Product image (1 row)
    console.log("Seeding product image...");
    await pool.query(
      `INSERT INTO product_images (product_id, url, type, display_order)
       VALUES (?, ?, ?, ?)`,
      [
        productId,
        "https://via.placeholder.com/800x800?text=Sample+Product",
        "front",
        0,
      ],
    );

    // 7. Product variant (1 row)
    console.log("Seeding product variant...");
    await pool.query(
      `INSERT INTO product_variants (product_id, sku, size, price_override, stock)
       VALUES (?, ?, ?, ?, ?)`,
      [productId, "SKU-SAMPLE-01", "Standard", 499.0, 25],
    );

    // 8. Coupon (1 row)
    console.log("Seeding coupon...");
    await pool.query(
      `INSERT INTO coupons (code, description, type, value, min_order_amount, max_discount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [
        "SAMPLE10",
        "10% discount on your first order",
        "percentage",
        10.0,
        499.0,
        500.0,
        "active",
      ],
    );

    console.log(" Sample data seeded successfully.");
  } catch (err) {
    console.error(" Seeding failed:", err);
  } finally {
    await pool.end();
  }
}

runSeeds();
