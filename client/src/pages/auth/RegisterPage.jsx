import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Smartphone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import './Auth.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (form.password !== form.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      navigate('/account');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <Link to="/" className="brand-logo-link auth-brand-logo">
        <img
          src="/images/jassera-logo.jpg"
          alt="Jassera Jewellery & Accessories"
          className="auth-logo-crest"
        />
        <span className="brand-logo-title">JASSERA</span>
        <span className="brand-logo-subtitle">JEWELLERY & ACCESSORIES</span>
      </Link>

      <div className="auth-card">
        <span className="auth-eyebrow">NEW CUSTOMER</span>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">
          Sign up to track your orders, save items to your wishlist, and enjoy quick checkout.
        </p>

        {errorMsg && (
          <div style={{ backgroundColor: '#FCEAE9', color: '#B3261E', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Full Name"
            required
            icon={User}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your Full Name"
          />
          <Input
            label="Email Address"
            type="email"
            required
            icon={Mail}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
          <Input
            label="Mobile Phone Number"
            required
            icon={Smartphone}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="10-digit mobile number"
          />
          <Input
            label="Password"
            type="password"
            required
            icon={Lock}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            icon={Lock}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Repeat password"
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            type="submit"
            isLoading={isLoading}
            icon={ArrowRight}
          >
            Create Account
          </Button>
        </form>

        <div className="auth-footer-prompt">
          <span>Already have an account? </span>
          <Link to="/login" className="auth-link-bold">
            Sign In
          </Link>
        </div>

        <div className="auth-guarantee-note">
          <ShieldCheck size={16} />
          <span>Your personal details are safeguarded with private encryption</span>
        </div>
      </div>

      <div className="auth-back-link">
        <Link to="/">← Back to Storefront</Link>
      </div>
    </div>
  );
}
