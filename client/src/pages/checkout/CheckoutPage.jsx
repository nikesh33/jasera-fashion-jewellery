import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  MapPin,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Trash2,
  AlertCircle,
  HelpCircle,
  Edit3,
  X,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { formatPrice } from '../../lib/utils';
import { api } from '../../lib/api';
import './CheckoutPage.css';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, getSubtotal, getTax, getTotal, discount, clearCart } = useCartStore();

  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Review
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sandbox modal state
  const [sandboxOrder, setSandboxOrder] = useState(null);

  // Step 1: Address Details (Auto-prefilled from saved address or user account)
  const [address, setAddress] = useState(() => {
    try {
      const stored = localStorage.getItem('suvarna_saved_address');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.fullName && parsed?.addressLine1) {
          return {
            fullName: parsed.fullName || '',
            phone: parsed.phone || '',
            email: parsed.email || user?.email || '',
            pincode: parsed.pincode || '',
            addressLine1: parsed.addressLine1 || '',
            addressLine2: parsed.addressLine2 || '',
            landmark: parsed.landmark || '',
            city: parsed.city || '',
            state: parsed.state || '',
          };
        }
      }
    } catch (e) { }

    if (user) {
      return {
        fullName: user.name || '',
        phone: user.phone || '9876543210',
        email: user.email || '',
        pincode: '400006',
        addressLine1: '402, Royal Residency, Heritage Lane',
        addressLine2: 'Malabar Hill',
        landmark: 'Near Hanging Gardens',
        city: 'Mumbai',
        state: 'Maharashtra',
      };
    }

    return {
      fullName: '',
      phone: '',
      email: '',
      pincode: '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
    };
  });

  const hasSavedAddress = Boolean(
    address.fullName && address.phone && address.addressLine1 && address.city && address.state && address.pincode
  );

  const [isEditingAddress, setIsEditingAddress] = useState(!hasSavedAddress);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);

  // Sync user details and saved address if user logs in or state updates
  React.useEffect(() => {
    if (user) {
      setAddress((prev) => {
        const isBlank = !prev.addressLine1;
        if (isBlank) {
          const autoAddress = {
            fullName: prev.fullName || user.name || '',
            phone: prev.phone || user.phone || '9876543210',
            email: prev.email || user.email || '',
            pincode: '400006',
            addressLine1: '402, Royal Residency, Heritage Lane',
            addressLine2: 'Malabar Hill',
            landmark: 'Near Hanging Gardens',
            city: 'Mumbai',
            state: 'Maharashtra',
          };
          try {
            if (!localStorage.getItem('suvarna_saved_address')) {
              localStorage.setItem('suvarna_saved_address', JSON.stringify(autoAddress));
            }
          } catch (e) { }
          return autoAddress;
        }
        return {
          ...prev,
          fullName: prev.fullName || user.name || '',
          phone: prev.phone || user.phone || '',
          email: prev.email || user.email || '',
        };
      });
    }
  }, [user]);

  // Step 2: Payment Details
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'cod'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Step 3: Terms
  const [agreeTerms, setAgreeTerms] = useState(true);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleAddressSubmit = (e) => {
    if (e) e.preventDefault();
    if (!address.fullName || !address.phone || !address.pincode || !address.addressLine1 || !address.city || !address.state) {
      alert('Please fill all required address fields.');
      return;
    }
    if (saveAddressForFuture) {
      try {
        localStorage.setItem('suvarna_saved_address', JSON.stringify(address));
      } catch (err) { }
    }
    setStep(2);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!agreeTerms) {
      alert('Please agree to the Terms & Conditions and Store Policies.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const idempotencyKey = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        items: items.map((i) => ({
          productId: i.product?.id || i.productId,
          variantId: i.variant?.id || i.variantId || null,
          quantity: i.quantity,
        })),
        address,
        paymentMethod,
        idempotencyKey,
      };

      const res = await api.post('/orders', payload);

      if (res?.data?.orderNumber) {
        const orderData = res.data;

        // If Cash on Delivery, order is confirmed immediately
        if (paymentMethod === 'cod') {
          sessionStorage.setItem('suvarna_last_order', JSON.stringify({
            orderNumber: orderData.orderNumber,
            orderId: orderData.orderId,
            items,
            total: orderData.total,
            address,
            paymentMethod: 'Cash on Delivery',
            placedAt: new Date().toISOString(),
          }));
          clearCart();
          navigate(`/order-confirmation/${orderData.orderNumber}`);
          return;
        }

        // If Online Payment: check if test mode or live Razorpay
        if (orderData.razorpay?.isTestMode) {
          // Open test payment simulation modal
          setSandboxOrder(orderData);
        } else if (orderData.razorpay?.id && window.Razorpay) {
          // Open real live Razorpay SDK
          const options = {
            key: orderData.razorpay.keyId,
            amount: orderData.razorpay.amount,
            currency: 'INR',
            name: 'Jasera Boutique',
            description: `Payment for Order ${orderData.orderNumber}`,
            order_id: orderData.razorpay.id,
            prefill: {
              name: address.fullName,
              email: address.email,
              contact: address.phone,
            },
            handler: async function (response) {
              try {
                await api.post('/orders/verify-payment', {
                  orderNumber: orderData.orderNumber,
                  orderId: orderData.orderId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                sessionStorage.setItem('suvarna_last_order', JSON.stringify({
                  orderNumber: orderData.orderNumber,
                  orderId: orderData.orderId,
                  items,
                  total: orderData.total,
                  address,
                  paymentMethod: 'Online Payment (Razorpay)',
                  placedAt: new Date().toISOString(),
                }));
                clearCart();
                navigate(`/order-confirmation/${orderData.orderNumber}`);
              } catch (vErr) {
                setErrorMessage('Payment validation failed: ' + vErr.message);
              }
            },
            modal: {
              ondismiss: function () {
                setErrorMessage('Payment cancelled by user. Your order has been placed in pending state.');
              },
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Fallback sandbox simulation if Razorpay JS is not loaded
          setSandboxOrder(orderData);
        }
      } else {
        throw new Error(res?.message || 'Order creation failed');
      }
    } catch (err) {
      console.error('Failed to submit order to database:', err);
      setErrorMessage(err.message || 'Error processing order with server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateSandboxSuccess = async () => {
    if (!sandboxOrder) return;
    setIsSubmitting(true);
    try {
      await api.post('/orders/verify-payment', {
        orderNumber: sandboxOrder.orderNumber,
        orderId: sandboxOrder.orderId,
        isTestConfirmation: true,
        razorpay_order_id: sandboxOrder.razorpay?.id || 'sandbox_order',
        razorpay_payment_id: `pay_sandbox_${Date.now()}`,
        razorpay_signature: 'sandbox_verified_sig',
      });

      sessionStorage.setItem('suvarna_last_order', JSON.stringify({
        orderNumber: sandboxOrder.orderNumber,
        orderId: sandboxOrder.orderId,
        items,
        total: sandboxOrder.total,
        address,
        paymentMethod: `${paymentMethod.toUpperCase()} (Test Sandbox)`,
        placedAt: new Date().toISOString(),
      }));

      clearCart();
      navigate(`/order-confirmation/${sandboxOrder.orderNumber}`);
    } catch (err) {
      setErrorMessage(err.message || 'Payment simulation failed');
    } finally {
      setIsSubmitting(false);
      setSandboxOrder(null);
    }
  };

  const handleSimulateSandboxFailure = () => {
    setSandboxOrder(null);
    setErrorMessage('Payment cancelled or simulated failed. The order was not confirmed as paid.');
  };

  return (
    <div className="checkout-page container">
      {/* Checkout Progress Stepper */}
      <div className="checkout-stepper">
        <div className={`step-item ${step >= 1 ? 'is-active' : ''} ${step > 1 ? 'is-completed' : ''}`}>
          <div className="step-circle">1</div>
          <span className="step-label">Shipping Address</span>
        </div>
        <div className="step-connector" />
        <div className={`step-item ${step >= 2 ? 'is-active' : ''} ${step > 2 ? 'is-completed' : ''}`}>
          <div className="step-circle">2</div>
          <span className="step-label">Payment Method</span>
        </div>
        <div className="step-connector" />
        <div className={`step-item ${step === 3 ? 'is-active' : ''}`}>
          <div className="step-circle">3</div>
          <span className="step-label">Review & Confirm</span>
        </div>
      </div>

      <div className="checkout-grid">
        {/* Main Step Form Area */}
        <div className="checkout-form-column">
          {errorMessage && (
            <div style={{ backgroundColor: '#FCEAE9', color: '#B3261E', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px' }}>
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Address */}
          {step === 1 && (
            <div className="checkout-card">
              <h2 className="step-title">
                <MapPin size={22} className="step-ic" /> Shipping Details
              </h2>

              {hasSavedAddress && !isEditingAddress ? (
                <div className="saved-address-callout">
                  <div className="saved-callout-header">
                    <div className="">
                      {/* <CheckCircle2 size={15} /> Saved Delivery Address */}
                    </div>
                    <button
                      type="button"
                      className="edit-addr-btn"
                      onClick={() => setIsEditingAddress(true)}
                    >
                      <Edit3 size={14} /> Change address
                    </button>
                  </div>

                  <div className="saved-callout-details">
                    <div className="saved-callout-recipient">
                      <span className="recipient-name">{address.fullName}</span>
                      <span className="recipient-phone">{address.phone}</span>
                    </div>
                    <p className="recipient-address">
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                      {address.landmark ? ` (Landmark: ${address.landmark})` : ''}
                    </p>
                    <p className="recipient-location">
                      {address.city}, {address.state} — <span className="font-mono">{address.pincode}</span>
                    </p>
                    {address.email && (
                      <p className="recipient-email">
                        Order updates sent to: <strong>{address.email}</strong>
                      </p>
                    )}
                  </div>

                  <div className="step-actions">
                    <Button
                      variant="primary"
                      size="lg"
                      type="button"
                      icon={ArrowRight}
                      onClick={() => handleAddressSubmit()}
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddressSubmit}>
                  {hasSavedAddress && (
                    <div className="back-to-saved-row">
                      <span>Using a different address?</span>
                      <button
                        type="button"
                        className="btn-use-saved"
                        onClick={() => setIsEditingAddress(false)}
                      >
                        ← Deliver to saved address instead
                      </button>
                    </div>
                  )}

                  <div className="form-grid-2">
                    <Input
                      label="Recipient Name"
                      required
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                    />
                    <Input
                      label="Mobile Number"
                      type="tel"
                      required
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  <div className="form-grid-2">
                    <Input
                      label="Email"
                      type="email"
                      required
                      value={address.email}
                      onChange={(e) => setAddress({ ...address, email: e.target.value })}
                      placeholder="yourname@example.com"
                    />
                    <Input
                      label="Pincode"
                      required
                      maxLength={6}
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                      placeholder="e.g. 400050"
                    />
                  </div>

                  <Input
                    label="House / Flat No"
                    required
                    value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                    placeholder="Apartment 402, Building 4"
                  />

                  <Input
                    label="Area / Locality"
                    value={address.addressLine2}
                    onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                    placeholder="Bandra West"
                  />

                  <div className="form-grid-3">
                    <Input
                      label="Landmark"
                      value={address.landmark}
                      onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                      placeholder="Near Metro Station"
                    />
                    <Input
                      label="City"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="Mumbai"
                    />
                    <Input
                      label="State"
                      required
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      placeholder="Maharashtra"
                    />
                  </div>

                  <div className="save-future-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={saveAddressForFuture}
                        onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                      />
                      <span>Save this delivery address for future orders</span>
                    </label>
                  </div>

                  <div className="step-actions">
                    <Button variant="primary" size="lg" type="submit" icon={ArrowRight}>
                      Proceed to Payment
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: Payment */}
          {step === 2 && (
            <form onSubmit={handlePaymentSubmit} className="checkout-card">
              <h2 className="step-title">
                <CreditCard size={22} className="step-ic" /> Select Payment Method
              </h2>


              <div className="payment-options-list">
                {/* UPI */}
                <label className={`payment-method-tile ${paymentMethod === 'upi' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                  />
                  <div className="method-info">
                    <strong>UPI & Instant QR</strong>
                    <span>Google Pay, PhonePe, Paytm, BHIM or any UPI app</span>
                  </div>
                </label>
                {paymentMethod === 'upi' && (
                  <div className="method-details-panel">
                    <Input
                      label="Enter UPI ID"
                      placeholder="username@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <span className="upi-helper">You can pay directly via QR or UPI app during authorization.</span>
                  </div>
                )}

                {/* Cards */}
                <label className={`payment-method-tile ${paymentMethod === 'card' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                  />
                  <div className="method-info">
                    <strong>Credit & Debit Cards</strong>
                    <span>Visa, MasterCard, RuPay, Maestro</span>
                  </div>
                </label>
                {paymentMethod === 'card' && (
                  <div className="method-details-panel">
                    <Input
                      label="Card Number"
                      placeholder="4111 2222 3333 4444"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                    <div className="form-grid-2">
                      <Input
                        label="Expiry Date"
                        placeholder="MM / YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                      <Input
                        label="CVV"
                        placeholder="123"
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Net Banking */}
                <label className={`payment-method-tile ${paymentMethod === 'netbanking' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'netbanking'}
                    onChange={() => setPaymentMethod('netbanking')}
                  />
                  <div className="method-info">
                    <strong>Net Banking</strong>
                    <span>HDFC, ICICI, SBI, Axis, Kotak, and 50+ other Indian banks</span>
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label className={`payment-method-tile ${paymentMethod === 'cod' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <div className="method-info">
                    <strong>Cash on Delivery (COD)</strong>
                    <span>Pay in cash directly when your parcel arrives at your doorstep</span>
                  </div>
                </label>
              </div>

              <div className="step-actions-between">
                <Button variant="outline" size="md" onClick={() => setStep(1)}>
                  Back to Address
                </Button>
                <Button variant="primary" size="lg" type="submit" icon={ArrowRight}>
                  Review Order
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Review & Place Order */}
          {step === 3 && (
            <div className="checkout-card">
              <h2 className="step-title">
                <CheckCircle2 size={22} className="step-ic" /> Confirm Order
              </h2>


              {/* Delivery Destination Summary */}
              <div className="review-box">
                <div className="review-box-header">
                  <strong>Delivering To:</strong>
                  <button onClick={() => setStep(1)} className="review-edit-btn">Edit</button>
                </div>
                <p className="review-address-text">
                  <strong>{address.fullName}</strong> ({address.phone})<br />
                  {address.addressLine1}, {address.addressLine2 ? `${address.addressLine2}, ` : ''}
                  {address.city}, {address.state} - {address.pincode}
                </p>
              </div>

              {/* Payment Summary */}
              <div className="review-box">
                <div className="review-box-header">
                  <strong>Payment Choice:</strong>
                  <button onClick={() => setStep(2)} className="review-edit-btn">Edit</button>
                </div>
                <p className="review-payment-text">
                  {paymentMethod === 'upi' && 'Instant UPI Transfer / QR'}
                  {paymentMethod === 'card' && 'Credit / Debit Card (256-bit encrypted)'}
                  {paymentMethod === 'netbanking' && 'Indian Net Banking Gateway'}
                  {paymentMethod === 'cod' && 'Cash on Delivery (Pay upon delivery)'}
                </p>
              </div>

              {/* Ordered Items Preview */}
              <div className="review-items-list">
                {items.map((item) => (
                  <div key={item.id} className="review-item-row">
                    <img src={item.product?.primary_image} alt={item.product?.name} />
                    <div className="review-item-info">
                      <h4>{item.product?.name}</h4>
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <span className="review-item-price">
                      {formatPrice(item.product?.selling_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Terms agreement */}
              <label className="terms-checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span>
                  I agree to the Jasera Boutique Terms of Sale, 7-Day Easy Exchange Policy, and Privacy Policy.
                </span>
              </label>

              <div className="step-actions-between">
                <Button variant="outline" size="md" onClick={() => setStep(2)}>
                  Back to Payment
                </Button>
                <Button
                  variant="gold"
                  size="lg"
                  isLoading={isSubmitting}
                  onClick={handlePlaceOrder}
                >
                  Place Order {formatPrice(getTotal())}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Summary Sidebar */}
        <div className="checkout-summary-sidebar">
          <div className="checkout-mini-summary">
            <h3>Order Summary ({items.length} items)</h3>
            <div className="mini-breakdown">
              <div className="mini-row">
                <span>Subtotal</span>
                <span>{formatPrice(getSubtotal())}</span>
              </div>
              {discount > 0 && (
                <div className="mini-row text-success">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="mini-row">
                <span>GST (3%)</span>
                <span>{formatPrice(getTax())}</span>
              </div>
              <div className="mini-row">
                <span>Express Courier</span>
                <span className="text-success">Free</span>
              </div>
              <div className="mini-divider" />
              <div className="mini-row grand-total">
                <span>Total Amount</span>
                <span>{formatPrice(getTotal())}</span>
              </div>
            </div>

            <div className="mini-trust-callout">
              <ShieldCheck size={20} className="trust-ic" />
              <span>Complimentary aesthetic gift box & express tracking included with your order.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Sandbox Simulation Modal */}
      {sandboxOrder && (
        <div className="sandbox-modal-overlay" onClick={handleSimulateSandboxFailure}>
          <div className="sandbox-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sandbox-modal-header">
              <div className="sandbox-header-title-wrap">
                <div className="sandbox-header-icon">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="sandbox-title">Payment Gateway</h3>
                  <span className="sandbox-badge">Demonstration Sandbox</span>
                </div>
              </div>
              <button
                type="button"
                className="sandbox-close-btn"
                onClick={handleSimulateSandboxFailure}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="sandbox-modal-body">
              <div className="sandbox-order-info">
                <div className="sandbox-info-row">
                  <span className="sandbox-info-label">Order Reference</span>
                  <span className="sandbox-order-ref font-mono">{sandboxOrder.orderNumber}</span>
                </div>
                <div className="sandbox-info-row">
                  <span className="sandbox-info-label">Payment Mode</span>
                  <span className="sandbox-mode-tag">{paymentMethod.toUpperCase()}</span>
                </div>
                <div className="sandbox-info-row total-row">
                  <span className="sandbox-info-label">Total Payable</span>
                  <span className="sandbox-total-amount">{formatPrice(sandboxOrder.total)}</span>
                </div>
              </div>

              <div className="sandbox-notice">
                <ShieldCheck size={18} className="sandbox-notice-ic" />
                <p>
                  This boutique order is operating in demonstration sandbox mode. Verify your payment to complete your purchase.
                </p>
              </div>

              <div className="sandbox-actions">
                <button
                  type="button"
                  className="btn-sandbox-success"
                  disabled={isSubmitting}
                  onClick={handleSimulateSandboxSuccess}
                >
                  <CheckCircle2 size={18} />
                  <span>{isSubmitting ? 'Verifying & Confirming...' : 'Confirm Successful Payment'}</span>
                </button>
                <button
                  type="button"
                  className="btn-sandbox-fail"
                  disabled={isSubmitting}
                  onClick={handleSimulateSandboxFailure}
                >
                  <AlertCircle size={18} />
                  <span>Simulate Payment Failure / Cancel</span>
                </button>
              </div>

              <div className="sandbox-security-foot">
                <Lock size={12} />
                <span>256-Bit Encrypted Secure Sandbox Checkout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
