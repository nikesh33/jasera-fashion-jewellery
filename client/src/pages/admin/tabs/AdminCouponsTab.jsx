import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, History, Search, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminCouponsTab({ onNotify }) {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [usageHistoryModal, setUsageHistoryModal] = useState(null);
  const [usageRecords, setUsageRecords] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: 10,
    min_order_amount: 499,
    max_discount: 500,
    total_usage_cap: 100,
    status: 'active',
  });

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/coupons/admin/all');
      if (res?.data?.coupons) {
        setCoupons(res.data.coupons);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load coupons', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setForm({
      code: '',
      description: '',
      type: 'percentage',
      value: 10,
      min_order_amount: 499,
      max_discount: 500,
      total_usage_cap: 100,
      status: 'active',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCoupon(c);
    setForm({
      code: c.code,
      description: c.description || '',
      type: c.type || 'percentage',
      value: Number(c.value) || 0,
      min_order_amount: Number(c.min_order_amount) || 0,
      max_discount: c.max_discount ? Number(c.max_discount) : '',
      total_usage_cap: c.total_usage_cap ? Number(c.total_usage_cap) : '',
      status: c.status || 'active',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      onNotify?.('Coupon code is required', 'error');
      return;
    }

    try {
      if (editingCoupon) {
        await api.put(`/coupons/admin/${editingCoupon.id}`, form);
        onNotify?.('Coupon updated successfully!', 'success');
      } else {
        await api.post('/coupons/admin', form);
        onNotify?.('New coupon created in database!', 'success');
      }
      setShowModal(false);
      loadCoupons();
    } catch (err) {
      onNotify?.(err.message || 'Failed to save coupon', 'error');
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/coupons/admin/${deleteConfirm.id}`);
      onNotify?.(`Coupon "${deleteConfirm.code}" deleted successfully`, 'success');
      setDeleteConfirm(null);
      loadCoupons();
    } catch (err) {
      onNotify?.(err.message || 'Failed to delete coupon', 'error');
    }
  };

  const handleViewUsage = async (coupon) => {
    setUsageHistoryModal(coupon);
    try {
      const res = await api.get(`/coupons/admin/${coupon.id}/usage`);
      if (res?.data?.usage) {
        setUsageRecords(res.data.usage);
      } else {
        setUsageRecords([]);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load coupon usage records', 'error');
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.code?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' ||
      (c.status || 'active') === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-tab-content">
      <div className="admin-table-card">
        <div className="table-card-header">
          <div>
            <h3>Coupons & Privilege Codes</h3>
            <p className="table-card-sub">
              Manage promotional discount codes and track customer redemptions from the coupon registry.
            </p>
          </div>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate}>
            Create Coupon
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="admin-filter-bar">
          <div className="admin-search-input-wrap">
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by coupon code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              className="admin-filter-reset"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}

          <span className="admin-filter-count">
            Showing {filteredCoupons.length} of {coupons.length}
          </span>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Type & Value</th>
                <th>Min Order</th>
                <th>Max Discount</th>
                <th>Usage / Cap</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                    {isLoading ? 'Loading coupons...' : 'No coupons match your filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="badge-count" style={{ background: '#FFF3E0', color: '#8E2800', fontFamily: 'monospace', fontSize: '0.88rem', letterSpacing: '0.05em', padding: '4px 8px' }}>
                        {c.code}
                      </span>
                      {c.description && <p style={{ margin: '4px 0 0', color: '#777', fontSize: '0.8rem' }}>{c.description}</p>}
                    </td>
                    <td>
                      <strong>{c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} FLAT`}</strong>
                    </td>
                    <td>₹{c.min_order_amount || 0}</td>
                    <td>{c.max_discount ? `₹${c.max_discount}` : 'No limit'}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{c.total_used || 0} used</span>
                      {c.total_usage_cap && <span style={{ color: '#888' }}> / {c.total_usage_cap}</span>}
                    </td>
                    <td>
                      <span
                        className="stock-pill"
                        style={{
                          background: c.status === 'active' ? '#E8F5E9' : '#FFEBEE',
                          color: c.status === 'active' ? '#2E7D32' : '#C62828',
                        }}
                      >
                        {c.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="actions-cell" style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleViewUsage(c)}
                        title="View usage history"
                      >
                        <History size={14} /> Usage
                      </button>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit coupon"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => setDeleteConfirm(c)}
                        title="Delete coupon"
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

      {/* Coupon Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '10px', width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontFamily: 'var(--font-heading, serif)', color: 'var(--color-charcoal, #1a1a1a)' }}>
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h3>

            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.05em' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Description</label>
                <input
                  type="text"
                  placeholder="e.g. 20% discount on festive orders"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-grid" style={{ marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Discount Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Value ({form.type === 'percentage' ? '%' : '₹'})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Min Order (₹)</label>
                  <input
                    type="number"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={form.max_discount}
                    onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Total Usage Cap</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={form.total_usage_cap}
                    onChange={(e) => setForm({ ...form, total_usage_cap: e.target.value })}
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
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
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
            <h3 style={{ margin: '0 0 10px', fontSize: '1.15rem', color: '#C62828' }}>Delete Coupon?</h3>
            <p style={{ margin: '0 0 20px', color: '#666', fontSize: '0.88rem' }}>
              Are you sure you want to delete coupon <strong style={{ fontFamily: 'monospace' }}>{deleteConfirm.code}</strong>? This action cannot be undone.
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

      {/* Coupon Usage Modal */}
      {usageHistoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '10px', width: '100%', maxWidth: '640px', padding: '24px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontFamily: 'var(--font-heading, serif)' }}>
              Redemption History: <span style={{ fontFamily: 'monospace', color: 'var(--color-maroon, #6B1E2C)' }}>{usageHistoryModal.code}</span>
            </h3>
            <p className="table-card-sub" style={{ marginBottom: '16px' }}>
              Verified customer redemption audit records for this coupon.
            </p>

            {usageRecords.length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>
                No customers have redeemed this coupon yet.
              </p>
            ) : (
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Discount Saved</th>
                      <th>Used On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageRecords.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{u.order_number || `#${u.order_id}`}</td>
                        <td>{u.customer_name || u.customer_email || `User #${u.user_id}`}</td>
                        <td style={{ fontWeight: 600, color: '#2E7D32' }}>₹{u.discount_amount}</td>
                        <td style={{ color: '#888' }}>{new Date(u.used_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="primary" size="sm" onClick={() => setUsageHistoryModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
