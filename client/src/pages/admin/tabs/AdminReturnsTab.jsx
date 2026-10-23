import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, XCircle, Clock, Truck, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { formatPrice } from '../../../lib/utils';
import { api } from '../../../lib/api';

export function AdminReturnsTab({ onNotify }) {
  const [returnRequests, setReturnRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState('approved');
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);

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

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Return & Exchange Requests</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Customer return requests and reversal status management (<code>return_requests</code> table).
          </p>
        </div>
      </div>

      <div className="table-card" style={{ background: '#FFF', borderRadius: '8px', border: '1px solid #ECECEC', overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #EAEAEA', fontSize: '0.85rem' }}>
              <th style={{ padding: '14px' }}>Request ID</th>
              <th style={{ padding: '14px' }}>Order #</th>
              <th style={{ padding: '14px' }}>Customer</th>
              <th style={{ padding: '14px' }}>Reason</th>
              <th style={{ padding: '14px' }}>Method</th>
              <th style={{ padding: '14px' }}>Status</th>
              <th style={{ padding: '14px' }}>Requested At</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {returnRequests.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                  {isLoading ? 'Loading return requests...' : 'No return requests recorded.'}
                </td>
              </tr>
            ) : (
              returnRequests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #F2F2F2', fontSize: '0.88rem' }}>
                  <td style={{ padding: '12px 14px', color: '#888' }}>#{req.id}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{req.order_number}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <strong>{req.customer_name || 'Customer'}</strong>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#777' }}>{req.customer_phone || req.customer_email}</span>
                  </td>
                  <td style={{ padding: '12px 14px', maxWidth: '240px' }}>
                    <strong>{req.reason}</strong>
                  </td>
                  <td style={{ padding: '12px 14px', textTransform: 'uppercase', fontSize: '0.8rem', color: '#555' }}>
                    {req.refund_method || 'original'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
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
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#888' }}>
                    {new Date(req.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      onClick={() => {
                        setSelectedRequest(req);
                        setNewStatus(req.status);
                        setAdminNote(req.admin_note || '');
                      }}
                    >
                      Update Status
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Status Update Modal */}
      {selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>Update Return Request #{selectedRequest.id}</h3>
            <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem' }}>
              Order: <strong>{selectedRequest.order_number}</strong> • Reason: {selectedRequest.reason}
            </p>

            <form onSubmit={handleUpdateStatus}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Action / Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                >
                  <option value="requested">Requested (Pending Review)</option>
                  <option value="approved">Approve & Dispatch Reverse Courier</option>
                  <option value="picked_up">Item Picked Up & Received in Vault</option>
                  <option value="refunded">Refund Issued & Settled</option>
                  <option value="rejected">Reject Return Request</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Admin Internal Note</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Approved. Reverse airway bill generated with BlueDart."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => setSelectedRequest(null)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit" disabled={updating}>
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
