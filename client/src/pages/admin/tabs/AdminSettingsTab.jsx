import React, { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
  Eye,
  EyeOff,
  BellRing,
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

  const handleToggleStatus = async (item) => {
    try {
      const nextActive = !item.isActive;
      await api.put(`/announcements/admin/${item.id}`, { is_active: nextActive });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, isActive: nextActive, is_active: nextActive } : a))
      );
      onNotify?.(
        `Announcement marked as ${nextActive ? 'LIVE' : 'HIDDEN'} on storefront!`,
        'success'
      );
    } catch (err) {
      onNotify?.(err.message || 'Failed to toggle announcement status', 'error');
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditFormData({
      text: item.text,
      link_text: item.linkText || item.link_text || '',
      link_url: item.linkUrl || item.link_url || '',
    });
  };

  const handleSaveEdit = async (id) => {
    if (!editFormData.text?.trim()) {
      onNotify?.('Announcement text cannot be empty', 'error');
      return;
    }

    setAnnouncementSaving(true);
    try {
      await api.put(`/announcements/admin/${id}`, editFormData);
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                text: editFormData.text,
                linkText: editFormData.link_text,
                link_text: editFormData.link_text,
                linkUrl: editFormData.link_url,
                link_url: editFormData.link_url,
              }
            : a
        )
      );
      setEditingId(null);
      onNotify?.('Announcement updated successfully in database!', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Failed to update announcement', 'error');
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await api.delete(`/announcements/admin/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      onNotify?.('Announcement deleted from database!', 'success');
    } catch (err) {
      onNotify?.(err.message || 'Failed to delete announcement', 'error');
    }
  };

  return (
    <div className="admin-tab-content">
      {/* 1. Announcements Bar Ticker Card */}
      <div className="admin-table-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="table-card-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BellRing size={20} color="var(--color-antique-gold, #D4AF37)" />
              Dynamic Header Announcement Ticker
            </h3>
            <p className="table-card-sub">
              Rotating top header promotional ribbon messages and links shown across desktop and mobile storefront.
            </p>
          </div>
          {!isAddingNew && (
            <Button
              type="button"
              variant="primary"
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
          <form onSubmit={handleCreateAnnouncement} className="admin-inline-form">
            <h4 style={{ margin: '0 0 12px', fontSize: '0.96rem' }}>
              Create New Rotating Announcement
            </h4>
            <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Announcement Message *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Express Shipping on orders above ₹499"
                  value={newAnnouncement.text}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, text: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Link Text (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Shop Collection"
                  value={newAnnouncement.link_text}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, link_text: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Target URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. /shop or /contact"
                  value={newAnnouncement.link_url}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, link_url: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="outline"
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

        {/* Announcements List */}
        <div style={{ padding: 'var(--space-6)' }}>
          {loadingAnnouncements ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
              Loading announcements from database...
            </div>
          ) : announcements.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#888', background: '#FAFAFA', borderRadius: '6px' }}>
              No announcements found. Click "Add Announcement" to create your first top ribbon banner.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.map((item, idx) => {
                const isEditing = editingId === item.id;
                return (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid var(--grey-200, #EBEBEB)',
                      borderRadius: '6px',
                      padding: '14px 18px',
                      background: item.isActive ? '#FFFFFF' : '#FAFAFA',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      opacity: item.isActive ? 1 : 0.7,
                    }}
                  >
                    {isEditing ? (
                      <div>
                        <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          <div className="form-group">
                            <label>Text *</label>
                            <input
                              type="text"
                              value={editFormData.text}
                              onChange={(e) => setEditFormData({ ...editFormData, text: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Link Text</label>
                            <input
                              type="text"
                              value={editFormData.link_text}
                              onChange={(e) => setEditFormData({ ...editFormData, link_text: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Link URL</label>
                            <input
                              type="text"
                              value={editFormData.link_url}
                              onChange={(e) => setEditFormData({ ...editFormData, link_url: e.target.value })}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <Button
                            type="button"
                            variant="outline"
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
                          <span className="badge-count" style={{ flexShrink: 0 }}>
                            #{idx + 1}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-charcoal, #1a1a1a)', wordBreak: 'break-word' }}>
                              {item.text}
                            </div>
                            {(item.linkText || item.linkUrl) && (
                              <div style={{ fontSize: '0.8rem', color: '#777', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: 'var(--color-maroon, #6B1E2C)', fontWeight: 600 }}>
                                  {item.linkText || 'Link'}:
                                </span>
                                <code>{item.linkUrl}</code>
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            className="btn-edit"
                            onClick={() => handleToggleStatus(item)}
                            title={item.isActive ? 'Deactivate (Hide from storefront)' : 'Activate (Show on storefront)'}
                            style={{
                              color: item.isActive ? '#2E7D32' : '#777',
                            }}
                          >
                            {item.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                            <span>{item.isActive ? 'Live' : 'Hidden'}</span>
                          </button>

                          <button
                            type="button"
                            className="btn-edit"
                            onClick={() => handleStartEdit(item)}
                            title="Edit announcement"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => handleDeleteAnnouncement(item.id)}
                            title="Delete announcement"
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
      </div>

      {/* 2. Global Store Settings Card */}
      <form onSubmit={handleSave}>
        <div className="admin-table-card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="table-card-header">
            <div>
              <h3>Shipping & Checkout Economics</h3>
              <p className="table-card-sub">
                Configure minimum order free shipping thresholds, standard flat courier fee, and statutory tax percentages.
              </p>
            </div>
          </div>

          <div style={{ padding: 'var(--space-6)' }}>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label>Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  value={settings.free_shipping_threshold}
                  onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Standard Courier Shipping Fee (₹)</label>
                <input
                  type="number"
                  value={settings.shipping_fee}
                  onChange={(e) => setSettings({ ...settings, shipping_fee: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>GST Statutory Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.tax_rate_percent}
                  onChange={(e) => setSettings({ ...settings, tax_rate_percent: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Concierge & Socials Card */}
        <div className="admin-table-card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="table-card-header">
            <div>
              <h3>Support Channels & Official Social Media</h3>
              <p className="table-card-sub">
                Customer support hotline, concierge email, WhatsApp desk, and Instagram links shown across the storefront.
              </p>
            </div>
          </div>

          <div style={{ padding: 'var(--space-6)' }}>
            <div className="form-grid" style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label>Customer Concierge Email</label>
                <input
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Customer Support Hotline / Phone</label>
                <input
                  type="text"
                  value={settings.support_phone}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Official Instagram URL</label>
              <input
                type="url"
                value={settings.instagram_url}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-8)' }}>
          <Button variant="primary" size="md" icon={Save} type="submit" disabled={saving}>
            {saving ? 'Applying Settings...' : 'Save & Publish Store Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
