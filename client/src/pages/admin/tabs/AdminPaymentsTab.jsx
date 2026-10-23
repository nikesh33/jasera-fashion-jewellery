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
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Payments & Transaction Ledger</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Comprehensive financial transaction tracking (payments table) for manual UPI, bank transfers, COD collections, and refunds.
          </p>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '24px' }}>
        <div style={{ background: '#FFF', padding: '20px', borderRadius: '10px', border: '1px solid #EBEBEB', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Total Captured Revenue</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2E7D32', marginTop: '6px' }}>
            {formatPrice(summary.totalCaptured)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#888' }}>Verified & deposited funds</span>
        </div>

        <div style={{ background: '#FFF', padding: '20px', borderRadius: '10px', border: '1px solid #EBEBEB', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Pending / In-Transit (COD)</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#E65100', marginTop: '6px' }}>
            {formatPrice(summary.totalPending)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#888' }}>Awaiting delivery or bank confirmation</span>
        </div>

        <div style={{ background: '#FFF', padding: '20px', borderRadius: '10px', border: '1px solid #EBEBEB', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 600, textTransform: 'uppercase' }}>Refunded Payments</span>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#C62828', marginTop: '6px' }}>
            {formatPrice(summary.totalRefunded)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#888' }}>Customer returns & reversals</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by order #, UTR / txn ref, customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flexGrow: 1, minWidth: '260px', padding: '9px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.9rem' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '6px', border: '1px solid #DDD', fontSize: '0.9rem', background: '#FFF' }}
        >
          <option value="all">All Payment Statuses</option>
          <option value="captured">Captured (Paid)</option>
          <option value="created">Created (Pending)</option>
          <option value="authorized">Authorized (COD)</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="table-card" style={{ background: '#FFF', borderRadius: '8px', border: '1px solid #ECECEC', overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #EAEAEA', fontSize: '0.85rem' }}>
              <th style={{ padding: '14px' }}>Txn ID</th>
              <th style={{ padding: '14px' }}>Order #</th>
              <th style={{ padding: '14px' }}>Customer</th>
              <th style={{ padding: '14px' }}>Amount</th>
              <th style={{ padding: '14px' }}>Method</th>
              <th style={{ padding: '14px' }}>Txn Reference / UTR</th>
              <th style={{ padding: '14px' }}>Status</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Actions</th>
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
                <tr key={p.id} style={{ borderBottom: '1px solid #F2F2F2', fontSize: '0.88rem' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#888' }}>#{p.id}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{p.order_number}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <strong>{p.customer_name || 'Guest Checkout'}</strong>
                    {p.customer_phone && <span style={{ display: 'block', fontSize: '0.78rem', color: '#777' }}>{p.customer_phone}</span>}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{formatPrice(p.amount)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px', background: '#F0F0F0', fontWeight: 500 }}>
                      {p.method}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.85rem', color: p.gateway_payment_id ? '#1565C0' : '#AAA' }}>
                    {p.gateway_payment_id || 'Pending Ref'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background:
                          p.status === 'captured'
                            ? '#E8F5E9'
                            : p.status === 'refunded'
                            ? '#FFEBEE'
                            : '#FFF3E0',
                        color:
                          p.status === 'captured'
                            ? '#2E7D32'
                            : p.status === 'refunded'
                            ? '#C62828'
                            : '#E65100',
                      }}
                    >
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    {p.status !== 'captured' && p.status !== 'refunded' && (
                      <Button
                        variant="gold"
                        size="sm"
                        style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                        onClick={() => {
                          setVerifyModalPayment(p);
                          setTxnRef(p.gateway_payment_id || `UPI-${Date.now().toString().slice(-6)}`);
                        }}
                      >
                        Verify & Capture
                      </Button>
                    )}
                    {p.status === 'captured' && (
                      <button
                        type="button"
                        onClick={() => {
                          setRefundModalPayment(p);
                          setRefundRef(`REF-${Date.now().toString().slice(-6)}`);
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid #FFCDD2',
                          borderRadius: '4px',
                          color: '#C62828',
                          padding: '4px 8px',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Issue Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
