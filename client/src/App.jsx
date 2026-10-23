import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/shop/HomePage';
import { ShopPage } from './pages/shop/ShopPage';
import { ProductDetailPage } from './pages/shop/ProductDetailPage';
import { CartPage } from './pages/checkout/CartPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { OrderConfirmationPage } from './pages/checkout/OrderConfirmationPage';
import { WishlistPage } from './pages/account/WishlistPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AccountPage } from './pages/account/AccountPage';
import { AboutPage } from './pages/static/AboutPage';
import { ContactPage } from './pages/static/ContactPage';
import { TrackOrderPage } from './pages/static/TrackOrderPage';
import { CmsPage } from './pages/static/CmsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { ProtectedAdminRoute } from './components/auth/ProtectedAdminRoute';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Dedicated Standalone Auth Routes (No Navbar, No Footer) */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="admin/login" element={<AdminLoginPage />} />

        {/* Storefront Layout (Browsing without login is fully supported) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="collections" element={<ShopPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="track-order" element={<TrackOrderPage />} />
          <Route path="shipping-policy" element={<CmsPage slugOverride="shipping-and-returns" />} />
          <Route path="privacy-policy" element={<CmsPage slugOverride="privacy-policy" />} />
          <Route path="terms" element={<CmsPage slugOverride="terms-and-conditions" />} />
          <Route path="pages/:slug" element={<CmsPage />} />
          <Route
            path="admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
