import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminReviewsTab({ onNotify }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyModalReview, setReplyModalReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

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

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Review Moderation & Photos</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Moderate customer feedback (<code>reviews</code> table) and attached customer unboxing photos (<code>review_photos</code> table).
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reviews.length === 0 ? (
          <div style={{ background: '#FFF', padding: '40px', textAlign: 'center', borderRadius: '8px', border: '1px solid #ECECEC', color: '#888' }}>
            {isLoading ? 'Loading customer reviews...' : 'No customer reviews submitted yet.'}
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              style={{
                background: '#FFF',
                borderRadius: '8px',
                border: '1px solid #EBEBEB',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < rev.rating ? '#D4AF37' : 'none'}
                          color="#D4AF37"
                        />
                      ))}
                    </div>
                    <strong style={{ fontSize: '1rem', color: '#1F1F1F' }}>{rev.title || 'Untitled Review'}</strong>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>
                    Reviewed on <strong>{rev.product_name}</strong> • By <strong>{rev.customer_name || 'Customer'}</strong> ({rev.customer_email})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
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
                    {rev.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <p style={{ margin: 0, color: '#444', fontSize: '0.92rem', lineHeight: '1.5' }}>
                {rev.body}
              </p>

              {/* Review Photos (Item #23) */}
              {rev.photos && rev.photos.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  {rev.photos.map((ph, pIdx) => (
                    <img
                      key={pIdx}
                      src={ph.url}
                      alt="Customer review upload"
                      style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #DDD' }}
                    />
                  ))}
                </div>
              )}

              {/* Admin Reply */}
              {rev.admin_reply && (
                <div style={{ padding: '10px 14px', background: '#FDFBF7', borderLeft: '3px solid #D4AF37', borderRadius: '4px', fontSize: '0.85rem' }}>
                  <strong>Official Store Reply:</strong> {rev.admin_reply}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #F5F5F5', paddingTop: '12px', justifyContent: 'flex-end' }}>
                {rev.status !== 'approved' && (
                  <Button
                    variant="gold"
                    size="sm"
                    style={{ fontSize: '0.78rem', padding: '4px 12px' }}
                    onClick={() => handleModerate(rev.id, 'approved')}
                  >
                    Approve Review
                  </Button>
                )}
                {rev.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleModerate(rev.id, 'rejected')}
                    style={{ background: 'none', border: '1px solid #FFCDD2', color: '#C62828', borderRadius: '4px', padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Reject
                  </button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  style={{ fontSize: '0.78rem', padding: '4px 12px' }}
                  onClick={() => {
                    setReplyModalReview(rev);
                    setReplyText(rev.admin_reply || '');
                  }}
                >
                  <MessageCircle size={14} style={{ marginRight: '4px' }} /> Reply
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      {replyModalReview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>Reply to Customer Review</h3>
            <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem' }}>
              Product: <strong>{replyModalReview.product_name}</strong> • Patron: {replyModalReview.customer_name}
            </p>

            <form onSubmit={handleReplySubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Official Store Reply
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Thank you so much for loving our handcrafted designs! We are thrilled to hear..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => setReplyModalReview(null)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit" disabled={savingReply}>
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
