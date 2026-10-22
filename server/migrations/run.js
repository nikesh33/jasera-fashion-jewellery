import { getPool } from '../src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const SCHEMA = `

-- ========================================
-- Suvarna Jewellery E-Commerce Database
-- ========================================

CREATE DATABASE IF NOT EXISTS suvarna CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE suvarna;

-- ----------------------------------------
-- Users (customers)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  email_verified TINYINT(1) DEFAULT 0,
  phone VARCHAR(15) NOT NULL UNIQUE,
  phone_verified TINYINT(1) DEFAULT 0,
  password_hash VARCHAR(255) NOT NULL,
  gender ENUM('male','female','other','prefer_not_to_say') DEFAULT NULL,
  date_of_birth DATE DEFAULT NULL,
  wedding_anniversary DATE DEFAULT NULL,
  status ENUM('active','blacklisted') DEFAULT 'active',
  blacklist_reason VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_phone (phone)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Admin Users
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin','manager','content_editor','customer_support') NOT NULL DEFAULT 'content_editor',
  totp_secret VARCHAR(64) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------
-- Categories (self-referencing for subcategories)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id INT UNSIGNED DEFAULT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  display_order INT DEFAULT 0,
  seo_title VARCHAR(200) DEFAULT NULL,
  seo_description VARCHAR(500) DEFAULT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_categories_slug (slug),
  INDEX idx_categories_parent (parent_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Collections (curated groups)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS collections (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(170) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  hero_image_url VARCHAR(500) DEFAULT NULL,
  publish_from TIMESTAMP NULL,
  publish_to TIMESTAMP NULL,
  status ENUM('active','draft','archived') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------
-- Products
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  short_description VARCHAR(500) DEFAULT NULL,
  long_description TEXT DEFAULT NULL,
  category_id INT UNSIGNED DEFAULT NULL,
  collection_id INT UNSIGNED DEFAULT NULL,
  brand VARCHAR(100) DEFAULT 'Suvarna',
  material VARCHAR(100) DEFAULT NULL,
  occasion VARCHAR(100) DEFAULT NULL,
  colour VARCHAR(50) DEFAULT NULL,
  gemstone VARCHAR(100) DEFAULT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) DEFAULT NULL,
  hsn_code VARCHAR(20) DEFAULT NULL,
  gst_rate DECIMAL(4,2) DEFAULT 3.00,
  weight_grams DECIMAL(8,2) DEFAULT NULL,
  dimensions VARCHAR(100) DEFAULT NULL,
  care_guide TEXT DEFAULT NULL,
  tags VARCHAR(500) DEFAULT NULL,
  avg_rating DECIMAL(2,1) DEFAULT 0.0,
  review_count INT DEFAULT 0,
  units_sold INT DEFAULT 0,
  status ENUM('active','draft','archived') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL,
  INDEX idx_products_slug (slug),
  INDEX idx_products_category (category_id),
  INDEX idx_products_status (status),
  INDEX idx_products_price (selling_price),
  FULLTEXT INDEX idx_products_search (name, short_description, tags)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Product Variants (size, material, colour)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  size VARCHAR(20) DEFAULT NULL,
  material VARCHAR(50) DEFAULT NULL,
  colour VARCHAR(50) DEFAULT NULL,
  price_override DECIMAL(10,2) DEFAULT NULL,
  stock INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  reorder_point INT DEFAULT 10,
  weight_grams DECIMAL(8,2) DEFAULT NULL,
  dimensions VARCHAR(100) DEFAULT NULL,
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_variants_product (product_id),
  INDEX idx_variants_sku (sku)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Product Images
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED DEFAULT NULL,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(300) DEFAULT NULL,
  display_order INT DEFAULT 0,
  type ENUM('front','side','lifestyle','detail','packaging','video') DEFAULT 'front',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  INDEX idx_images_product (product_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Collection ↔ Products (M2M)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS collection_products (
  collection_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  display_order INT DEFAULT 0,
  PRIMARY KEY (collection_id, product_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------
-- Reviews
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED DEFAULT NULL,
  rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200) DEFAULT NULL,
  body TEXT DEFAULT NULL,
  status ENUM('pending','approved','rejected','flagged') DEFAULT 'pending',
  admin_reply TEXT DEFAULT NULL,
  admin_replied_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reviews_product (product_id),
  INDEX idx_reviews_status (status)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Review Photos
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS review_photos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  review_id INT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------
-- Shopping Carts
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS carts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  session_id VARCHAR(64) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_carts_user (user_id),
  INDEX idx_carts_session (session_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Cart Items
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED DEFAULT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  UNIQUE KEY uk_cart_product_variant (cart_id, product_id, variant_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Wishlists
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS wishlists (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED DEFAULT NULL,
  note VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uk_wishlist_user_product (user_id, product_id, variant_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Addresses
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  address_line1 VARCHAR(300) NOT NULL,
  address_line2 VARCHAR(300) DEFAULT NULL,
  landmark VARCHAR(200) DEFAULT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  address_type ENUM('home','work','other') DEFAULT 'home',
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Coupons
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(500) DEFAULT NULL,
  type ENUM('percentage','flat','free_shipping') NOT NULL DEFAULT 'percentage',
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2) DEFAULT NULL,
  applicable_categories JSON DEFAULT NULL,
  applicable_products JSON DEFAULT NULL,
  valid_from TIMESTAMP NULL,
  valid_to TIMESTAMP NULL,
  total_usage_cap INT DEFAULT NULL,
  per_customer_cap INT DEFAULT 1,
  first_order_only TINYINT(1) DEFAULT 0,
  total_used INT DEFAULT 0,
  status ENUM('draft','active','paused','expired') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_coupons_code (code),
  INDEX idx_coupons_status (status)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Coupon Usage Tracking
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS coupon_usage (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED DEFAULT NULL,
  order_id INT UNSIGNED DEFAULT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------
-- Orders
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  user_id INT UNSIGNED DEFAULT NULL,
  guest_email VARCHAR(255) DEFAULT NULL,
  guest_phone VARCHAR(15) DEFAULT NULL,
  shipping_address JSON NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0.00,
  shipping_fee DECIMAL(10,2) DEFAULT 0.00,
  tax DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  coupon_id INT UNSIGNED DEFAULT NULL,
  coupon_code VARCHAR(50) DEFAULT NULL,
  payment_method VARCHAR(50) DEFAULT NULL,
  payment_status ENUM('pending','paid','failed','refunded','pending_cod') DEFAULT 'pending',
  fulfilment_status ENUM('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','returned') DEFAULT 'placed',
  idempotency_key VARCHAR(64) DEFAULT NULL,
  guest_token VARCHAR(128) DEFAULT NULL,
  guest_token_expires_at TIMESTAMP NULL,
  notes TEXT DEFAULT NULL,
  carrier VARCHAR(100) DEFAULT NULL,
  tracking_number VARCHAR(100) DEFAULT NULL,
  estimated_delivery DATE DEFAULT NULL,
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP NULL,
  packed_at TIMESTAMP NULL,
  shipped_at TIMESTAMP NULL,
  out_for_delivery_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  cancel_reason VARCHAR(500) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_number (order_number),
  INDEX idx_orders_status (fulfilment_status),
  INDEX idx_orders_payment (payment_status),
  UNIQUE INDEX idx_orders_idempotency (idempotency_key)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Order Items
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED DEFAULT NULL,
  variant_id INT UNSIGNED DEFAULT NULL,
  product_name VARCHAR(255) NOT NULL,
  variant_info VARCHAR(255) DEFAULT NULL,
  product_image VARCHAR(500) DEFAULT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Order Status History (timeline)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  status VARCHAR(50) NOT NULL,
  note VARCHAR(500) DEFAULT NULL,
  actor_type ENUM('system','customer','admin') DEFAULT 'system',
  actor_id INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_status_history_order (order_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Payments
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  gateway VARCHAR(50) DEFAULT 'razorpay',
  gateway_order_id VARCHAR(100) DEFAULT NULL,
  gateway_payment_id VARCHAR(100) DEFAULT NULL,
  gateway_signature VARCHAR(200) DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status ENUM('created','authorized','captured','failed','refunded') DEFAULT 'created',
  method VARCHAR(50) DEFAULT NULL,
  error_code VARCHAR(50) DEFAULT NULL,
  error_message VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_payments_order (order_id),
  INDEX idx_payments_gateway (gateway_order_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Return Requests
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS return_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  order_item_id INT UNSIGNED DEFAULT NULL,
  user_id INT UNSIGNED NOT NULL,
  reason VARCHAR(500) NOT NULL,
  status ENUM('requested','approved','rejected','picked_up','refunded') DEFAULT 'requested',
  refund_method VARCHAR(50) DEFAULT NULL,
  refund_amount DECIMAL(10,2) DEFAULT NULL,
  admin_note VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_returns_order (order_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- CMS Pages
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS cms_pages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  content LONGTEXT DEFAULT NULL,
  seo_title VARCHAR(200) DEFAULT NULL,
  seo_description VARCHAR(500) DEFAULT NULL,
  status ENUM('published','draft') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------
-- Banners
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS banners (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) DEFAULT NULL,
  subtitle VARCHAR(300) DEFAULT NULL,
  image_url VARCHAR(500) NOT NULL,
  mobile_image_url VARCHAR(500) DEFAULT NULL,
  link_url VARCHAR(500) DEFAULT NULL,
  display_order INT DEFAULT 0,
  publish_from TIMESTAMP NULL,
  publish_to TIMESTAMP NULL,
  position ENUM('hero','feature','promo') DEFAULT 'hero',
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------
-- Store Settings (key-value)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS store_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  setting_group VARCHAR(50) DEFAULT 'general',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------
-- OTP Codes
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS otp_codes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  code VARCHAR(6) NOT NULL,
  purpose ENUM('register','login','reset_password','verify_phone') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified TINYINT(1) DEFAULT 0,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_phone (phone)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Refresh Tokens
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  admin_id INT UNSIGNED DEFAULT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_revoked TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_user (user_id),
  INDEX idx_refresh_admin (admin_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Admin Audit Log
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) DEFAULT NULL,
  target_id INT UNSIGNED DEFAULT NULL,
  before_data JSON DEFAULT NULL,
  after_data JSON DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  INDEX idx_audit_admin (admin_id),
  INDEX idx_audit_target (target_type, target_id)
) ENGINE=InnoDB;

-- ----------------------------------------
-- Newsletter Subscribers
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP NULL
) ENGINE=InnoDB;

-- ----------------------------------------
-- Contact Submissions
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(15) DEFAULT NULL,
  subject VARCHAR(200) DEFAULT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------
-- Pincode Serviceability
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS pincode_serviceability (
  pincode VARCHAR(6) NOT NULL PRIMARY KEY,
  city VARCHAR(100) DEFAULT NULL,
  state VARCHAR(100) DEFAULT NULL,
  is_serviceable TINYINT(1) DEFAULT 1,
  cod_available TINYINT(1) DEFAULT 1,
  estimated_days INT DEFAULT 5
) ENGINE=InnoDB;

-- ----------------------------------------
-- Inventory Transactions
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  variant_id INT UNSIGNED NOT NULL,
  quantity_change INT NOT NULL,
  reason ENUM('receipt','sale','damage','loss','transfer','adjustment','return') NOT NULL,
  reference_id INT UNSIGNED DEFAULT NULL,
  note VARCHAR(500) DEFAULT NULL,
  actor_id INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  INDEX idx_inv_tx_variant (variant_id)
) ENGINE=InnoDB;

`;

async function runMigrations() {
  console.log('🔄 Running Suvarna database migrations...');
  
  // Create database if not exists
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'suvarna',
    multipleStatements: true,
  });

  try {
    const cleanSchema = SCHEMA.replace(/--.*$/gm, '').trim();
    const statements = cleanSchema.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      if (stmt.toLowerCase().startsWith('use ') || stmt.toLowerCase().startsWith('create database ')) {
        continue;
      }
      try {
        await pool.query(stmt);
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists')) {
          console.error(`⚠️  Error executing: ${stmt.substring(0, 80)}...`);
          console.error(`   ${err.message}`);
        }
      }
    }
    
    console.log('✅ Database migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Import mysql here for the migration runner
import mysql from 'mysql2/promise';

runMigrations();
