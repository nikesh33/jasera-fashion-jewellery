import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, User, CheckCircle } from 'lucide-react';
import { api } from '../../../lib/api';

export function AdminInquiriesTab({ onNotify }) {
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Customer Contact Inquiries</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Live patron inquiries and appointment requests captured from the storefront (<code>contact_submissions</code> table).
          </p>
        </div>
      </div>

      <div className="table-card" style={{ background: '#FFF', borderRadius: '8px', border: '1px solid #ECECEC', overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #EAEAEA', fontSize: '0.85rem' }}>
              <th style={{ padding: '14px' }}>ID</th>
              <th style={{ padding: '14px' }}>Name & Contacts</th>
              <th style={{ padding: '14px' }}>Subject</th>
              <th style={{ padding: '14px' }}>Message Content</th>
              <th style={{ padding: '14px' }}>Submitted On</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                  {isLoading ? 'Loading customer inquiries...' : 'No contact submissions yet.'}
                </td>
              </tr>
            ) : (
              inquiries.map((inq) => (
                <tr key={inq.id} style={{ borderBottom: '1px solid #F2F2F2', fontSize: '0.88rem' }}>
                  <td style={{ padding: '12px 14px', color: '#888' }}>#{inq.id}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <strong>{inq.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                      <a href={`mailto:${inq.email}`} style={{ color: '#1565C0', textDecoration: 'none' }}>{inq.email}</a>
                      {inq.phone && <span style={{ marginLeft: '8px' }}>• {inq.phone}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontWeight: 600, color: '#333' }}>{inq.subject || 'General Inquiry'}</span>
                  </td>
                  <td style={{ padding: '12px 14px', maxWidth: '380px', color: '#444' }}>
                    {inq.message}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#888', whiteSpace: 'nowrap' }}>
                    {new Date(inq.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
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
