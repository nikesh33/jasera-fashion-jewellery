# Jasera — Fashion Jewellery Boutique E-Commerce Store

Jasera is an e-commerce platform built for a boutique fashion jewellery store (such as Instagram-based handcrafted jhumkas, statement earrings, oxidised silver, kundan, brass ear accessories, and partywear jewellery).

The platform allows real customers to browse dynamic collections, search and filter products, place orders, and pay securely, while providing a single store owner with an administrative control panel to manage products, categories, stock, and orders without editing code or database tables manually.

---

## Tech Stack

- **Frontend**: React 18, Vite, Plain CSS (Indian luxury boutique design system).
- **Backend**: Node.js, Express, MySQL 8 (`mysql2/promise`), JWT (`jsonwebtoken`), bcryptjs.
- **Payments**: Razorpay (live HMAC-SHA256 signature verification + development test sandbox mode).

---

## Access & Roles

The application strictly separates customer and administrator experiences:

1. **Customer Portal (`/login`, `/register`)**:
   - Authenticates against `users` table.
   - Strictly customer permissions (`isAdmin: false`).
   - Never exposes demo admin buttons or admin credentials.
   - Customers can view and track only their own orders (`/orders`).
2. **Admin Portal (`/admin/login`)**:
   - Authenticates against `admin_users` table.
   - Enforced server-side via `requireAdmin` middleware.
   - Route guard `<ProtectedAdminRoute>` redirects unauthorized traffic.
   - Single admin account (`admin@jasera.com` / `admin123`) manages the entire catalogue.

---

## Features

### 1. Store Management (Admin)
- **Product Management**:
  - Add products with name, price, MRP, available stock, category, description, and image URL.
  - Edit products (modal editor on `/admin`) to update price and stock in real time.
  - Safe deletion: products with existing customer order history are safely archived (`status = 'archived'`) to prevent foreign-key database crashes.
  - Server-side validation: rejects negative prices, negative stock, and invalid values.
- **Category Management**:
  - Create and edit boutique categories (name, slug, description, image).
  - Safe deletion workflow: blocks deleting any category that currently contains active products, preventing orphaned items.
  - Real-time synchronization: dynamic categories appear on storefront navigation, homepage cards, and filter sidebars.
- **Orders & Operations**:
  - View all live orders from MySQL with customer contact info, delivery address, items, and payment method.
  - Update order fulfillment statuses (`placed`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`).
  - Cancellation inventory restoration: cancelling an order automatically returns purchased stock back to inventory.
  - Revenue analytics: clearly distinguishes paid revenue from pending cash-on-delivery (COD) collections.

### 2. Customer Journey & Checkout
- **Catalogue & Dynamic Discovery**:
  - Live products queried from database.
  - Responsive search modal and price/category filters.
  - Real-time stock status badge (In Stock, Low Stock, Sold Out).
- **Cart & Server-Side Price Verification**:
  - Cart persists in local storage.
  - Server recalculates all prices, 3% jewellery GST, shipping fees, and coupon discounts during order creation. Client cannot tamper with prices.
  - Atomic stock check: prevents ordering items if quantity exceeds available stock. Decrements stock atomically upon placement.
  - Idempotency support: retried checkout submissions return existing order without charging or creating duplicate orders.
- **Payment Gateway**:
  - Razorpay order creation and payment verification.
  - Verifies HMAC-SHA256 signature using `RAZORPAY_KEY_SECRET`.
  - Development test sandbox simulation modal when running in non-production environments with placeholder keys.
  - Orders are never marked as paid without server-side verification.
- **Order Tracking & Privacy**:
  - Guest tracking at `/track` returns status milestones without exposing sensitive customer addresses or items.
  - Full details and addresses require verifying matching phone or email.

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)

### 2. Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with your MySQL credentials (DB_USER, DB_PASSWORD, DB_NAME)
npm install
npm run migrate    # Runs database migrations
npm run seed       # Seeds boutique categories, admin account, and starter products
npm run dev        # Starts backend on http://localhost:5001
```

### 3. Frontend Setup
```bash
cd client
cp .env.example .env
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```

### 4. Credentials
- **Admin Portal**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
  - **Email**: `admin@jasera.com`
  - **Password**: `admin123`
- **Customer Portal**: [http://localhost:5173/login](http://localhost:5173/login)
  - **Email**: `customer@jasera.com`
  - **Password**: `customer123`

---

## Production Deployment Checklist

1. **Environment Variables**:
   - Set `NODE_ENV=production`.
   - Replace `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with strong 64-character random strings.
   - Configure live Razorpay API keys (`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`).
   - Set `CLIENT_URL` to your production frontend domain for CORS.
2. **Database**:
   - Change default admin password after initial login.
   - Ensure MySQL connection pool SSL is enabled if connecting to a remote cloud database.
3. **Build**:
   - Run `npm run build` in `client/` to generate optimized production assets in `dist/`.
