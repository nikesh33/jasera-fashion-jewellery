import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, MapPin, Heart, Shield, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import './AccountPage.css';

export function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile' | 'addresses'

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [savedAddress, setSavedAddress] = useState(() => {
    try {
      const stored = localStorage.getItem('suvarna_saved_address');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      fullName: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      pincode: '400006',
      addressLine1: '402, Royal Residency, Heritage Lane',
      addressLine2: 'Malabar Hill',
      landmark: 'Near Hanging Gardens',
      city: 'Mumbai',
      state: 'Maharashtra',
    };
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState(savedAddress);
  const [addressSavedSuccess, setAddressSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    try {
      if (!localStorage.getItem('suvarna_saved_address') && savedAddress?.addressLine1) {
        localStorage.setItem('suvarna_saved_address', JSON.stringify(savedAddress));
      }
    } catch (e) {}
  }, [savedAddress]);

  const handleSaveAddress = (e) => {
    e.preventDefault();
    setSavedAddress(addressForm);
    localStorage.setItem('suvarna_saved_address', JSON.stringify(addressForm));
    if (updateProfile) {
      updateProfile({ savedAddress: addressForm });
    }
    setIsEditingAddress(false);
    setAddressSavedSuccess(true);
    setTimeout(() => setAddressSavedSuccess(false), 3000);
  };

  const [savedSuccess, setSavedSuccess] = useState(false);

  const [orders, setOrders] = useState([]);
  const [returnsList, setReturnsList] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('Size does not fit');
  const [returnMethod, setReturnMethod] = useState('original');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  useEffect(() => {
    Promise.allSettled([
      api.get('/orders/my-orders'),
      api.get('/returns/my-requests'),
    ]).then(([ordRes, retRes]) => {
      if (ordRes.status === 'fulfilled' && ordRes.value?.data?.orders) {
        setOrders(ordRes.value.data.orders);
      }
      if (retRes.status === 'fulfilled' && retRes.value?.data?.returns) {
        setReturnsList(retRes.value.data.returns);
      }
      setIsLoadingOrders(false);
    });
  }, []);

  const handleCreateReturn = async (e) => {
    e.preventDefault();
    if (!returnModalOrder) return;
    setSubmittingReturn(true);

    try {
      await api.post('/returns', {
        orderId: returnModalOrder.id,
        reason: returnReason,
        refundMethod: returnMethod,
      });

      setReturnSuccessMsg('Return request submitted! Our concierge will review and schedule reverse pickup within 24 hours.');
      // Refresh returns
      const retRes = await api.get('/returns/my-requests');
      if (retRes?.data?.returns) setReturnsList(retRes.data.returns);

      setTimeout(() => {
        setReturnModalOrder(null);
        setReturnSuccessMsg('');
      }, 2500);
    } catch (err) {
      alert(err.message || 'Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateProfile(profileForm);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="account-page container">
      <div className="account-layout">
        {/* Navigation Sidebar */}
        <aside className="account-sidebar">
          <button
            className={`account-nav-btn ${activeTab === 'orders' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={18} />
            <span>My Orders</span>
          </button>
          <button
            className={`account-nav-btn ${activeTab === 'profile' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>Profile & Security</span>
          </button>
          <button
            className={`account-nav-btn ${activeTab === 'addresses' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <MapPin size={18} />
            <span>Delivery Addresses</span>
          </button>
          <Link to="/wishlist" className="account-nav-btn">
            <Heart size={18} />
            <span>Saved Wishlist</span>
          </Link>
          {(user?.role === 'super_admin' || user?.isAdmin) && (
            <Link to="/admin" className="account-nav-btn admin-link">
              <Shield size={18} />
              <span>Admin Management</span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="account-nav-btn account-logout-btn"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </aside>

        {/* Tab Content Panel */}
        <div className="account-content-panel">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="orders-tab">
              <h2 className="panel-heading">Order History & Shipment Tracking</h2>
              <div className="orders-list">
                {orders.length === 0 ? (
                  <p style={{ color: 'var(--grey-600)', padding: '20px 0' }}>
                    {isLoadingOrders ? 'Loading your heirloom orders...' : 'No orders found in your vault history.'}
                  </p>
                ) : (
                  orders.map((ord) => (
                    <div key={ord.id} className="order-history-card">
                      <div className="order-card-header">
                        <div>
                          <span className="order-num font-mono">{ord.order_number}</span>
                          <span className="order-date">
                            Placed on {new Date(ord.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <span className={`order-status-badge status-${(ord.fulfilment_status || 'placed').toLowerCase()}`}>
                          {ord.fulfilment_status}
                        </span>
                      </div>

                      <div className="order-card-body">
                        <div className="order-details">
                          <h4>Heirloom Jewellery Order</h4>
                          <span>Insured Transit ({ord.carrier || 'Sequel Logistics'}) • Status: {ord.fulfilment_status}</span>
                          <strong className="order-price">{formatPrice(ord.total)}</strong>
                        </div>
                        <div className="order-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <Link to={`/track-order?id=${ord.order_number}`} className="track-order-link">
                            Track Shipment <ChevronRight size={14} />
                          </Link>
                          {(() => {
                            const existingReturn = returnsList.find((r) => r.order_id === ord.id);
                            if (existingReturn) {
                              return (
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  background: '#FFF8E1',
                                  color: '#B78103',
                                  border: '1px solid #FFE082'
                                }}>
                                  Return: {existingReturn.status.toUpperCase()}
                                </span>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => setReturnModalOrder(ord)}
                                style={{
                                  background: 'none',
                                  border: '1px solid var(--color-antique-gold, #c5a059)',
                                  color: 'var(--color-antique-gold, #c5a059)',
                                  padding: '5px 12px',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                }}
                              >
                                Request Return / Exchange
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Return Request Modal (Item #22: return_requests) */}
          {returnModalOrder && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}>
              <div style={{
                background: '#FFF',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem' }}>Request Return / Exchange</h3>
                <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem' }}>
                  Order: <strong>{returnModalOrder.order_number}</strong> • Total: ₹{returnModalOrder.total}
                </p>

                {returnSuccessMsg ? (
                  <div style={{ padding: '14px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', fontSize: '0.9rem' }}>
                    {returnSuccessMsg}
                  </div>
                ) : (
                  <form onSubmit={handleCreateReturn}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                        Reason for Return / Exchange:
                      </label>
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CCC' }}
                      >
                        <option value="Size does not fit">Size does not fit / Too small or large</option>
                        <option value="Damaged in transit">Piece arrived defective or damaged in transit</option>
                        <option value="Style differs from expectation">Style differs from expectation</option>
                        <option value="Exchange for another piece">Exchange for another jewellery piece</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                        Preferred Refund Method:
                      </label>
                      <select
                        value={returnMethod}
                        onChange={(e) => setReturnMethod(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CCC' }}
                      >
                        <option value="original">Original Payment Method (Reversal)</option>
                        <option value="upi">Direct UPI Transfer</option>
                        <option value="store_credit">Jassera Store Credit / Gift Voucher</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <Button variant="outline" size="sm" type="button" onClick={() => setReturnModalOrder(null)}>
                        Cancel
                      </Button>
                      <Button variant="gold" size="sm" type="submit" disabled={submittingReturn}>
                        {submittingReturn ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="profile-tab">
              <h2 className="panel-heading">Personal Information</h2>
              {savedSuccess && (
                <div className="profile-success-msg">Profile updated successfully.</div>
              )}
              <form onSubmit={handleProfileSave} className="profile-form">
                <Input
                  label="Full Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
                <Input
                  label="Mobile Phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
                <Button variant="primary" size="md" type="submit">
                  Save Changes
                </Button>
              </form>
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="addresses-tab">
              <h2 className="panel-heading">Saved Delivery Addresses</h2>
              {addressSavedSuccess && (
                <div className="profile-success-msg">Delivery address saved successfully.</div>
              )}

              {!isEditingAddress ? (
                <div className="saved-address-card default-address">
                  <div className="address-badge">Default Delivery Address</div>
                  <h4>{savedAddress.fullName || user?.name || 'Customer'}</h4>
                  <p>
                    {savedAddress.addressLine1}
                    {savedAddress.addressLine2 ? `, ${savedAddress.addressLine2}` : ''}
                    <br />
                    {savedAddress.landmark ? `Landmark: ${savedAddress.landmark}, ` : ''}
                    {savedAddress.city}, {savedAddress.state} - {savedAddress.pincode}
                    <br />
                    Phone: {savedAddress.phone || user?.phone || 'Not provided'}
                    <br />
                    Email: {savedAddress.email || user?.email || 'Not provided'}
                  </p>
                  <div className="address-actions">
                    <button
                      type="button"
                      className="addr-btn"
                      onClick={() => {
                        setAddressForm(savedAddress);
                        setIsEditingAddress(true);
                      }}
                    >
                      Edit Address
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveAddress} className="profile-form">
                  <Input
                    label="Recipient Name"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  />
                  <div className="form-grid-2">
                    <Input
                      label="Mobile Phone"
                      required
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      value={addressForm.email}
                      onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Flat / House No. / Building / Street"
                    required
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  />
                  <div className="form-grid-2">
                    <Input
                      label="Area / Locality (Optional)"
                      value={addressForm.addressLine2}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    />
                    <Input
                      label="Landmark (Optional)"
                      value={addressForm.landmark}
                      onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    />
                  </div>
                  <div className="form-grid-3">
                    <Input
                      label="City"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    />
                    <Input
                      label="State"
                      required
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    />
                    <Input
                      label="Pincode"
                      required
                      maxLength={6}
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                    <Button variant="primary" size="md" type="submit">
                      Save Address
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      type="button"
                      onClick={() => setIsEditingAddress(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
