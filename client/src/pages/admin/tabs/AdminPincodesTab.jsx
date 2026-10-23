import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Truck, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminPincodesTab({ onNotify }) {
  const [pincodes, setPincodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    pincode: '',
    city: '',
    state: '',
    is_serviceable: 1,
    cod_available: 1,
    estimated_delivery_days: 3,
  });

  const loadPincodes = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/pincodes/admin/all');
      if (res?.data?.pincodes) {
        setPincodes(res.data.pincodes);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load pincodes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPincodes();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.pincode || form.pincode.length !== 6) {
      onNotify?.('Valid 6-digit pin code is required', 'error');
      return;
    }

    try {
      await api.post('/pincodes/admin', {
        ...form,
        estimated_days: form.estimated_days || form.estimated_delivery_days || 3,
      });
      onNotify?.(`Pincode ${form.pincode} configured successfully!`, 'success');
      setShowModal(false);
      setForm({
        pincode: '',
        city: '',
        state: '',
        is_serviceable: 1,
        cod_available: 1,
        estimated_days: 3,
        estimated_delivery_days: 3,
      });
      loadPincodes();
    } catch (err) {
      onNotify?.(err.message || 'Failed to save pincode', 'error');
    }
  };

  const handleDelete = async (code) => {
    if (!code) return;
    if (!window.confirm(`Delete pincode ${code} from serviceability database?`)) return;
    try {
      await api.delete(`/pincodes/admin/${code}`);
      onNotify?.(`Pincode ${code} removed`, 'success');
      loadPincodes();
    } catch (err) {
      onNotify?.(err.message || 'Failed to delete pincode', 'error');
    }
  };

  const filtered = pincodes.filter(
    (p) =>
      !search ||
      p.pincode?.includes(search) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.state?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Pincode Serviceability & COD Rules</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Manage regional courier delivery zones and COD limits (<code>pincode_serviceability</code> table).
          </p>
        </div>
        <Button variant="gold" size="sm" icon={Plus} onClick={() => setShowModal(true)}>
          Add Serviceable Pin Code
        </Button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search by 6-digit pin code, city, or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '380px', padding: '9px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.9rem' }}
        />
      </div>

      <div className="table-card" style={{ background: '#FFF', borderRadius: '8px', border: '1px solid #ECECEC', overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #EAEAEA', fontSize: '0.85rem' }}>
              <th style={{ padding: '14px' }}>PIN Code</th>
              <th style={{ padding: '14px' }}>City & State</th>
              <th style={{ padding: '14px' }}>Est. Transit Days</th>
              <th style={{ padding: '14px' }}>COD Available</th>
              <th style={{ padding: '14px' }}>Serviceable Status</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                  {isLoading ? 'Loading pincodes...' : 'No pincodes found.'}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.pincode} style={{ borderBottom: '1px solid #F2F2F2', fontSize: '0.88rem' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#1565C0' }}>
                    {item.pincode}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <strong>{item.city}</strong>, <span style={{ color: '#666' }}>{item.state}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>{item.estimated_days || item.estimated_delivery_days || 3} Days</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: item.cod_available ? '#E8F5E9' : '#FFEBEE', color: item.cod_available ? '#2E7D32' : '#C62828', fontSize: '0.78rem', fontWeight: 600 }}>
                      {item.cod_available ? 'COD ENABLED' : 'PREPAID ONLY'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: item.is_serviceable ? '#E8F5E9' : '#FFF3E0', color: item.is_serviceable ? '#2E7D32' : '#E65100', fontSize: '0.78rem', fontWeight: 600 }}>
                      {item.is_serviceable ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.pincode)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#C62828' }}
                      title="Delete pincode rule"
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

      {/* Add Pincode Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>Configure Serviceable Pincode</h3>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>6-Digit Indian PIN Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 560001"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karnataka"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Est. Delivery Days</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={form.estimated_delivery_days}
                    onChange={(e) => setForm({ ...form, estimated_delivery_days: parseInt(e.target.value, 10) || 3 })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>COD Option</label>
                  <select
                    value={form.cod_available}
                    onChange={(e) => setForm({ ...form, cod_available: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  >
                    <option value={1}>COD Allowed</option>
                    <option value={0}>Prepaid Only</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit">
                  Save Pincode
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
