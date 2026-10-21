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
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    api.get('/orders/my-orders')
      .then((res) => {
        if (res?.data?.orders) {
          setOrders(res.data.orders);
        }
      })
      .catch((err) => {
        console.error('Failed to load user orders:', err);
      })
      .finally(() => {
        setIsLoadingOrders(false);
      });
  }, []);

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
                        <div className="order-actions">
                          <Link to={`/track-order?id=${ord.order_number}`} className="track-order-link">
                            Track Shipment <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
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
