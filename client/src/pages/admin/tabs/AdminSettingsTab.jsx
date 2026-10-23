import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminSettingsTab({ onNotify }) {
  const [settings, setSettings] = useState({
    store_name: 'Jassera',
    tagline: 'Jewellery & Accessories',
    announcement_banner_text: 'Free Shipping on orders above ₹499 | Handcrafted with Care by Jassera',
    announcement_banner_link: '/shop',
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

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        if (res?.data?.settings) {
          setSettings((prev) => ({ ...prev, ...res.data.settings }));
        }
      })
      .catch((err) => {
        onNotify?.(err.message || 'Failed to load store settings', 'error');
      })
      .finally(() => setIsLoading(false));
  }, []);

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

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Global Storefront Settings</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Dynamically configure announcement bars, shipping thresholds, customer support channels (<code>store_settings</code> table).
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: '800px' }}>
        {/* Header Announcement */}
        <div style={{ background: '#FFF', padding: '24px', borderRadius: '10px', border: '1px solid #ECECEC', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#D4AF37' }}>Header Announcement Ribbon</h3>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Announcement Banner Text</label>
            <input
              type="text"
              value={settings.announcement_banner_text}
              onChange={(e) => setSettings({ ...settings, announcement_banner_text: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Announcement Target Link</label>
            <input
              type="text"
              value={settings.announcement_banner_link}
              onChange={(e) => setSettings({ ...settings, announcement_banner_link: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
            />
          </div>
        </div>

        {/* Checkout & Pricing Rules */}
        <div style={{ background: '#FFF', padding: '24px', borderRadius: '10px', border: '1px solid #ECECEC', marginBottom: '20px' }}>
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
        <div style={{ background: '#FFF', padding: '24px', borderRadius: '10px', border: '1px solid #ECECEC', marginBottom: '24px' }}>
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
  );
}
