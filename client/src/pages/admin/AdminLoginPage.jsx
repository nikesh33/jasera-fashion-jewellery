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
          <img
            src="/images/jassera-logo.jpg"
            alt="Jassera Jewellery"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(197, 162, 98, 0.45)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              margin: '0 auto 12px',
              display: 'block',
            }}
          />
          <span
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-antique-gold-dark)',
              fontWeight: 600,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            JASSERA MANAGEMENT PORTAL
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.75rem',
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
