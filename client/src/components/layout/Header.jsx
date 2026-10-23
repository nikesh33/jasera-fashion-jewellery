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

const FALLBACK_ANNOUNCEMENTS = [
  {
    text: "Free Pan-India Delivery on orders above ₹499",
    linkText: "Shop Collection",
    linkUrl: "/shop",
  },
  {
    text: "Handcrafted Statement Jewellery & Accessories",
    linkText: "Explore Jhumkas",
    linkUrl: "/shop?category=jhumkas",
  },
  {
    text: "Special Welcome Offer: Flat 10% Off with code JASSERA10",
    linkText: "Claim Discount",
    linkUrl: "/shop",
  },
];

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
  const [announcements, setAnnouncements] = useState(FALLBACK_ANNOUNCEMENTS);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const userMenuRef = useRef(null);
  const navDropdownRef = useRef(null);

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Fetch dynamic announcements from database
  useEffect(() => {
    if (!isAdminRoute) {
      api
        .get("/announcements")
        .then((res) => {
          const list = res?.announcements || res?.data?.announcements;
          if (list?.length > 0) {
            setAnnouncements(list);
          }
        })
        .catch((err) =>
          console.warn("Could not load dynamic announcements from database:", err),
        );
    }
  }, [isAdminRoute]);

  // Rotating Announcement Timer
  useEffect(() => {
    if (isAdminRoute || announcements.length <= 1) return;
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAdminRoute, announcements.length]);

  const activeAnnouncement = isAdminRoute
    ? {
        text: "JASSERA - Management Portal",
        linkText: "View Customer Storefront ↗",
        linkUrl: "/",
      }
    : announcements[announcementIndex] || announcements[0] || {};

  // Close menus on outside click & escape key
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
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsNavDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsNavDropdownOpen(false);
    setIsMobileNavOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname, location.search]);

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

  // If categories are more than 1, show first 1 and put remaining in dropdown on click
  const visibleCategories = categories.slice(0, 1);
  const overflowCategories = categories.slice(1);
  const hasMoreCategories = overflowCategories.length > 0;

  return (
    <header className="site-header">
      {/* 1. Announcement Bar with Left Dismiss and Centered Rotating Ticker */}
      {!isAnnouncementDismissed && (
        <div
          className={`announcement-bar ${isAdminRoute ? "admin-announcement" : ""}`}
        >
          <div className="announcement-content">
            {/* Centered Announcement Message + Rotating Action Link */}
            <div className="announcement-ticker-wrap">
              <div key={announcementIndex} className="announcement-ticker-slide">
                <span className="announcement-text">
                  {activeAnnouncement.text}
                </span>
                {activeAnnouncement.linkUrl && (
                  <>
                    <span className="announcement-bullet">•</span>
                    <Link
                      to={activeAnnouncement.linkUrl}
                      className="announcement-link-action"
                      target={isAdminRoute ? "_blank" : undefined}
                      rel={isAdminRoute ? "noopener noreferrer" : undefined}
                    >
                      {activeAnnouncement.linkText}
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Group: Utility Links + Right Dismiss Cross Button */}
            <div className="announcement-right-group">
              {!isAdminRoute && (
                <div className="announcement-right-links d-none-mobile">
                  <Link to="/track-order">Track Order</Link>
                  <span className="announcement-divider">|</span>
                  <Link to="/contact">Need Help?</Link>
                </div>
              )}

              <button
                type="button"
                className="announcement-dismiss-btn announcement-dismiss-right"
                onClick={handleDismissAnnouncement}
                aria-label="Dismiss announcement"
                title="Dismiss announcement"
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
            <img
              src="/images/jassera-logo.jpg"
              alt="Jassera Jewellery & Accessories"
              className="brand-logo-crest"
            />
            <div className="brand-logo-text-group">
              <span className="brand-logo-title">JASSERA</span>
              <span className="brand-logo-subtitle">
                {isAdminRoute ? "MANAGEMENT PORTAL" : "JEWELLERY & ACCESSORIES"}
              </span>
            </div>
          </Link>

          {/* Desktop Inline Navigation centered in Navbar */}
          {!isAdminRoute && (
            <nav className="desktop-nav-inline" aria-label="Main Navigation">
              <ul className="nav-inline-list">
                <li className="nav-inline-item">
                  <Link to="/shop" className="nav-inline-link">
                    Shop
                  </Link>
                </li>

                {visibleCategories.map((cat) => (
                  <li key={cat.id} className="nav-inline-item">
                    <Link
                      to={`/shop?category=${cat.slug}`}
                      className="nav-inline-link"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}

                {/* If more than 1 category, collapse remaining into click dropdown */}
                {hasMoreCategories && (
                  <li
                    className="nav-inline-item nav-inline-dropdown"
                    ref={navDropdownRef}
                  >
                    <button
                      type="button"
                      className={`nav-inline-dropdown-btn ${isNavDropdownOpen ? "is-active" : ""}`}
                      onClick={() => setIsNavDropdownOpen((prev) => !prev)}
                      aria-expanded={isNavDropdownOpen}
                      aria-haspopup="true"
                    >
                      <span>More</span>
                      <ChevronDown
                        size={13}
                        className={`dropdown-chevron ${isNavDropdownOpen ? "is-rotated" : ""}`}
                      />
                    </button>

                    {isNavDropdownOpen && (
                      <div
                        className="nav-dropdown-menu"
                        onClick={() => setIsNavDropdownOpen(false)}
                      >
                        <div className="nav-dropdown-header">Categories</div>
                        {overflowCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/shop?category=${cat.slug}`}
                            className="nav-dropdown-item"
                          >
                            <span>{cat.name}</span>
                          </Link>
                        ))}
                        <div className="nav-dropdown-divider" />
                        <Link
                          to="/shop"
                          className="nav-dropdown-item nav-dropdown-item-all"
                        >
                          <span>View All Jewellery →</span>
                        </Link>
                      </div>
                    )}
                  </li>
                )}

                <li className="nav-inline-item">
                  <Link to="/about" className="nav-inline-link">
                    About
                  </Link>
                </li>
                <li className="nav-inline-item">
                  <Link to="/contact" className="nav-inline-link">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
          )}

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
                            <p>Welcome to Jassera Jewels</p>
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

      {/* Mobile Drawer Navigation */}
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
              <Link
                to={isAdminRoute ? "/admin" : "/"}
                className="brand-logo-link"
                onClick={() => setIsMobileNavOpen(false)}
                style={{ gap: "8px" }}
              >
                <img
                  src="/images/jassera-logo.jpg"
                  alt="Jassera"
                  className="brand-logo-crest"
                  style={{ width: "32px", height: "32px" }}
                />
                <span className="brand-logo-title" style={{ fontSize: "1.25rem" }}>
                  {isAdminRoute ? "JASSERA ADMIN" : "JASSERA"}
                </span>
              </Link>
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
