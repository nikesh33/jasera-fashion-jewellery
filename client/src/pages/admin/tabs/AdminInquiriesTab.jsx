import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, Search, RotateCcw } from 'lucide-react';
import { api } from '../../../lib/api';

export function AdminInquiriesTab({ onNotify }) {
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/contact/admin/all');
      if (res?.data?.submissions) {
        setInquiries(res.data.submissions);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load contact submissions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const filtered = inquiries.filter(
    (inq) =>
      !search ||
      inq.name?.toLowerCase().includes(search.toLowerCase()) ||
      inq.email?.toLowerCase().includes(search.toLowerCase()) ||
      inq.phone?.includes(search) ||
      inq.subject?.toLowerCase().includes(search.toLowerCase()) ||
      inq.message?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-tab-content">
      <div className="admin-table-card">
        <div className="table-card-header">
          <div>
            <h3>Customer Contact Inquiries</h3>
            <p className="table-card-sub">
              Live patron inquiries and appointment requests captured from storefront (<code>contact_submissions</code> table)
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="admin-filter-bar">
          <div className="admin-search-input-wrap">
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by name, email, phone or message content..."
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
            Showing {filtered.length} of {inquiries.length}
          </span>
        </div>

        {/* Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name & Contacts</th>
                <th>Subject / Service</th>
                <th>Message Content</th>
                <th>Submitted On</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                    {isLoading ? 'Loading customer inquiries...' : 'No contact submissions found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((inq) => (
                  <tr key={inq.id}>
                    <td className="font-mono text-muted">#{inq.id}</td>
                    <td>
                      <strong style={{ color: 'var(--color-charcoal)' }}>{inq.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--grey-600)', marginTop: '2px' }}>
                        <a href={`mailto:${inq.email}`} style={{ color: 'var(--color-maroon)', textDecoration: 'none' }}>
                          {inq.email}
                        </a>
                        {inq.phone && <span style={{ marginLeft: '8px' }}>• {inq.phone}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-maroon">{inq.subject || 'General Inquiry'}</span>
                    </td>
                    <td style={{ maxWidth: '380px', color: 'var(--grey-800)', lineHeight: '1.5' }}>
                      {inq.message}
                    </td>
                    <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(inq.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
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
