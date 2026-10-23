import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminBannersTab({ onNotify }) {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/banners/admin/${deleteConfirm.id}`);
      onNotify?.(`Banner "${deleteConfirm.title || 'Untitled'}" deleted successfully`, 'success');
      setDeleteConfirm(null);
      loadBanners();
    } catch (err) {
      onNotify?.(err.message || 'Failed to delete banner', 'error');
    }
  };

  const heroBanners = banners.filter((b) => b.position === 'hero' && b.status === 'active');

  const filteredBanners = banners.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      b.title?.toLowerCase().includes(q) ||
      b.subtitle?.toLowerCase().includes(q) ||
      (b.linkUrl || b.link_url)?.toLowerCase().includes(q);
    const matchPos =
      positionFilter === 'all' ||
      b.position === positionFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (b.status || 'active') === statusFilter;
    return matchSearch && matchPos && matchStatus;
  });

  return (
    <div className="admin-tab-content">
      {/* Hero Carousel Live Preview Strip */}
      {heroBanners.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)', background: '#121212', borderRadius: 'var(--radius-sm, 8px)', padding: '20px', color: '#FFF' }}>
          <h4 style={{ margin: '0 0 14px', color: 'var(--color-antique-gold, #D4AF37)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
            <Eye size={17} /> Live Hero Carousel ({heroBanners.length} Active Slides)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {heroBanners.map((hb, idx) => (
              <div
                key={hb.id}
                style={{
                  position: 'relative',
                  height: '130px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundImage: `url(${hb.imageUrl || hb.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(212,175,55,0.3)',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.74rem', color: '#D4AF37', fontWeight: 600 }}>
                    Slide #{idx + 1} • Order {hb.displayOrder ?? hb.display_order}
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {hb.title || 'Untitled Banner'}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-table-card">
        <div className="table-card-header">
          <div>
            <h3>Banner & Carousel Manager</h3>
            <p className="table-card-sub">
              Manage multi-slide hero carousels and promotional marketing ribbons across the storefront.
            </p>
          </div>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate}>
            Add New Banner
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="admin-filter-bar">
          <div className="admin-search-input-wrap">
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by title, subtitle, or link URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="admin-filter-select"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="all">All Placements</option>
            <option value="hero">Hero Carousel (Top)</option>
            <option value="promo">Promo Banner</option>
            <option value="feature">Feature Section</option>
          </select>

          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {(searchQuery || positionFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              className="admin-filter-reset"
              onClick={() => {
                setSearchQuery('');
                setPositionFilter('all');
                setStatusFilter('all');
              }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}

          <span className="admin-filter-count">
            Showing {filteredBanners.length} of {banners.length}
          </span>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title & Subtitle</th>
                <th>Position</th>
                <th>Order</th>
                <th>Target Link</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanners.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                    {isLoading ? 'Loading banners...' : 'No banners match your filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredBanners.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <img
                        src={b.imageUrl || b.image_url}
                        alt={b.title || 'Banner'}
                        style={{ width: '84px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--grey-300, #ddd)' }}
                      />
                    </td>
                    <td>
                      <strong>{b.title || '—'}</strong>
                      {b.subtitle && <p style={{ margin: '3px 0 0', color: '#777', fontSize: '0.8rem' }}>{b.subtitle}</p>}
                    </td>
                    <td>
                      <span
                        className="badge-count"
                        style={{
                          background: b.position === 'hero' ? '#E3F2FD' : '#FFF3E0',
                          color: b.position === 'hero' ? '#1565C0' : '#E65100',
                          textTransform: 'uppercase',
                        }}
                      >
                        {b.position}
                      </span>
                    </td>
                    <td>
                      <strong>{b.displayOrder ?? b.display_order}</strong>
                    </td>
                    <td style={{ color: 'var(--grey-600, #666)', fontSize: '0.84rem' }}>
                      {b.linkUrl || b.link_url}
                    </td>
                    <td>
                      <span
                        className="stock-pill"
                        style={{
                          background: b.status === 'active' ? '#E8F5E9' : '#FFEBEE',
                          color: b.status === 'active' ? '#2E7D32' : '#C62828',
                        }}
                      >
                        {b.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="actions-cell" style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleOpenEdit(b)}
                        title="Edit banner"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => setDeleteConfirm(b)}
                        title="Delete banner"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Banner Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '10px', width: '100%', maxWidth: '540px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontFamily: 'var(--font-heading, serif)' }}>
              {editingBanner ? 'Edit Banner' : 'Create New Carousel Banner'}
            </h3>

            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Banner Headline / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Kundan & Polki Adornments"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Subtitle / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Timeless elegance crafted with uncut gemstone artistry"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Desktop Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... or /images/..."
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                />
              </div>

              <div className="form-grid" style={{ marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Position</label>
                  <select
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                  >
                    <option value="hero">Hero Carousel (Top)</option>
                    <option value="promo">Promo Banner</option>
                    <option value="feature">Feature Section</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Target Call To Action Link</label>
                  <input
                    type="text"
                    placeholder="/shop or /shop?category=jhumkas"
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingBanner ? 'Update Banner' : 'Create Banner'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '10px', width: '100%', maxWidth: '420px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.15rem', color: '#C62828' }}>Delete Banner?</h3>
            <p style={{ margin: '0 0 20px', color: '#666', fontSize: '0.88rem' }}>
              Are you sure you want to delete banner <strong>"{deleteConfirm.title || 'Untitled'}"</strong>?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={executeDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
