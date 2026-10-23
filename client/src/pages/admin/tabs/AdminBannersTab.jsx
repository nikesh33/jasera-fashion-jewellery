import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Eye, MoveUp, MoveDown, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminBannersTab({ onNotify }) {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    mobile_image_url: '',
    link_url: '/shop',
    display_order: 1,
    position: 'hero',
    status: 'active',
  });

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/banners/admin/all');
      if (res?.data?.banners) {
        setBanners(res.data.banners);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load banners', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setForm({
      title: '',
      subtitle: '',
      image_url: '',
      mobile_image_url: '',
      link_url: '/shop',
      display_order: banners.length + 1,
      position: 'hero',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBanner(b);
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      image_url: b.imageUrl || b.image_url || '',
      mobile_image_url: b.mobileImageUrl || b.mobile_image_url || '',
      link_url: b.linkUrl || b.link_url || '/shop',
      display_order: b.displayOrder ?? b.display_order ?? 1,
      position: b.position || 'hero',
      status: b.status || 'active',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.image_url?.trim()) {
      onNotify?.('Banner image URL is mandatory', 'error');
      return;
    }

    try {
      if (editingBanner) {
        await api.put(`/banners/admin/${editingBanner.id}`, form);
        onNotify?.('Banner updated successfully in database!', 'success');
      } else {
        await api.post('/banners/admin', form);
        onNotify?.('New carousel banner created successfully!', 'success');
      }
      setShowModal(false);
      loadBanners();
    } catch (err) {
      onNotify?.(err.message || 'Failed to save banner', 'error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete banner "${title || 'Untitled'}"?`)) return;
    try {
      await api.delete(`/banners/admin/${id}`);
      onNotify?.('Banner deleted from database', 'success');
      loadBanners();
    } catch (err) {
      onNotify?.(err.message || 'Failed to delete banner', 'error');
    }
  };

  const heroBanners = banners.filter((b) => b.position === 'hero');

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Banner & Carousel Manager</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Configure multi-image hero carousels and promotional ribbons dynamically across the storefront.
          </p>
        </div>
        <Button variant="gold" size="sm" icon={Plus} onClick={handleOpenCreate}>
          Add New Banner
        </Button>
      </div>

      {/* Hero Carousel Preview */}
      {heroBanners.length > 0 && (
        <div style={{ marginBottom: '28px', background: '#121212', borderRadius: '12px', padding: '20px', color: '#FFF' }}>
          <h4 style={{ margin: '0 0 12px', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} /> Live Hero Carousel ({heroBanners.length} Active Slides)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {heroBanners.map((hb, idx) => (
              <div
                key={hb.id}
                style={{
                  position: 'relative',
                  height: '140px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundImage: `url(${hb.imageUrl || hb.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(212,175,55,0.3)',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 600 }}>Slide #{idx + 1} • Order {hb.displayOrder ?? hb.display_order}</span>
                  <strong style={{ fontSize: '0.9rem', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hb.title || 'Untitled Banner'}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Banners Data Table */}
      <div className="table-card" style={{ background: '#FFF', borderRadius: '8px', border: '1px solid #ECECEC', overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #EAEAEA', fontSize: '0.85rem' }}>
              <th style={{ padding: '14px' }}>Image</th>
              <th style={{ padding: '14px' }}>Title & Subtitle</th>
              <th style={{ padding: '14px' }}>Position</th>
              <th style={{ padding: '14px' }}>Order</th>
              <th style={{ padding: '14px' }}>Target Link</th>
              <th style={{ padding: '14px' }}>Status</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                  {isLoading ? 'Loading banners from database...' : 'No banners created yet. Click "Add New Banner" to create your first slide.'}
                </td>
              </tr>
            ) : (
              banners.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #F2F2F2', fontSize: '0.88rem' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <img
                      src={b.imageUrl || b.image_url}
                      alt={b.title || 'Banner'}
                      style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #DDD' }}
                    />
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <strong>{b.title || '—'}</strong>
                    {b.subtitle && <p style={{ margin: '2px 0 0', color: '#777', fontSize: '0.8rem' }}>{b.subtitle}</p>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: b.position === 'hero' ? '#E3F2FD' : '#FFF3E0', color: b.position === 'hero' ? '#1565C0' : '#E65100', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {b.position}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{b.displayOrder ?? b.display_order}</td>
                  <td style={{ padding: '12px 14px', color: '#666' }}>{b.linkUrl || b.link_url}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: b.status === 'active' ? '#E8F5E9' : '#FFEBEE', color: b.status === 'active' ? '#2E7D32' : '#C62828', fontSize: '0.78rem', fontWeight: 600 }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#555', marginRight: '6px' }}
                      title="Edit banner"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id, b.title)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#C62828' }}
                      title="Delete banner"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Banner Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '540px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>
              {editingBanner ? 'Edit Banner' : 'Create New Carousel Banner'}
            </h3>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Banner Headline / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Kundan & Polki Adornments"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Subtitle / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Timeless elegance crafted with uncut gemstone artistry"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Desktop Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... or /images/..."
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Position</label>
                  <select
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  >
                    <option value="hero">Hero Carousel (Top)</option>
                    <option value="promo">Promo Banner</option>
                    <option value="feature">Feature Section</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 1 })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Call To Action Link</label>
                  <input
                    type="text"
                    placeholder="/shop or /shop?category=jhumkas"
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit">
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
