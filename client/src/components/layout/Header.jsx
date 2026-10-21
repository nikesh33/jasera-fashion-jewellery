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
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState(true);
  const [categories, setCategories] = useState([]);
  const userMenuRef = useRef(null);
  const navDropdownRef = useRef(null);

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Close user menu and nav dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (
        navDropdownRef.current &&
        !navDropdownRef.current.contains(event.target)
      ) {
        setIsNavDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsNavDropdownOpen(false);
    setIsMobileNavOpen(false);
  }, [location.pathname]);

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
    return (
      sessionStorage.getItem("jasera_dismiss_announcement") === "true" ||
      sessionStorage.getItem("suvarna_dismiss_announcement") === "true"
    );
  });

  const handleDismissAnnouncement = () => {
    setIsAnnouncementDismissed(true);
    sessionStorage.setItem("jasera_dismiss_announcement", "true");
  };

  // Rotating Announcement Slides for Mobile Single-Line Ticker
  const announcementSlides = [
    { id: 1, text: "Free Shipping on orders above ₹999", link: null },
    { id: 2, text: "Track Order", link: "/track-order" },
    { id: 3, text: "Need Help? Chat with us", link: "/contact" },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % announcementSlides.length);
    }, 3500);
    return () => clearInterval(slideInterval);
  }, [announcementSlides.length]);

  // Build unified navigation items: 'All', dynamic categories from DB, and 'About'
  const allNavItems = [
    { label: "All", path: "/shop" },
    ...categories.map((cat) => ({
      label: cat.name,
      path: `/shop?category=${cat.slug}`,
      id: cat.id,
    })),
    { label: "About", path: "/about" },
  ];

  // Responsive rule: If more than 3 items, show first 3 directly and rest in 'More ▾' dropdown
  const visibleNavItems =
    allNavItems.length > 3 ? allNavItems.slice(0, 3) : allNavItems;
  const dropdownNavItems =
    allNavItems.length > 3 ? allNavItems.slice(3) : [];

  return (
    <header className="site-header">
      {/* 1. Announcement Bar */}
      {!isAnnouncementDismissed && (
        <div
          className={`announcement-bar ${isAdminRoute ? "admin-announcement" : ""}`}
        >
          <div className="announcement-content">
            {/* Desktop View: Clean single row */}
            <div className="announcement-desktop-view">
              {isAdminRoute ? (
                <>
                  <div className="announcement-promo">
                    <span className="announcement-text">
                      JASSERA - Management Portal
                    </span>
                  </div>
                  <div className="announcement-right-group">
                    <div className="announcement-links">
                      <Link to="/" target="_blank" rel="noopener noreferrer">
                        View Customer Storefront ↗
                      </Link>
                    </div>
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
                  <div className="announcement-promo">
                    <span className="announcement-text">
                      Free Shipping on orders above ₹999
                    </span>
                  </div>
                  <div className="announcement-right-group">
                    <div className="announcement-links">
                      <Link to="/track-order">Track Order</Link>
                      <span className="announcement-divider">|</span>
                      <Link to="/contact">Need Help? Chat with us</Link>
                    </div>
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

            {/* Mobile Ticker View: Exactly ONE single line auto-sliding ticker */}
            <div className="announcement-mobile-ticker">
              <div className="announcement-ticker-track" key={currentSlide}>
                {isAdminRoute ? (
                  currentSlide % 2 === 0 ? (
                    <span className="ticker-item">JASSERA - Management Portal</span>
                  ) : (
                    <Link
                      to="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ticker-item ticker-link"
                    >
                      View Customer Storefront ↗
                    </Link>
                  )
                ) : (
                  <>
                    {announcementSlides[currentSlide].link ? (
                      <Link
                        to={announcementSlides[currentSlide].link}
                        className="ticker-item ticker-link"
                      >
                        {announcementSlides[currentSlide].text}
                        <ArrowUpRight size={12} className="ticker-icon" />
                      </Link>
                    ) : (
                      <span className="ticker-item">
                        {announcementSlides[currentSlide].text}
                      </span>
                    )}
                  </>
                )}
              </div>
              <button
                type="button"
                className="announcement-dismiss-btn mobile-ticker-dismiss"
                onClick={handleDismissAnnouncement}
                aria-label="Dismiss announcement"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Navigation Bar */}
      <div className="header-main">
        <div className="header-main-container">
          {/* Left Group: Mobile Menu Button + Official Brand Logo */}
          <div className="header-left-group">
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMobileNavOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Brand Logo with Official Emblem Image */}
            <Link to={isAdminRoute ? "/admin" : "/"} className="brand-logo-link">
              <img
                src="/images/jassera-logo.jpg"
                alt="Jassera Jewellery & Accessories"
                className="brand-logo-img"
              />
              <div className="brand-logo-text-wrap">
                <span className="brand-logo-title">JASSERA</span>
                <span className="brand-logo-subtitle">
                  {isAdminRoute ? "MANAGEMENT" : "JEWELLERY & ACCESSORIES"}
                </span>
              </div>
            </Link>
          </div>

          {/* Center Group: Desktop Navigation inside Navbar with 3-item limit + Dropdown */}
          {!isAdminRoute && (
            <nav className="navbar-center-nav">
              <ul className="navbar-nav-list">
                {visibleNavItems.map((item) => (
                  <li key={item.path} className="navbar-nav-item">
                    <Link to={item.path} className="navbar-nav-link">
                      {item.label}
                    </Link>
                  </li>
                ))}

                {dropdownNavItems.length > 0 && (
                  <li
                    className={`navbar-nav-item navbar-dropdown-wrapper ${
                      isNavDropdownOpen ? "open" : ""
                    }`}
                    ref={navDropdownRef}
                    onMouseEnter={() => setIsNavDropdownOpen(true)}
                    onMouseLeave={() => setIsNavDropdownOpen(false)}
                  >
                    <button
                      type="button"
                      className={`navbar-nav-link navbar-dropdown-trigger ${
                        isNavDropdownOpen ? "active" : ""
                      }`}
                      onClick={() => setIsNavDropdownOpen((prev) => !prev)}
                      aria-expanded={isNavDropdownOpen}
                      aria-label="More categories"
                    >
                      <span>More</span>
                      <ChevronDown
                        size={14}
                        className={`navbar-dropdown-chevron ${
                          isNavDropdownOpen ? "open" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`navbar-dropdown-menu ${
                        isNavDropdownOpen ? "show" : ""
                      }`}
                      onClick={() => setIsNavDropdownOpen(false)}
                    >
                      {dropdownNavItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="navbar-dropdown-link"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </li>
                )}
              </ul>
            </nav>
          )}

          {/* Right Group: Action Icons */}
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

      {/* 3. Mobile Drawer Navigation */}
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
              <div className="mobile-logo-wrap">
                <img
                  src="/images/jassera-logo.jpg"
                  alt="Jassera"
                  className="mobile-logo-img"
                />
                <span className="brand-logo-title" style={{ fontSize: "1.2rem" }}>
                  {isAdminRoute ? "JASSERA ADMIN" : "JASSERA"}
                </span>
              </div>
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
