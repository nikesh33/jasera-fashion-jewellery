import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, MapPin, Heart, Shield, LogOut, ChevronRight, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import './AccountPage.css';

export function AccountPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile' | 'addresses'

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('suvarna_token')) {
      navigate('/login?redirect=/account', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressSavedSuccess, setAddressSavedSuccess] = useState(false);
  const [addressError, setAddressError] = useState(null);

  const initialAddressForm = {
    fullName: user?.name || user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    pincode: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    addressType: 'home',
    isDefault: false,
  };
  const [addressForm, setAddressForm] = useState(initialAddressForm);

  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const res = await api.get('/addresses');
      if (res?.data?.addresses) {
        setAddresses(res.data.addresses);
      }
    } catch (err) {
      console.error('Failed to load delivery addresses from DB:', err);
      if (err.status === 401) {
        logout();
        navigate('/login?redirect=/account', { replace: true });
      }
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated || localStorage.getItem('suvarna_token')) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleStartAddAddress = () => {
    setEditingAddressId(null);
    setAddressError(null);
    setAddressForm({
      fullName: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      pincode: '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      addressType: 'home',
      isDefault: addresses.length === 0,
    });
    setIsEditingAddress(true);
  };

  const handleStartEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressError(null);
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      email: user?.email || '',
      pincode: addr.pincode,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      addressType: addr.addressType || 'home',
      isDefault: Boolean(addr.isDefault),
    });
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressError(null);
    try {
      if (editingAddressId) {
        await api.put(`/addresses/${editingAddressId}`, addressForm);
      } else {
        await api.post('/addresses', addressForm);
      }
      await fetchAddresses();
      setIsEditingAddress(false);
      setEditingAddressId(null);
      setAddressSavedSuccess(true);
      setTimeout(() => setAddressSavedSuccess(false), 3500);
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/login?redirect=/account', { replace: true });
        return;
      }
      setAddressError(err.message || 'Failed to save address to database');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved delivery address?')) {
      return;
    }
    try {
      await api.delete(`/addresses/${id}`);
      await fetchAddresses();
    } catch (err) {
      alert(err.message || 'Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      await fetchAddresses();
    } catch (err) {
      alert(err.message || 'Failed to set default address');
    }
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 className="panel-heading" style={{ margin: 0 }}>Saved Delivery Addresses</h2>
                {!isEditingAddress && (
                  <Button variant="primary" size="sm" icon={Plus} onClick={handleStartAddAddress}>
                    Add New Address
                  </Button>
                )}
              </div>

              {addressSavedSuccess && (
                <div className="profile-success-msg">Delivery address saved successfully to database.</div>
              )}
              {addressError && (
                <div style={{ backgroundColor: '#FCEAE9', color: '#B3261E', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  {addressError}
                </div>
              )}

              {isEditingAddress ? (
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--grey-300)', borderRadius: 'var(--radius-sm)', padding: '24px', maxWidth: '520px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: 'var(--color-maroon)' }}>
                    {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                  </h3>
                  <form onSubmit={handleSaveAddress} className="profile-form" style={{ maxWidth: '100%' }}>
                    <Input
                      label="Recipient Full Name"
                      required
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      placeholder="e.g. Aditi Sharma"
                    />
                    <div className="form-grid-2">
                      <Input
                        label="Mobile Phone Number"
                        required
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        placeholder="10-digit mobile"
                      />
                      <Input
                        label="Pincode"
                        required
                        maxLength={6}
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        placeholder="6-digit pincode"
                      />
                    </div>
                    <Input
                      label="Flat, House no., Building, Apartment, Street"
                      required
                      value={addressForm.addressLine1}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                      placeholder="e.g. Flat 302, Lotus Tower, M.G. Road"
                    />
                    <div className="form-grid-2">
                      <Input
                        label="Area, Locality (Optional)"
                        value={addressForm.addressLine2}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                        placeholder="e.g. Bandra West"
                      />
                      <Input
                        label="Landmark (Optional)"
                        value={addressForm.landmark}
                        onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                        placeholder="e.g. Near National College"
                      />
                    </div>
                    <div className="form-grid-2">
                      <Input
                        label="Town / City"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="e.g. Mumbai"
                      />
                      <Input
                        label="State"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        placeholder="e.g. Maharashtra"
                      />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--grey-800)', marginTop: '4px' }}>
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      />
                      <span>Set as default delivery address</span>
                    </label>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                      <Button variant="primary" size="md" type="submit">
                        Save Address to Database
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        type="button"
                        onClick={() => {
                          setIsEditingAddress(false);
                          setEditingAddressId(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              ) : isLoadingAddresses ? (
                <div style={{ padding: '30px 0', color: 'var(--grey-600)', fontSize: '0.9rem' }}>
                  Loading saved addresses from database...
                </div>
              ) : addresses.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', border: '1.5px dashed var(--grey-300)', borderRadius: 'var(--radius-sm)', maxWidth: '440px', backgroundColor: '#FAFAFA' }}>
                  <MapPin size={32} style={{ color: 'var(--color-antique-gold-dark)', margin: '0 auto 10px', display: 'block' }} />
                  <h4 style={{ margin: '0 0 6px', fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>No Saved Addresses</h4>
                  <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: 'var(--grey-600)' }}>
                    Save your delivery address for fast 1-click checkout on your next jewellery order.
                  </p>
                  <Button variant="primary" size="sm" icon={Plus} onClick={handleStartAddAddress}>
                    Add Delivery Address
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`saved-address-card ${addr.isDefault ? 'default-address' : ''}`}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: addr.isDefault ? '1.5px solid var(--color-antique-gold, #dfb972)' : '1px solid var(--grey-300)',
                        boxShadow: addr.isDefault ? '0 2px 10px rgba(223, 185, 114, 0.15)' : 'none',
                        maxWidth: '100%',
                      }}
                    >
                      {addr.isDefault && (
                        <div className="address-badge" style={{ backgroundColor: 'var(--color-antique-gold, #dfb972)', color: '#FFFFFF' }}>
                          Default Delivery Address
                        </div>
                      )}
                      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--color-charcoal)' }}>{addr.fullName}</h4>
                      <p style={{ margin: '0 0 12px', fontSize: '0.86rem', color: 'var(--grey-700)', lineHeight: '1.5' }}>
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        <br />
                        {addr.landmark ? `Landmark: ${addr.landmark}, ` : ''}
                        {addr.city}, {addr.state} - {addr.pincode}
                        <br />
                        Phone: {addr.phone}
                      </p>
                      <div className="address-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <button
                          type="button"
                          className="addr-btn"
                          onClick={() => handleStartEditAddress(addr)}
                          style={{ color: 'var(--color-maroon)', fontWeight: 600 }}
                        >
                          Edit
                        </button>
                        {!addr.isDefault && (
                          <button
                            type="button"
                            className="addr-btn"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            style={{ color: 'var(--color-antique-gold-dark, #8c6d2d)' }}
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          type="button"
                          className="addr-btn text-error"
                          onClick={() => handleDeleteAddress(addr.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
