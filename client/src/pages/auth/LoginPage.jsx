import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuthStore } from "../../stores/authStore";
import "./Auth.css";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await login({
        email: identifier,
        password,
      });

      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate("/account", { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || "Invalid email/phone or password");
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="brand-logo-link auth-brand-logo">
        <img
          src="/images/jassera-logo.jpg"
          alt="Jassera Jewellery & Accessories"
          className="auth-logo-img"
        />
        <span className="brand-logo-title">JASSERA</span>
        <span className="brand-logo-subtitle">JEWELLERY & ACCESSORIES</span>
      </Link>

      <div className="auth-card">
        {/* <span className="auth-eyebrow">CUSTOMER ACCOUNT</span> */}
        <h1 className="auth-title">Welcome Back</h1>

        {errorMsg && (
          <div
            style={{
              backgroundColor: "#FCEAE9",
              color: "#B3261E",
              padding: "10px 14px",
              borderRadius: "4px",
              marginBottom: "16px",
              fontSize: "0.85rem",
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Email Address or Mobile Number"
            type="text"
            required
            icon={Mail}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or 10-digit phone"
          />
          <Input
            label="Password"
            type="password"
            required
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="auth-forgot-row">
            <Link to="/contact" className="auth-link">
              Need Help? Contact Concierge
            </Link>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            type="submit"
            isLoading={isLoading}
            icon={ArrowRight}
          >
            Sign In
          </Button>
        </form>

        <div className="auth-footer-prompt">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="auth-link-bold">
            Create Account
          </Link>
        </div>

        <div className="auth-guarantee-note">
          <ShieldCheck size={16} />
          <span>Your personal information is secure and encrypted</span>
        </div>
      </div>

      <div className="auth-back-link">
        <Link to="/">← Back to Storefront</Link>
      </div>
    </div>
  );
}
