import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, Eye, Terminal } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminAuditTab({ onNotify }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Administrator Audit Log</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Immutable administrative write operation logs (<code>admin_audit_log</code> table) capturing target IDs, IP addresses, and state deltas.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAuditLogs}>
          Refresh Logs
        </Button>
      </div>

      <div className="table-card" style={{ background: '#FFF', borderRadius: '8px', border: '1px solid #ECECEC', overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #EAEAEA', fontSize: '0.85rem' }}>
              <th style={{ padding: '14px' }}>Log ID</th>
              <th style={{ padding: '14px' }}>Timestamp</th>
              <th style={{ padding: '14px' }}>Admin</th>
              <th style={{ padding: '14px' }}>Action</th>
              <th style={{ padding: '14px' }}>Target</th>
              <th style={{ padding: '14px' }}>IP Address</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Payload</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                  {isLoading ? 'Reading audit trail...' : 'No admin actions recorded yet.'}
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #F2F2F2', fontSize: '0.88rem' }}>
                  <td style={{ padding: '12px 14px', color: '#888' }}>#{l.id}</td>
                  <td style={{ padding: '12px 14px', color: '#555', whiteSpace: 'nowrap' }}>
                    {new Date(l.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <strong>{l.admin_name || `Admin #${l.admin_id}`}</strong>
                    {l.admin_email && <span style={{ display: 'block', fontSize: '0.78rem', color: '#777' }}>{l.admin_email}</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1565C0', background: '#E3F2FD', padding: '3px 8px', borderRadius: '4px' }}>
                      {l.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <strong>{l.target_type}</strong> {l.target_id ? `(#${l.target_id})` : ''}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#666' }}>
                    {l.ip_address || '127.0.0.1'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setInspectLog(l)}
                      style={{
                        background: 'none',
                        border: '1px solid #CCC',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Eye size={13} /> Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Modal */}
      {inspectLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '600px', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem' }}>
              Audit Delta: Log #{inspectLog.id}
            </h3>
            <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem' }}>
              Action: <strong>{inspectLog.action}</strong> • Target: {inspectLog.target_type} #{inspectLog.target_id}
            </p>

            {inspectLog.before_data && (
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#C62828' }}>State Before Action:</span>
                <pre style={{ background: '#F8F8F8', padding: '12px', borderRadius: '6px', fontSize: '0.82rem', overflowX: 'auto', border: '1px solid #EEE' }}>
                  {JSON.stringify(inspectLog.before_data, null, 2)}
                </pre>
              </div>
            )}

            {inspectLog.after_data && (
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2E7D32' }}>State After Action:</span>
                <pre style={{ background: '#F8F8F8', padding: '12px', borderRadius: '6px', fontSize: '0.82rem', overflowX: 'auto', border: '1px solid #EEE' }}>
                  {JSON.stringify(inspectLog.after_data, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="primary" size="sm" onClick={() => setInspectLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
