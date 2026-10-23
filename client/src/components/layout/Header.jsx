import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Package,
  Plus,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { useCartStore } from "../../stores/cartStore";
import { useWishlistStore } from "../../stores/wishlistStore";
import { useAuthStore } from "../../stores/authStore";
import { useUIStore } from "../../stores/uiStore";
import { api } from "../../lib/api";
import "./Header.css";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openDrawer, getItemCount: getCartCount } = useCartStore();
  const { getItemCount: getWishlistCount } = useWishlistStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { openSearch } = useUIStore();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState(true);
  const userMenuRef = useRef(null);

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Close user menu on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  // Dynamically fetch categories from Database for customer view
  useEffect(() => {
    if (!isAdminRoute) {
      api
        .get("/categories")
        .then((res) => {
          if (res?.data?.categories) {
            setCategories(res.data.categories);
          }
        })
        .catch((err) =>
          console.error("Failed to load categories for header:", err),
        );
    }
  }, [isAdminRoute]);

  const handleAdminSignOut = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(() => {
    return sessionStorage.getItem("suvarna_dismiss_announcement") === "true";
  });

  const handleDismissAnnouncement = () => {
    setIsAnnouncementDismissed(true);
    sessionStorage.setItem("suvarna_dismiss_announcement", "true");
  };

  return (
    <header className="site-header">
      {/* 1. Announcement Bar */}
      {!isAnnouncementDismissed && (
        <div
          className={`announcement-bar ${isAdminRoute ? "admin-announcement" : ""}`}
        >
          <div className="announcement-content">
            {isAdminRoute ? (
              <>
                <span className="announcement-text">
                  JASERA - Management Portal
                </span>
                <div className="announcement-links">
                  <Link to="/" target="_blank" rel="noopener noreferrer">
                    View Customer Storefront ↗
                  </Link>
                  <button
                    type="button"
                    className="announcement-dismiss-btn"
                    onClick={handleDismissAnnouncement}
                    aria-label="Dismiss announcement"
                    title="Dismiss"
                  >
                    <X size={15} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="announcement-text">
                  Free Shipping on orders above ₹999
                </span>
                <div className="announcement-links">
                  <Link to="/track-order">Track Order</Link>
                  <span className="announcement-divider">|</span>
                  <Link to="/contact">Need Help? Chat with us</Link>
                  <button
                    type="button"
                    className="announcement-dismiss-btn"
                    onClick={handleDismissAnnouncement}
                    aria-label="Dismiss announcement"
                    title="Dismiss"
                  >
                    <X size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Navigation Bar */}
      <div className="header-main">
        <div className="header-main-container">
          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Brand Logo */}
          <Link to={isAdminRoute ? "/admin" : "/"} className="brand-logo-link">
            <span className="brand-logo-title">JASERA</span>
            <span className="brand-logo-subtitle">
              {isAdminRoute ? "MANAGEMENT" : "AESTHETIC JEWELLERY"}
            </span>
          </Link>

          {/* Action Icons */}
          <div className="header-actions">
            {isAdminRoute ? (
              <>
                {/* Admin Profile & Sign Out Dropdown */}
                <div
                  className="user-menu-wrapper"
                  ref={userMenuRef}
                  onMouseEnter={() => setIsUserMenuOpen(true)}
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <button
                    className="action-btn"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    aria-label="Admin account"
                    type="button"
                    title="Admin Account"
                  >
                    <User size={21} />
                  </button>

                  {isUserMenuOpen && (
                    <div
                      className="user-dropdown-menu"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="dropdown-user-info">
                        <strong>
                          {user?.name || user?.email || "Store Admin"}
                        </strong>
                        {/* <span style={{ color: "#2E7D5B", fontWeight: "600" }}>
                          Store Administrator
                        </span> */}
                      </div>
                      <div className="dropdown-divider" />
                      <Link to="/" className="dropdown-item">
                        View Storefront
                      </Link>
                      <div className="dropdown-divider" />
                      <button
                        onClick={handleAdminSignOut}
                        className="dropdown-item dropdown-logout-btn"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  className="action-btn search-trigger"
                  onClick={openSearch}
                  aria-label="Search catalogue"
                >
                  <Search size={21} />
                  <span className="action-label d-none-mobile">Search</span>
                </button>

                <Link
                  to="/wishlist"
                  className="action-btn"
                  aria-label="Wishlist"
                >
                  <div className="badge-wrap">
                    <Heart size={21} />
                    {wishlistCount > 0 && (
                      <span className="action-badge">{wishlistCount}</span>
                    )}
                  </div>
                </Link>

                {/* Customer User Dropdown */}
                <div
                  className="user-menu-wrapper"
                  ref={userMenuRef}
                  onMouseEnter={() => setIsUserMenuOpen(true)}
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <button
                    className="action-btn"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    aria-label="User account"
                    type="button"
                  >
                    <User size={21} />
                  </button>

                  {isUserMenuOpen && (
                    <div
                      className="user-dropdown-menu"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      {isAuthenticated ? (
                        <>
                          <div className="dropdown-user-info">
                            <strong>{user?.name || user?.email}</strong>
                            <span>
                              {user?.isAdmin
                                ? "Store Owner / Admin"
                                : "Customer Account"}
                            </span>
                          </div>
                          <div className="dropdown-divider" />
                          {user?.isAdmin ? (
                            <>
                              <Link
                                to="/admin"
                                className="dropdown-item text-maroon font-semibold"
                              >
                                Admin Store Manager
                              </Link>
                              <Link to="/shop" className="dropdown-item">
                                Browse Shop
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link to="/account" className="dropdown-item">
                                My Account
                              </Link>
                              <Link to="/track-order" className="dropdown-item">
                                Track Orders
                              </Link>
                            </>
                          )}
                          <div className="dropdown-divider" />
                          <button
                            onClick={logout}
                            className="dropdown-item dropdown-logout-btn"
                          >
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="dropdown-prompt">
                            <p>Welcome to Jasera Jewels</p>
                            <Link to="/login" className="dropdown-login-btn">
                              Sign In
                            </Link>
                          </div>
                          <div className="dropdown-divider" />
                          <Link to="/track-order" className="dropdown-item">
                            Track Order
                          </Link>
                          <Link to="/contact" className="dropdown-item">
                            WhatsApp Support
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Shopping Cart Button (Customers only) */}
                <button
                  className="action-btn cart-trigger"
                  onClick={openDrawer}
                  aria-label="Shopping bag"
                >
                  <div className="badge-wrap">
                    <ShoppingBag size={21} />
                    {cartCount > 0 && (
                      <span className="action-badge">{cartCount}</span>
                    )}
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Category Navigation Bar (Customers only - Hidden on Admin routes) */}
      {!isAdminRoute && (
        <nav className="desktop-nav">
          <div className="container">
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/shop" className="nav-link">
                  All
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id} className="nav-item">
                  <Link to={`/shop?category=${cat.slug}`} className="nav-link">
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li className="nav-item">
                <Link to="/about" className="nav-link">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      )}

      {/* 4. Mobile Drawer Navigation */}
      {isMobileNavOpen && (
        <div
          className="mobile-nav-overlay"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <div
            className="mobile-nav-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-nav-header">
              <span className="brand-logo-title" style={{ fontSize: "1.3rem" }}>
                {isAdminRoute ? "JASERA ADMIN" : "JASERA"}
              </span>
              <button
                className="close-mobile-nav"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            {isAdminRoute ? (
              /* Admin Mobile Drawer with Tabs & Quick Actions */
              <div className="mobile-admin-drawer">
                <div className="mobile-drawer-section-title">
                  Navigation Tabs
                </div>
                <ul className="mobile-nav-list">
                  <li className="mobile-nav-item">
                    <button
                      type="button"
                      className={`mobile-admin-tab-btn ${location.search.includes("tab=overview") || (!location.search.includes("tab=") && location.pathname === "/admin") ? "is-active" : ""}`}
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        navigate("/admin?tab=overview");
                      }}
                    >
                      <TrendingUp size={16} />
                      <span>Overview</span>
                    </button>
                  </li>
                  <li className="mobile-nav-item">
                    <button
                      type="button"
                      className={`mobile-admin-tab-btn ${location.search.includes("tab=categories") ? "is-active" : ""}`}
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        navigate("/admin?tab=categories");
                      }}
                    >
                      <Layers size={16} />
                      <span>Categories</span>
                    </button>
                  </li>
                  <li className="mobile-nav-item">
                    <button
                      type="button"
                      className={`mobile-admin-tab-btn ${location.search.includes("tab=products") ? "is-active" : ""}`}
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        navigate("/admin?tab=products");
                      }}
                    >
                      <Package size={16} />
                      <span>Stock</span>
                    </button>
                  </li>
                  <li className="mobile-nav-item">
                    <button
                      type="button"
                      className={`mobile-admin-tab-btn ${location.search.includes("tab=orders") ? "is-active" : ""}`}
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        navigate("/admin?tab=orders");
                      }}
                    >
                      <ShoppingBag size={16} />
                      <span>Orders</span>
                    </button>
                  </li>
                </ul>

                <div className="mobile-nav-divider" />
                <div className="mobile-drawer-section-title">Quick Actions</div>
                <div className="mobile-admin-quick-actions">
                  <button
                    type="button"
                    className="mobile-quick-action-btn primary"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      navigate("/admin?tab=categories");
                      setTimeout(() => {
                        window.dispatchEvent(
                          new CustomEvent("admin-action", {
                            detail: "add-category",
                          }),
                        );
                      }, 100);
                    }}
                  >
                    <Plus size={15} />
                    <span>Add Category</span>
                  </button>
                  <button
                    type="button"
                    className="mobile-quick-action-btn gold"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      navigate("/admin?tab=products");
                      setTimeout(() => {
                        window.dispatchEvent(
                          new CustomEvent("admin-action", {
                            detail: "add-product",
                          }),
                        );
                      }, 100);
                    }}
                  >
                    <Plus size={15} />
                    <span>Add Product</span>
                  </button>
                </div>

                <div className="mobile-nav-divider" />
                <ul className="mobile-nav-list">
                  <li className="mobile-nav-item">
                    <Link
                      to="/"
                      className="mobile-nav-link"
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      View Storefront ↗
                    </Link>
                  </li>
                  <li className="mobile-nav-item">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        handleAdminSignOut();
                      }}
                      className="mobile-nav-link"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-maroon)",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        padding: "10px 0",
                        fontSize: "0.85rem",
                        fontFamily: "inherit",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              /* Customer Mobile Drawer */
              <div className="mobile-customer-drawer">
                {/* Shop Filter Button in Sidebar if on Shop page */}
                {location.pathname.startsWith("/shop") && (
                  <div className="mobile-drawer-filter-action">
                    <button
                      type="button"
                      className="mobile-sidebar-filter-btn"
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        window.dispatchEvent(
                          new CustomEvent("open-shop-filters"),
                        );
                      }}
                    >
                      <SlidersHorizontal size={16} />
                      <span>Refine & Filter Catalogue</span>
                    </button>
                  </div>
                )}

                <ul className="mobile-nav-list">
                  <li className="mobile-nav-item">
                    <Link
                      to="/shop"
                      className="mobile-nav-link"
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      All
                    </Link>
                  </li>

                  {/* Collapsible Categories Section (Collapsed by default) */}
                  {categories.length > 0 && (
                    <li className="mobile-nav-item mobile-category-accordion">
                      <button
                        type="button"
                        className="mobile-category-toggle-btn"
                        onClick={() =>
                          setIsCategoriesCollapsed((prev) => !prev)
                        }
                        aria-expanded={!isCategoriesCollapsed}
                      >
                        <span className="category-toggle-label">
                          <span>Categories</span>
                          <span className="category-count-pill">
                            {categories.length}
                          </span>
                        </span>
                        <ChevronDown
                          size={17}
                          className={`category-chevron ${!isCategoriesCollapsed ? "is-rotated" : ""}`}
                        />
                      </button>

                      {!isCategoriesCollapsed && (
                        <ul className="mobile-subnav-list">
                          {categories.map((cat) => (
                            <li key={cat.id} className="mobile-subnav-item">
                              <Link
                                to={`/shop?category=${cat.slug}`}
                                className="mobile-subnav-link"
                                onClick={() => setIsMobileNavOpen(false)}
                              >
                                {cat.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )}

                  <li className="mobile-nav-divider" />
                  <li className="mobile-nav-item">
                    <Link
                      to={
                        isAuthenticated
                          ? user?.isAdmin
                            ? "/admin"
                            : "/account"
                          : "/login"
                      }
                      className="mobile-nav-link"
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      {isAuthenticated
                        ? user?.isAdmin
                          ? "Admin Console"
                          : "My Account"
                        : "Sign In"}
                    </Link>
                  </li>
                  <li className="mobile-nav-item">
                    <Link
                      to="/track-order"
                      className="mobile-nav-link"
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      Track Order
                    </Link>
                  </li>
                  <li className="mobile-nav-item">
                    <Link
                      to="/about"
                      className="mobile-nav-link"
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      About
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
