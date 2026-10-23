import React, { useState, useEffect } from 'react';
import { Mail, Download, Search, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminNewsletterTab({ onNotify }) {
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    link.setAttribute('download', `jassera_newsletter_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = subscribers.filter(
    (s) => !search || s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-tab-content">
      <div className="admin-table-card">
        <div className="table-card-header">
          <div>
            <h3>Newsletter Subscribers</h3>
            <p className="table-card-sub">
              Patrons subscribed to boutique drop alerts and promotions (<code>newsletter_subscribers</code> table)
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            disabled={subscribers.length === 0}
          >
            Export CSV ({subscribers.length})
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="admin-filter-bar">
          <div className="admin-search-input-wrap">
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Filter by subscriber email address..."
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
            Showing {filtered.length} of {subscribers.length}
          </span>
        </div>

        {/* Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email Address</th>
                <th>Subscription Status</th>
                <th>Subscribed On</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                    {isLoading ? 'Loading subscribers...' : 'No subscribers recorded yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
                  <tr key={sub.id}>
                    <td className="font-mono text-muted">#{sub.id}</td>
                    <td>
                      <strong style={{ color: 'var(--color-charcoal)' }}>{sub.email}</strong>
                    </td>
                    <td>
                      <span className="stock-pill">Active Subscriber</span>
                    </td>
                    <td className="text-muted">
                      {new Date(sub.subscribed_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
