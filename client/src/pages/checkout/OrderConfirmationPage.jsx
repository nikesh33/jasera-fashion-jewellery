import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ShieldCheck, Award, FileText, ArrowRight, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../lib/utils';
import './OrderConfirmationPage.css';

export function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const savedOrder = JSON.parse(sessionStorage.getItem('suvarna_last_order') || 'null');
  const orderNumber = orderId || savedOrder?.orderNumber || `SUV-2026-839201`;
  const items = savedOrder?.items || [];
  const total = savedOrder?.total || 245000;
  const address = savedOrder?.address;

  return (
    <div className="order-conf-page container">
      <div className="order-conf-card">
        {/* Success Icon */}
        <div className="conf-icon-wrap">
          <CheckCircle size={56} className="conf-icon" />
        </div>

        <span className="conf-eyebrow">ORDER CONFIRMED & DISPATCH PREPARED</span>
        <h1 className="conf-title">Thank You For Your Order!</h1>
        <p className="conf-subtitle">
          Your order <strong>{orderNumber}</strong> has been successfully placed. Order details and shipping updates have been sent to <strong>{address?.email || 'your email'}</strong>.
        </p>

        {/* Highlight Details Box */}
        <div className="conf-info-grid">
          <div className="conf-info-tile">
            <span className="tile-label">Order Number</span>
            <strong className="tile-val font-mono">{orderNumber}</strong>
          </div>
          <div className="conf-info-tile">
            <span className="tile-label">Estimated Delivery</span>
            <strong className="tile-val">Within 3-5 Business Days</strong>
          </div>
          <div className="conf-info-tile">
            <span className="tile-label">Payment Method</span>
            <strong className="tile-val text-capitalize">{savedOrder?.paymentMethod || 'Online Payment'}</strong>
          </div>
          <div className="conf-info-tile">
            <span className="tile-label">Total Amount</span>
            <strong className="tile-val text-maroon">{formatPrice(total)}</strong>
          </div>
        </div>

        {/* Delivery Address */}
        {address && (
          <div className="conf-address-block">
            <h4>Shipping Address</h4>
            <p>
              <strong>{address.fullName}</strong> ({address.phone})<br />
              {address.addressLine1}, {address.addressLine2 ? `${address.addressLine2}, ` : ''}
              {address.city}, {address.state} - {address.pincode}
            </p>
          </div>
        )}

        {/* Trust Badges */}
        <div className="conf-trust-strip">
          <div className="conf-trust-pill">
            <Award size={18} className="trust-ic" />
            <span>Hand-Inspected Quality Assured</span>
          </div>
          <div className="conf-trust-pill">
            <ShieldCheck size={18} className="trust-ic" />
            <span>Aesthetic Gift Packaging Enclosed</span>
          </div>
        </div>

        {/* Actions */}
        <div className="conf-actions-row">
          <Button
            variant="primary"
            size="md"
            icon={Home}
            onClick={() => navigate('/')}
          >
            Back to Homepage
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={ArrowRight}
            onClick={() => navigate('/shop')}
          >
            Explore More Jewels
          </Button>
        </div>
      </div>
    </div>
  );
}
