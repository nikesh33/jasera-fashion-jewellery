import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag, ShoppingBag } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useCartStore } from '../../stores/cartStore';
import { formatPrice } from '../../lib/utils';
import './CartPage.css';

export function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    getSubtotal,
    getTax,
    getTotal,
    coupon,
    discount,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState(null);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const res = await applyCoupon(couponInput);
    setCouponMessage(res);
    if (res.success) setCouponInput('');
  };

  if (items.length === 0) {
    return (
      <div className="cart-page-empty container">
        <div className="cart-empty-art">
          <ShoppingBag size={64} strokeWidth={1} color="var(--color-maroon)" />
        </div>
        <h2 className="empty-title">Your Shopping Bag Is Empty</h2>
        <p className="empty-desc">
          Discover our viral handcrafted jhumkas, statement earrings, and anti-tarnish daily wear.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate('/shop')}>
          Explore Catalogue
        </Button>
      </div>
    );
  }

  return (
    <div className="cart-page container">
      <h1 className="cart-page-heading">Your Shopping Bag</h1>

      <div className="cart-layout-grid">
        {/* Left Column: Line Items */}
        <div className="cart-items-column">
          <div className="cart-table-header">
            <span>Product</span>
            <span>Quantity</span>
            <span>Total</span>
          </div>

          <div className="cart-items-list">
            {items.map((item) => (
              <div key={item.id} className="cart-row">
                {/* Product Detail */}
                <div className="cart-product-cell">
                  <img
                    src={item.product.primary_image}
                    alt={item.product.name}
                    className="cart-thumb"
                  />
                  <div className="cart-item-meta">
                    <span className="cart-item-mat">{item.product.material}</span>
                    <h3 className="cart-item-title">
                      <Link to={`/product/${item.product.slug}`}>{item.product.name}</Link>
                    </h3>
                    {item.variant && (
                      <span className="cart-item-variant">Size: {item.variant.size}</span>
                    )}
                    <span className="cart-item-unit-price">
                      {formatPrice(item.product.selling_price)}
                    </span>
                    <button
                      className="cart-remove-link"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div className="cart-quantity-cell">
                  <div className="cart-stepper">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="stepper-btn"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="stepper-count">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="stepper-btn"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="cart-total-cell">
                  <span className="cart-row-total">
                    {formatPrice(item.product.selling_price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-assurance-banner">
            <ShieldCheck size={24} className="banner-icon" />
            <div>
              <strong>100% Insured & Sealed Delivery</strong>
              <p>Every shipment is packed in tamper-proof security enclosures with transit insurance.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="cart-summary-column">
          <div className="cart-summary-card">
            <h3 className="summary-title">Order Summary</h3>

            {/* Promo Code Form */}
            <form onSubmit={handleApplyCoupon} className="coupon-box">
              <div className="coupon-input-wrap">
                <Tag size={16} className="coupon-tag-icon" />
                <input
                  type="text"
                  placeholder="Promo Code (e.g. JASSERA10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="coupon-input"
                />
              </div>
              <Button variant="outline" size="sm" type="submit">
                Apply
              </Button>
            </form>

            {coupon && (
              <div className="applied-coupon-pill">
                <span>Applied: <strong>{coupon}</strong> (-{formatPrice(discount)})</span>
                <button type="button" onClick={removeCoupon} className="remove-coupon-btn">
                  ×
                </button>
              </div>
            )}

            {couponMessage && (
              <p className={`coupon-feedback ${couponMessage.success ? 'success' : 'error'}`}>
                {couponMessage.message}
              </p>
            )}

            {/* Calculations */}
            <div className="summary-breakdown">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(getSubtotal())}</span>
              </div>
              {discount > 0 && (
                <div className="summary-row discount-row">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Estimated GST (3%)</span>
                <span>{formatPrice(getTax())}</span>
              </div>
              <div className="summary-row">
                <span>Insured Doorstep Transit</span>
                <span className="text-success">Complimentary</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row total-row">
                <span>Grand Total</span>
                <span>{formatPrice(getTotal())}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={ArrowRight}
              onClick={() => navigate('/checkout')}
            >
              Proceed To Checkout
            </Button>

            <div className="summary-security-note">
              <span>Encrypted 256-Bit SSL Checkout Protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
