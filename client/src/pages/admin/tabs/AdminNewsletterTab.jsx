import React, { useState, useEffect } from 'react';
import { Mail, Download, UserCheck, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminNewsletterTab({ onNotify }) {
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscribers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/newsletter/admin/subscribers');
      if (res?.data?.subscribers) {
        setSubscribers(res.data.subscribers);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load newsletter subscribers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const handleExportCSV = () => {
    if (subscribers.length === 0) return;
    const csvContent =
      'data:text/csv;charset=utf-8,ID,Email,SubscribedAt\n' +
      subscribers.map((s) => `${s.id},"${s.email}",${s.subscribed_at}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jasera_newsletter_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Newsletter Subscribers</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Audience members who subscribed to boutique drop notifications (<code>newsletter_subscribers</code> table).
          </p>
        </div>
        <Button variant="gold" size="sm" icon={Download} onClick={handleExportCSV} disabled={subscribers.length === 0}>
          Export CSV ({subscribers.length})
        </Button>
      </div>

      <div className="table-card" style={{ background: '#FFF', borderRadius: '8px', border: '1px solid #ECECEC', overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #EAEAEA', fontSize: '0.85rem' }}>
              <th style={{ padding: '14px' }}>Subscriber ID</th>
              <th style={{ padding: '14px' }}>Email Address</th>
              <th style={{ padding: '14px' }}>Status</th>
              <th style={{ padding: '14px' }}>Subscribed On</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                  {isLoading ? 'Loading subscribers...' : 'No subscribers recorded yet.'}
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid #F2F2F2', fontSize: '0.88rem' }}>
                  <td style={{ padding: '12px 14px', color: '#888' }}>#{sub.id}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <strong style={{ color: '#1F1F1F' }}>{sub.email}</strong>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#E8F5E9', color: '#2E7D32', fontSize: '0.78rem', fontWeight: 600 }}>
                      Active Subscriber
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#888' }}>
                    {new Date(sub.subscribed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
