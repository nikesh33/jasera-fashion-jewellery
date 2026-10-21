import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-compact">
        {/* Top: Brand & Contacts */}
        <div className="footer-brand-line">
          <Link to="/" className="footer-logo">
            <img
              src="/images/jassera-logo.jpg"
              alt="Jassera"
              className="footer-logo-img"
            />
            <span>JASSERA</span>
          </Link>
          <div className="footer-contacts">
            <a href="mailto:support@jassera.com">support@jassera.com</a>
            <span className="sep">•</span>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="insta-link"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              @jassera.jewellery
            </a>
          </div>
        </div>

        {/* Middle: Horizontal Nav Links */}
        <nav className="footer-nav-links">
          <Link to="/shop">Shop All</Link>
          <span className="dot">•</span>
          <Link to="/orders">My Orders</Link>
          <span className="dot">•</span>
          <Link to="/track-order">Track Order</Link>
          <span className="dot">•</span>
          <Link to="/contact">Contact</Link>
          <span className="dot">•</span>
          <Link to="/shipping-policy">Shipping & Returns</Link>
          <span className="dot">•</span>
          <Link to="/privacy-policy">Privacy & Terms</Link>
        </nav>

        {/* Bottom: Minimal Copyright & Payments */}
        {/* <div className="footer-copyright-line">
          <span>© {new Date().getFullYear()} Jasera. Handcrafted with love in India.</span>
          <span className="footer-payments-note">Safe & Secure Payments • UPI • Cards • COD</span>
        </div> */}
      </div>
    </footer>
  );
}
