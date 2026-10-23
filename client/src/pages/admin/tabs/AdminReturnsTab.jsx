import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, CheckCircle, Clock, Truck, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminReturnsTab({ onNotify }) {
  const [returnRequests, setReturnRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState('approved');
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadReturns = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/returns/admin/all');
      if (res?.data?.returns) {
        setReturnRequests(res.data.returns);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load return requests', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setUpdating(true);

    try {
      await api.patch(`/returns/admin/${selectedRequest.id}/status`, {
        status: newStatus,
        adminNote: adminNote.trim(),
      });
      onNotify?.(`Return request #${selectedRequest.id} marked as ${newStatus.toUpperCase()}`, 'success');
      setSelectedRequest(null);
      setAdminNote('');
      loadReturns();
    } catch (err) {
      onNotify?.(err.message || 'Failed to update return request', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filteredRequests = returnRequests.filter((req) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      req.order_number?.toLowerCase().includes(q) ||
      req.customer_name?.toLowerCase().includes(q) ||
      req.customer_email?.toLowerCase().includes(q) ||
      req.customer_phone?.toLowerCase().includes(q) ||
      req.reason?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' ||
      (req.status || 'requested') === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-tab-content">
      <div className="admin-table-card">
        <div className="table-card-header">
          <div>
            <h3>Return & Exchange Requests</h3>
            <p className="table-card-sub">
              Manage patron return requests, reverse logistics, and refund authorization records.
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
              placeholder="Search by order #, customer name, phone or reason..."
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
            <option value="requested">Requested (Pending)</option>
            <option value="approved">Approved</option>
            <option value="picked_up">Picked Up</option>
            <option value="refunded">Refunded</option>
            <option value="rejected">Rejected</option>
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
            Showing {filteredRequests.length} of {returnRequests.length}
          </span>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Order #</th>
                <th>Customer</th>
                <th>Reason</th>
                <th>Refund Method</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                    {isLoading ? 'Loading return requests...' : 'No return requests found matching criteria.'}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ color: '#888' }}>#{req.id}</td>
                    <td>
                      <strong style={{ fontFamily: 'monospace' }}>{req.order_number}</strong>
                    </td>
                    <td>
                      <strong>{req.customer_name || 'Customer'}</strong>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: '#777' }}>
                        {req.customer_phone || req.customer_email}
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <span style={{ color: '#333' }}>{req.reason}</span>
                    </td>
                    <td style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: '#555' }}>
                      {req.refund_method || 'original'}
                    </td>
                    <td>
                      <span
                        className="stock-pill"
                        style={{
                          background:
                            req.status === 'approved' || req.status === 'refunded'
                              ? '#E8F5E9'
                              : req.status === 'rejected'
                              ? '#FFEBEE'
                              : '#FFF3E0',
                          color:
                            req.status === 'approved' || req.status === 'refunded'
                              ? '#2E7D32'
                              : req.status === 'rejected'
                              ? '#C62828'
                              : '#E65100',
                        }}
                      >
                        {req.status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: '#888' }}>
                      {new Date(req.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="actions-cell" style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => {
                          setSelectedRequest(req);
                          setNewStatus(req.status);
                          setAdminNote(req.admin_note || '');
                        }}
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '10px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontFamily: 'var(--font-heading, serif)' }}>
              Update Return Request #{selectedRequest.id}
            </h3>
            <p className="table-card-sub" style={{ marginBottom: '16px' }}>
              Order: <strong style={{ fontFamily: 'monospace' }}>{selectedRequest.order_number}</strong> • Reason: {selectedRequest.reason}
            </p>

            <form onSubmit={handleUpdateStatus}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Action / Decision</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="requested">Requested (Pending Review)</option>
                  <option value="approved">Approve & Dispatch Reverse Courier</option>
                  <option value="picked_up">Item Picked Up & Received in Vault</option>
                  <option value="refunded">Refund Issued & Settled</option>
                  <option value="rejected">Reject Return Request</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Admin Internal Note</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Approved. Reverse airway bill generated with BlueDart."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid var(--grey-300, #ccc)', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Save Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
