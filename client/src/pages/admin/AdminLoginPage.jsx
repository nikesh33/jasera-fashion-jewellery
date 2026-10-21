import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import '../auth/Auth.css';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminLogin, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await adminLogin({ email, password });
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-ivory)',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="auth-card"
        style={{
          maxWidth: '400px',
          width: '100%',
          textAlign: 'left',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-md)',
          padding: '36px 32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link to="/" className="brand-logo-link auth-brand-logo" style={{ marginBottom: '14px' }}>
            <img
              src="/images/jassera-logo.jpg"
              alt="Jassera Jewellery & Accessories"
              className="auth-logo-img"
              style={{ width: '60px', height: '60px' }}
            />
            <span className="brand-logo-title" style={{ fontSize: '1.6rem' }}>JASSERA</span>
            <span className="brand-logo-subtitle" style={{ fontSize: '0.62rem' }}>MANAGEMENT PORTAL</span>
          </Link>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.4rem',
              color: 'var(--color-maroon)',
              margin: '0 0 6px',
              fontWeight: 700,
            }}
          >
            Admin Sign In
          </h1>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: '#FCEAE9',
              color: '#B3261E',
              padding: '10px 14px',
              borderRadius: '4px',
              marginBottom: '18px',
              fontSize: '0.85rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="Email"
            type="email"
            required
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@jassera.com"
            autoFocus
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

          <Button
            variant="primary"
            size="lg"
            fullWidth
            type="submit"
            isLoading={isLoading}
            style={{ marginTop: '12px' }}
          >
            Sign In
          </Button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem' }}>
          <Link
            to="/"
            style={{
              color: 'var(--grey-600)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={14} /> Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
