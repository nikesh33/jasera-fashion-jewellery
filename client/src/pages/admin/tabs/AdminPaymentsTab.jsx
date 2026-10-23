import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, RotateCcw, AlertCircle, FileText, Search, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { formatPrice } from '../../../lib/utils';
import { api } from '../../../lib/api';

export function AdminPaymentsTab({ onNotify }) {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalCaptured: 0, totalPending: 0, totalRefunded: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify modal state
  const [verifyModalPayment, setVerifyModalPayment] = useState(null);
  const [txnRef, setTxnRef] = useState('');
  const [verifyNote, setVerifyNote] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Refund modal state
  const [refundModalPayment, setRefundModalPayment] = useState(null);
  const [refundRef, setRefundRef] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/payments/admin/all');
      if (res?.data) {
        setPayments(res.data.payments || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load payments ledger', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyModalPayment) return;
    setVerifying(true);

    try {
      await api.patch(`/payments/admin/${verifyModalPayment.id}/verify`, {
        transactionRef: txnRef.trim(),
        note: verifyNote.trim(),
      });
      onNotify?.('Payment verified and captured successfully! Order marked as Paid & Confirmed.', 'success');
      setVerifyModalPayment(null);
      setTxnRef('');
      setVerifyNote('');
      loadPayments();
    } catch (err) {
      onNotify?.(err.message || 'Failed to verify payment', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundModalPayment) return;
    setRefunding(true);

    try {
      await api.patch(`/payments/admin/${refundModalPayment.id}/refund`, {
        refundRef: refundRef.trim(),
        reason: refundReason.trim(),
      });
      onNotify?.('Payment marked as refunded in ledger and order status updated.', 'success');
      setRefundModalPayment(null);
      setRefundRef('');
      setRefundReason('');
      loadPayments();
    } catch (err) {
      onNotify?.(err.message || 'Failed to record refund', 'error');
    } finally {
      setRefunding(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      !search ||
      p.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.gateway_payment_id?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer_email?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-tab-content">
      {/* Financial KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Captured Revenue</span>
            <CreditCard size={20} className="kpi-icon" />
          </div>
          <strong className="kpi-val" style={{ color: 'var(--color-success, #2E7D5B)' }}>
            {formatPrice(summary.totalCaptured)}
          </strong>
          <span className="kpi-change positive">Verified & deposited funds</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Pending / In-Transit (COD)</span>
            <RotateCcw size={20} className="kpi-icon" />
          </div>
          <strong className="kpi-val" style={{ color: '#E65100' }}>
            {formatPrice(summary.totalPending)}
          </strong>
          <span className="kpi-change" style={{ color: '#E65100' }}>
            Awaiting delivery or bank confirmation
          </span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Refunded Payments</span>
            <AlertCircle size={20} className="kpi-icon" />
          </div>
          <strong className="kpi-val" style={{ color: '#B3261E' }}>
            {formatPrice(summary.totalRefunded)}
          </strong>
          <span className="kpi-change negative">Customer returns & reversals</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-table-card">
        <div className="table-card-header">
          <div>
            <h3>Payments & Transaction Ledger</h3>
            <p className="table-card-sub">
              Financial transaction tracking (<code>payments</code> table) for UPI, cards, COD collections, and refunds
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="admin-filter-bar">
          <div className="admin-search-input-wrap">
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by order #, UTR / txn ref, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Payment Statuses</option>
            <option value="captured">Captured (Paid)</option>
            <option value="created">Created (Pending)</option>
            <option value="authorized">Authorized (COD)</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
          {(search || statusFilter !== 'all') && (
            <button
              type="button"
              className="admin-filter-reset"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
            >
              Reset
            </button>
          )}
          <span className="admin-filter-count">
            Showing {filteredPayments.length} of {payments.length}
          </span>
        </div>

        {/* Payments Table */}
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Order #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Txn Reference / UTR</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                    {isLoading ? 'Loading transaction records...' : 'No payment records found matching the criteria.'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-muted">#{p.id}</td>
                    <td className="font-mono font-semibold">{p.order_number}</td>
                    <td>
                      <strong>{p.customer_name || 'Guest Checkout'}</strong>
                      {p.customer_phone && <div style={{ fontSize: '0.78rem', color: 'var(--grey-500)' }}>{p.customer_phone}</div>}
                    </td>
                    <td className="font-semibold">{formatPrice(p.amount)}</td>
                    <td>
                      <span className="badge-count" style={{ textTransform: 'uppercase' }}>
                        {p.method}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.85rem', color: p.gateway_payment_id ? 'var(--color-maroon)' : 'var(--grey-400)' }}>
                      {p.gateway_payment_id || 'Pending Ref'}
                    </td>
                    <td>
                      <span
                        className="stock-pill"
                        style={{
                          background:
                            p.status === 'captured'
                              ? '#E8F5EE'
                              : p.status === 'refunded'
                              ? '#FDEDED'
                              : '#FFF3E0',
                          color:
                            p.status === 'captured'
                              ? '#2E7D5B'
                              : p.status === 'refunded'
                              ? '#B3261E'
                              : '#E65100',
                        }}
                      >
                        {p.status ? p.status.toUpperCase() : 'PENDING'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {p.status !== 'captured' && (
                          <button
                            type="button"
                            className="btn-edit"
                            onClick={() => {
                              setVerifyModalPayment(p);
                              setTxnRef(p.gateway_payment_id || '');
                              setVerifyNote(p.notes || '');
                            }}
                            title="Verify and capture payment"
                          >
                            <CheckCircle2 size={13} />
                            Capture
                          </button>
                        )}
                        {p.status === 'captured' && (
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => {
                              setRefundModalPayment(p);
                              setRefundRef('');
                              setRefundReason('');
                            }}
                            title="Issue payment refund"
                          >
                            <RotateCcw size={13} />
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verify Payment Modal */}
      {verifyModalPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>Verify & Capture Manual Payment</h3>
            <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem' }}>
              Confirm deposit of <strong>{formatPrice(verifyModalPayment.amount)}</strong> for Order #{verifyModalPayment.order_number}.
            </p>

            <form onSubmit={handleVerifySubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Bank Reference / UPI UTR / Slip ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 329182938192 or CASH-HANDOVER"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Verification Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified on HDFC Current Account statement"
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => setVerifyModalPayment(null)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit" disabled={verifying}>
                  {verifying ? 'Capturing...' : 'Capture Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModalPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', color: '#C62828' }}>Record Payment Refund</h3>
            <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem' }}>
              Refund amount of <strong>{formatPrice(refundModalPayment.amount)}</strong> for Order #{refundModalPayment.order_number}.
            </p>

            <form onSubmit={handleRefundSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Refund Reference / Bank UTR *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REF-UPI-482910"
                  value={refundRef}
                  onChange={(e) => setRefundRef(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Reason for Refund
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Return requested by customer; piece received in vault"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => setRefundModalPayment(null)}>
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={refunding}
                  style={{
                    background: '#C62828',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {refunding ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
