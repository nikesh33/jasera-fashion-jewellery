import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, History, CheckCircle, Percent } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminCouponsTab({ onNotify }) {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [usageHistoryModal, setUsageHistoryModal] = useState(null);
  const [usageRecords, setUsageRecords] = useState([]);

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

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await api.delete(`/coupons/admin/${id}`);
      onNotify?.('Coupon deleted from database', 'success');
      loadCoupons();
    } catch (err) {
      onNotify?.(err.message || 'Failed to delete coupon', 'error');
    }
  };

  // View usage history from coupon_usage table (Item #9)
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

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Coupons & Privilege Codes</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Manage discount codes (coupons table) and track customer redemption records (coupon_usage table).
          </p>
        </div>
        <Button variant="gold" size="sm" icon={Plus} onClick={handleOpenCreate}>
          Create Coupon
        </Button>
      </div>

      <div className="table-card" style={{ background: '#FFF', borderRadius: '8px', border: '1px solid #ECECEC', overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #EAEAEA', fontSize: '0.85rem' }}>
              <th style={{ padding: '14px' }}>Coupon Code</th>
              <th style={{ padding: '14px' }}>Type & Value</th>
              <th style={{ padding: '14px' }}>Min Order</th>
              <th style={{ padding: '14px' }}>Max Discount</th>
              <th style={{ padding: '14px' }}>Usage / Cap</th>
              <th style={{ padding: '14px' }}>Status</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                  {isLoading ? 'Loading coupons...' : 'No coupons found. Click "Create Coupon" to add promotional codes.'}
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F2F2F2', fontSize: '0.88rem' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <strong style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#8E2800', background: '#FFF3E0', padding: '3px 8px', borderRadius: '4px' }}>
                      {c.code}
                    </strong>
                    {c.description && <p style={{ margin: '3px 0 0', color: '#777', fontSize: '0.8rem' }}>{c.description}</p>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <strong>{c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} FLAT`}</strong>
                  </td>
                  <td style={{ padding: '12px 14px' }}>₹{c.min_order_amount || 0}</td>
                  <td style={{ padding: '12px 14px' }}>{c.max_discount ? `₹${c.max_discount}` : 'No limit'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontWeight: 600 }}>{c.total_used || 0} used</span>
                    {c.total_usage_cap && <span style={{ color: '#888' }}> / {c.total_usage_cap}</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: c.status === 'active' ? '#E8F5E9' : '#FFEBEE', color: c.status === 'active' ? '#2E7D32' : '#C62828', fontSize: '0.78rem', fontWeight: 600 }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleViewUsage(c)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#1976D2', marginRight: '6px' }}
                      title="View usage history (coupon_usage)"
                    >
                      <History size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#555', marginRight: '6px' }}
                      title="Edit coupon"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id, c.code)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#C62828' }}
                      title="Delete coupon"
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

      {/* Coupon Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h3>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. 20% discount on festive orders"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Discount Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Value ({form.type === 'percentage' ? '%' : '₹'})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Min Order (₹)</label>
                  <input
                    type="number"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={form.max_discount}
                    onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Total Usage Cap</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={form.total_usage_cap}
                    onChange={(e) => setForm({ ...form, total_usage_cap: e.target.value })}
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
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Usage Modal (Item #9: coupon_usage table) */}
      {usageHistoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '640px', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem' }}>
              Redemption History: <span style={{ fontFamily: 'monospace', color: '#D4AF37' }}>{usageHistoryModal.code}</span>
            </h3>
            <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem' }}>
              Verified redemption audit records from the <code>coupon_usage</code> table.
            </p>

            {usageRecords.length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
                No customers have redeemed this coupon yet.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #EEE' }}>
                    <th style={{ padding: '10px' }}>Order #</th>
                    <th style={{ padding: '10px' }}>Customer</th>
                    <th style={{ padding: '10px' }}>Discount Saved</th>
                    <th style={{ padding: '10px' }}>Used On</th>
                  </tr>
                </thead>
                <tbody>
                  {usageRecords.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F2F2F2' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace' }}>{u.order_number || `#${u.order_id}`}</td>
                      <td style={{ padding: '10px' }}>{u.customer_name || u.customer_email || `User #${u.user_id}`}</td>
                      <td style={{ padding: '10px', fontWeight: 600, color: '#2E7D32' }}>₹{u.discount_amount}</td>
                      <td style={{ padding: '10px', color: '#888' }}>{new Date(u.used_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
