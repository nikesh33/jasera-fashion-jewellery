import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, MessageCircle, Search, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminReviewsTab({ onNotify }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyModalReview, setReplyModalReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reviews/admin/all');
      if (res?.data?.reviews) {
        setReviews(res.data.reviews);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load reviews', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleModerate = async (reviewId, status) => {
    try {
      await api.patch(`/reviews/admin/${reviewId}/moderate`, { status });
      onNotify?.(`Review status updated to ${status.toUpperCase()}! Product star rating recalculated.`, 'success');
      loadReviews();
    } catch (err) {
      onNotify?.(err.message || 'Failed to update review status', 'error');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyModalReview || !replyText.trim()) return;
    setSavingReply(true);

    try {
      await api.patch(`/reviews/admin/${replyModalReview.id}/reply`, {
        reply: replyText.trim(),
      });
      onNotify?.('Brand response published to customer review!', 'success');
      setReplyModalReview(null);
      setReplyText('');
      loadReviews();
    } catch (err) {
      onNotify?.(err.message || 'Failed to publish reply', 'error');
    } finally {
      setSavingReply(false);
    }
  };

  const filteredReviews = reviews.filter((rev) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      rev.product_name?.toLowerCase().includes(q) ||
      rev.customer_name?.toLowerCase().includes(q) ||
      rev.customer_email?.toLowerCase().includes(q) ||
      rev.title?.toLowerCase().includes(q) ||
      rev.body?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' ||
      (rev.status || 'pending') === statusFilter;
    const matchRating =
      ratingFilter === 'all' ||
      String(rev.rating) === ratingFilter;
    return matchSearch && matchStatus && matchRating;
  });

  return (
    <div className="admin-tab-content">
      <div className="admin-table-card">
        <div className="table-card-header">
          <div>
            <h3>Customer Reviews & Moderation</h3>
            <p className="table-card-sub">
              Moderate verified customer ratings, approve customer unboxing photos, and publish brand replies.
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
              placeholder="Search by product, customer name or review text..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="admin-filter-select"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {(searchQuery || statusFilter !== 'all' || ratingFilter !== 'all') && (
            <button
              type="button"
              className="admin-filter-reset"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setRatingFilter('all');
              }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}

          <span className="admin-filter-count">
            Showing {filteredReviews.length} of {reviews.length}
          </span>
        </div>

        {/* Reviews List */}
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredReviews.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
              {isLoading ? 'Loading customer reviews...' : 'No customer reviews found matching criteria.'}
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: '1px solid var(--grey-200, #EAEAEA)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={15}
                            fill={i < rev.rating ? '#D4AF37' : 'none'}
                            color="#D4AF37"
                          />
                        ))}
                      </div>
                      <strong style={{ fontSize: '0.98rem', color: 'var(--color-charcoal, #1a1a1a)' }}>
                        {rev.title || 'Customer Review'}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.84rem', color: 'var(--grey-600, #666)' }}>
                      Product: <strong>{rev.product_name}</strong> • By <strong>{rev.customer_name || 'Customer'}</strong> {rev.customer_email ? `(${rev.customer_email})` : ''}
                    </span>
                  </div>

                  <span
                    className="stock-pill"
                    style={{
                      background:
                        rev.status === 'approved'
                          ? '#E8F5E9'
                          : rev.status === 'rejected'
                          ? '#FFEBEE'
                          : '#FFF3E0',
                      color:
                        rev.status === 'approved'
                          ? '#2E7D32'
                          : rev.status === 'rejected'
                          ? '#C62828'
                          : '#E65100',
                    }}
                  >
                    {rev.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>

                <p style={{ margin: 0, color: 'var(--grey-800, #333)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {rev.body}
                </p>

                {/* Customer Uploaded Photos */}
                {rev.photos && rev.photos.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    {rev.photos.map((ph, pIdx) => (
                      <img
                        key={pIdx}
                        src={ph.url}
                        alt="Customer review upload"
                        style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--grey-300, #ddd)' }}
                      />
                    ))}
                  </div>
                )}

                {/* Store Reply */}
                {rev.admin_reply && (
                  <div style={{ padding: '12px 16px', background: '#FAF7F2', borderLeft: '3px solid var(--color-antique-gold, #D4AF37)', borderRadius: '4px', fontSize: '0.86rem' }}>
                    <strong style={{ color: 'var(--color-maroon, #6B1E2C)' }}>Official Store Reply:</strong>{' '}
                    <span style={{ color: '#444' }}>{rev.admin_reply}</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--grey-100, #F0F0F0)', paddingTop: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {rev.status !== 'approved' && (
                    <button
                      type="button"
                      className="btn-edit"
                      style={{ color: '#2E7D32' }}
                      onClick={() => handleModerate(rev.id, 'approved')}
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                  )}
                  {rev.status !== 'rejected' && (
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleModerate(rev.id, 'rejected')}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => {
                      setReplyModalReview(rev);
                      setReplyText(rev.admin_reply || '');
                    }}
                  >
                    <MessageCircle size={14} /> {rev.admin_reply ? 'Edit Reply' : 'Reply'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {replyModalReview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '10px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontFamily: 'var(--font-heading, serif)' }}>
              Reply to Customer Review
            </h3>
            <p className="table-card-sub" style={{ marginBottom: '16px' }}>
              Product: <strong>{replyModalReview.product_name}</strong> • Patron: {replyModalReview.customer_name}
            </p>

            <form onSubmit={handleReplySubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Official Store Reply</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Thank you so much for loving our handcrafted designs! We are thrilled to hear..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--grey-300, #ccc)', fontSize: '0.88rem' }}
                />
              </div>

              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setReplyModalReview(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={savingReply}>
                  {savingReply ? 'Publishing...' : 'Publish Reply'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
