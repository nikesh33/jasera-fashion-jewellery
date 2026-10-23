import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, Eye, Search, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminAuditTab({ onNotify }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inspectLog, setInspectLog] = useState(null);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/audit?limit=60');
      if (res?.data) {
        setLogs(res.data);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.target_type?.toLowerCase().includes(search.toLowerCase()) ||
      l.admin_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.admin_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.ip_address?.includes(search)
  );

  return (
    <div className="admin-tab-content">
      <div className="admin-table-card">
        <div className="table-card-header">
          <div>
            <h3>Administrator Audit Log</h3>
            <p className="table-card-sub">
              Immutable administrative operation trail (<code>admin_audit_log</code> table)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadAuditLogs}>
            Refresh Logs
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="admin-filter-bar">
          <div className="admin-search-input-wrap">
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Filter by admin, action, target or IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <button
              type="button"
              className="admin-filter-reset"
              onClick={() => setSearch('')}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
          <span className="admin-filter-count">
            Showing {filtered.length} of {logs.length}
          </span>
        </div>

        {/* Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Admin Patron</th>
                <th>Action</th>
                <th>Target Resource</th>
                <th>IP Address</th>
                <th style={{ textAlign: 'right' }}>Payload</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                    {isLoading ? 'Reading audit trail...' : 'No admin actions recorded yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id}>
                    <td className="font-mono text-muted">#{l.id}</td>
                    <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(l.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-charcoal)' }}>{l.admin_name || `Admin #${l.admin_id}`}</strong>
                      {l.admin_email && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--grey-500)' }}>{l.admin_email}</div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'var(--color-maroon)',
                          background: 'var(--grey-100)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                        }}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td>
                      <strong>{l.target_type}</strong> {l.target_id ? `(#${l.target_id})` : ''}
                    </td>
                    <td className="font-mono text-muted" style={{ fontSize: '0.82rem' }}>
                      {l.ip_address || '127.0.0.1'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => setInspectLog(l)}
                        title="View payload json"
                      >
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Log Modal */}
      {inspectLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectLog(null);
          }}
        >
          <div
            style={{
              background: '#FFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '600px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--color-maroon)' }}>
                Audit Log #{inspectLog.id} • {inspectLog.action}
              </h3>
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: '#555' }}>
              <strong>Target:</strong> {inspectLog.target_type} #{inspectLog.target_id} | <strong>IP:</strong> {inspectLog.ip_address}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#333' }}>State Payload (JSON):</span>
              <pre
                style={{
                  background: '#1F2421',
                  color: '#A7E8BD',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  overflowX: 'auto',
                  maxHeight: '320px',
                  marginTop: '6px',
                }}
              >
                {JSON.stringify(inspectLog.after_data || inspectLog.before_data || inspectLog, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setInspectLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
