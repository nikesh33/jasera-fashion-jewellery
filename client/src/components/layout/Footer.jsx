import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, CheckCircle, Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import "./Footer.css";

export function Footer() {
  const [settings, setSettings] = useState(null);
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState(null); // 'loading', 'success', 'error'
  const [subscribeMsg, setSubscribeMsg] = useState("");

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => {
        if (res?.data?.settings) setSettings(res.data.settings);
      })
      .catch((err) => console.warn("Footer settings load error:", err.message));
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setSubscribeStatus("loading");
    try {
      const res = await api.post("/newsletter/subscribe", { email });
      setSubscribeStatus("success");
      setSubscribeMsg(res?.message || "Subscribed successfully! Welcome to the Jasera circle.");
      setEmail("");
    } catch (err) {
      setSubscribeStatus("error");
      setSubscribeMsg(err.message || "Failed to subscribe. Please try again.");
    }
  };

  const supportEmail = settings?.support_email || "support@jasera.in";
  const instagramUrl = settings?.instagram_url || "https://instagram.com/jasera.jewels";

  return (
    <footer className="site-footer">
      <div className="container footer-compact">
        {/* Newsletter Subscription Strip (Item #12: newsletter_subscribers) */}
        <div className="footer-newsletter-box" style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          <div>
            <h4 style={{ margin: '0 0 6px', color: '#FDFBF7', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#D4AF37" /> Join The Jasera VIP Circle
            </h4>
            <p style={{ margin: 0, color: '#A0A0A0', fontSize: '0.88rem' }}>
              Receive secret drop previews, festive discounts & styling tips straight to your inbox.
            </p>
          </div>

          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '8px', minWidth: '300px', flexGrow: 1, maxWidth: '460px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              required
              style={{
                flexGrow: 1,
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: '#1A1A1A',
                color: '#FFF',
                fontSize: '0.9rem'
              }}
            />
            <button
              type="submit"
              disabled={subscribeStatus === 'loading'}
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA8022 100%)',
                color: '#121212',
                border: 'none',
                borderRadius: '6px',
                padding: '0 18px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem'
              }}
            >
              {subscribeStatus === 'loading' ? 'Joining...' : <><Send size={15} /> Subscribe</>}
            </button>
          </form>

          {subscribeMsg && (
            <div style={{ width: '100%', fontSize: '0.85rem', color: subscribeStatus === 'success' ? '#4CAF50' : '#FF5252', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {subscribeStatus === 'success' && <CheckCircle size={14} />} {subscribeMsg}
            </div>
          )}
        </div>

        {/* Top: Brand & Contacts (Item #25: store_settings) */}
        <div className="footer-brand-line">
          <Link to="/" className="footer-logo">
            JASERA
          </Link>
          <div className="footer-contacts">
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            <span className="sep">•</span>
            <a
              href={instagramUrl}
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
              @jasera.jewels
            </a>
          </div>
        </div>

        {/* Middle: Horizontal Nav Links */}
        <nav className="footer-nav-links">
          <Link to="/shop">Shop All</Link>
          <span className="dot">•</span>
          <Link to="/account">My Account</Link>
          <span className="dot">•</span>
          <Link to="/track-order">Track Order</Link>
          <span className="dot">•</span>
          <Link to="/contact">Contact</Link>
          <span className="dot">•</span>
          <Link to="/shipping-policy">Shipping & Returns</Link>
          <span className="dot">•</span>
          <Link to="/privacy-policy">Privacy & Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
