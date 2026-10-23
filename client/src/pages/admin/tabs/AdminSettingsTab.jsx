import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Shield,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  BellRing,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminSettingsTab({ onNotify }) {
  const [settings, setSettings] = useState({
    store_name: 'Jassera',
    tagline: 'Jewellery & Accessories',
    support_email: 'support@jassera.in',
    support_phone: '+91 98200 12345',
    whatsapp_number: '+91 98200 12345',
    free_shipping_threshold: '499',
    shipping_fee: '50',
    tax_rate_percent: '3',
    cod_enabled: 'true',
    instagram_url: 'https://instagram.com/jassera.jewels',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dynamic Announcements from Database
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newAnnouncement, setNewAnnouncement] = useState({
    text: '',
    link_text: '',
    link_url: '/shop',
    is_active: true,
  });
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  // Load Settings and Announcements on mount
  useEffect(() => {
    loadSettings();
    loadAnnouncements();
  }, []);

  const loadSettings = () => {
    setIsLoading(true);
    api
      .get('/settings')
      .then((res) => {
        const s = res?.settings || res?.data?.settings;
        if (s) {
          setSettings((prev) => ({ ...prev, ...s }));
        }
      })
      .catch((err) => {
        onNotify?.(err.message || 'Failed to load store settings', 'error');
      })
      .finally(() => setIsLoading(false));
  };

  const loadAnnouncements = () => {
    setLoadingAnnouncements(true);
    api
      .get('/announcements/admin')
      .then((res) => {
        const list = res?.announcements || res?.data?.announcements;
        if (list) {
          setAnnouncements(list);
        }
      })
      .catch((err) => {
        console.warn('Failed to load announcements for admin:', err);
      })
      .finally(() => setLoadingAnnouncements(false));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/admin', { settings });
      onNotify?.('Store settings updated and applied across entire storefront!', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Failed to save store settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Create Announcement in DB
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.text.trim()) {
      onNotify?.('Announcement text is required', 'error');
      return;
    }

    setAnnouncementSaving(true);
    try {
      const res = await api.post('/announcements/admin', newAnnouncement);
      const created = res?.announcement || res?.data?.announcement;
      if (created) {
        setAnnouncements((prev) => [...prev, created]);
      } else {
        loadAnnouncements();
      }
      setNewAnnouncement({
        text: '',
        link_text: '',
        link_url: '/shop',
        is_active: true,
      });
      setIsAddingNew(false);
      onNotify?.('New announcement published to database successfully!', 'success');
    } catch (err) {
      onNotify?.(err.response?.data?.message || err.message || 'Failed to create announcement', 'error');
    } finally {
      setAnnouncementSaving(false);
    }
  };

  // Toggle Announcement Active/Inactive
  const handleToggleStatus = async (item) => {
    try {
      const nextActive = !item.isActive;
      await api.put(`/announcements/admin/${item.id}`, { is_active: nextActive });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, isActive: nextActive, is_active: nextActive } : a))
      );
      onNotify?.(
        `Announcement ${nextActive ? 'activated' : 'deactivated'} in database!`,
        'success'
      );
    } catch (err) {
      onNotify?.(err.message || 'Failed to update announcement status', 'error');
    }
  };

  // Start editing announcement
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditFormData({
      text: item.text,
      link_text: item.linkText || item.link_text || '',
      link_url: item.linkUrl || item.link_url || '',
      display_order: item.displayOrder ?? item.display_order ?? 0,
    });
  };

  // Save edited announcement
  const handleSaveEdit = async (id) => {
    if (!editFormData.text?.trim()) {
      onNotify?.('Announcement text cannot be empty', 'error');
      return;
    }
    setAnnouncementSaving(true);
    try {
      const res = await api.put(`/announcements/admin/${id}`, editFormData);
      const updated = res?.announcement || res?.data?.announcement;
      if (updated) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? updated : a))
        );
      } else {
        loadAnnouncements();
      }
      setEditingId(null);
      onNotify?.('Announcement updated successfully in database!', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Failed to update announcement', 'error');
    } finally {
      setAnnouncementSaving(false);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement from the database?')) {
      return;
    }
    try {
      await api.delete(`/announcements/admin/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      onNotify?.('Announcement deleted from database!', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Failed to delete announcement', 'error');
    }
  };

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Global Storefront Settings & Announcements</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Dynamically configure database announcements, shipping economics, and customer support channels without modifying code.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '920px' }}>
        {/* 1. Dynamic Database Announcements Ribbon */}
        <div style={{ background: '#FFF', padding: '24px', borderRadius: '10px', border: '1px solid #ECECEC', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-maroon, #6B1E2C)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BellRing size={20} color="#D4AF37" />
                Dynamic Announcement Bar Ticker (Database Managed)
              </h3>
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.84rem' }}>
                These rotating promotional messages and links appear in the top header ribbon on both desktop and responsive mobile views.
              </p>
            </div>
            {!isAddingNew && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setIsAddingNew(true)}
              >
                Add Announcement
              </Button>
            )}
          </div>

          {/* New Announcement Form */}
          {isAddingNew && (
            <form onSubmit={handleCreateAnnouncement} style={{ background: '#FAF7F2', border: '1px solid #E8DFD0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px', color: '#6B1E2C' }}>
                Add New Rotating Announcement
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Announcement Message *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Free Express Shipping on orders above ₹499"
                    value={newAnnouncement.text}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, text: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Link Text (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Collection"
                    value={newAnnouncement.link_text}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, link_text: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>Target URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. /shop or /contact"
                    value={newAnnouncement.link_url}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, link_url: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingNew(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={Save}
                  disabled={announcementSaving}
                >
                  {announcementSaving ? 'Saving...' : 'Save to Database'}
                </Button>
              </div>
            </form>
          )}

          {/* Announcements List Table */}
          {loadingAnnouncements ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '0.88rem' }}>
              Loading announcements from database...
            </div>
          ) : announcements.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: '#F9F9F9', borderRadius: '8px', color: '#666' }}>
              No announcements found in database. Click "Add Announcement" to create one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.map((item, idx) => {
                const isEditing = editingId === item.id;
                return (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #EBEBEB',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      background: item.isActive ? '#FFFFFF' : '#F9F9F9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      opacity: item.isActive ? 1 : 0.65,
                    }}
                  >
                    {isEditing ? (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '3px' }}>Text *</label>
                            <input
                              type="text"
                              value={editFormData.text}
                              onChange={(e) => setEditFormData({ ...editFormData, text: e.target.value })}
                              style={{ width: '100%', padding: '7px 9px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '3px' }}>Link Text</label>
                            <input
                              type="text"
                              value={editFormData.link_text}
                              onChange={(e) => setEditFormData({ ...editFormData, link_text: e.target.value })}
                              style={{ width: '100%', padding: '7px 9px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '3px' }}>Link URL</label>
                            <input
                              type="text"
                              value={editFormData.link_url}
                              onChange={(e) => setEditFormData({ ...editFormData, link_url: e.target.value })}
                              style={{ width: '100%', padding: '7px 9px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon={Check}
                            onClick={() => handleSaveEdit(item.id)}
                            disabled={announcementSaving}
                          >
                            {announcementSaving ? 'Saving...' : 'Update'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              background: '#F0EFEA',
                              color: '#666',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              flexShrink: 0,
                            }}
                          >
                            #{idx + 1}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#222', wordBreak: 'break-word' }}>
                              {item.text}
                            </div>
                            {(item.linkText || item.linkUrl) && (
                              <div style={{ fontSize: '0.78rem', color: '#777', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: 'var(--color-maroon, #6B1E2C)', fontWeight: 600 }}>
                                  {item.linkText || 'Link'}:
                                </span>
                                <code>{item.linkUrl}</code>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            title={item.isActive ? 'Deactivate (Hide from storefront)' : 'Activate (Show on storefront)'}
                            style={{
                              background: item.isActive ? 'rgba(46, 125, 91, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                              color: item.isActive ? '#2E7D5B' : '#777',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {item.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                            <span>{item.isActive ? 'Live' : 'Hidden'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            title="Edit announcement"
                            style={{
                              background: 'transparent',
                              border: '1px solid #DDD',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              cursor: 'pointer',
                              color: '#555',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(item.id)}
                            title="Delete announcement"
                            style={{
                              background: 'transparent',
                              border: '1px solid #FFD0D0',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              cursor: 'pointer',
                              color: '#C92A2A',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Global Settings Form (Economics & Support Channels) */}
        <form onSubmit={handleSave}>
          {/* Checkout & Pricing Rules */}
          <div style={{ background: '#FFF', padding: '24px', borderRadius: '10px', border: '1px solid #ECECEC', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#D4AF37' }}>Shipping & Checkout Economics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  value={settings.free_shipping_threshold}
                  onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Standard Shipping Fee (₹)</label>
                <input
                  type="number"
                  value={settings.shipping_fee}
                  onChange={(e) => setSettings({ ...settings, shipping_fee: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>GST Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.tax_rate_percent}
                  onChange={(e) => setSettings({ ...settings, tax_rate_percent: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>
            </div>
          </div>

          {/* Customer Concierge & Socials */}
          <div style={{ background: '#FFF', padding: '24px', borderRadius: '10px', border: '1px solid #ECECEC', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#D4AF37' }}>Support Channels & Social Media</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Customer Support Email</label>
                <input
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Customer Support Phone</label>
                <input
                  type="text"
                  value={settings.support_phone}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Official Instagram URL</label>
              <input
                type="url"
                value={settings.instagram_url}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="gold" size="lg" icon={Save} type="submit" disabled={saving}>
              {saving ? 'Applying Settings...' : 'Save & Publish Store Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
