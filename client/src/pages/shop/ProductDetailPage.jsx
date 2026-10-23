import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Award,
  RefreshCw,
  Star,
  Check,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Camera,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProductCard } from '../../components/shop/ProductCard';
import { useCartStore } from '../../stores/cartStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useAuthStore } from '../../stores/authStore';
import { formatPrice, calculateDiscount } from '../../lib/utils';
import { api } from '../../lib/api';
import './ProductDetailPage.css';

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { isAuthenticated, user } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs');
  
  // Pincode Serviceability State (Item #17)
  const [pincode, setPincode] = useState('');
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState(null);

  // Reviews State (Item #23, #24)
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ avgRating: 4.9, count: 0 });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '', photoUrl: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        if (res?.data?.product) {
          const p = res.data.product;
          setProduct(p);
          setSelectedVariant(p.variants?.[0] || null);

          // Fetch real reviews from database
          try {
            const revRes = await api.get(`/reviews/product/${p.id}`);
            if (revRes?.data) {
              setReviews(revRes.data.reviews || []);
              if (revRes.data.summary) {
                setReviewStats({
                  avgRating: revRes.data.summary.avgRating || 4.9,
                  count: revRes.data.summary.totalReviews || 0,
                });
              }
            }
          } catch (rErr) {
            console.warn('Could not load reviews:', rErr.message);
          }

          // Fetch related products in same category
          if (p.category_slug) {
            const relRes = await api.get(`/products?category=${p.category_slug}&limit=4`);
            if (relRes?.data?.products) {
              setRelatedProducts(relRes.data.products.filter((item) => item.id !== p.id));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching product from DB:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <p>Retrieving masterpiece from Jassera catalogue...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Jewellery Piece Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/shop')}>
          Return to Catalogue
        </Button>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);
  const currentPrice = selectedVariant?.price_override || product.selling_price;
  const discount = calculateDiscount(currentPrice, product.mrp);
  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: product.primary_image || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80' }];

  // Real database Pincode Serviceability Check (Item #17)
  const handlePincodeCheck = async (e) => {
    e.preventDefault();
    if (pincode.length !== 6) {
      setDeliveryResult({
        serviceable: false,
        message: 'Please enter a valid 6-digit Indian PIN code.',
      });
      return;
    }

    setPincodeChecking(true);
    try {
      const res = await api.get(`/pincodes/check/${pincode}`);
      if (res?.data) {
        setDeliveryResult(res.data);
      }
    } catch (err) {
      setDeliveryResult({
        serviceable: false,
        message: err.message || 'Serviceability verification error. Please try again.',
      });
    } finally {
      setPincodeChecking(false);
    }
  };

  const handleAddToCart = () => {
    addItem({
      ...product,
      price: currentPrice,
      selling_price: currentPrice,
      variant: selectedVariant,
      variantId: selectedVariant?.id || null,
      variantSize: selectedVariant?.size || 'Standard Free Size',
      image: images[activeImageIndex]?.url || product.primary_image,
      quantity,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  // Submit Review to reviews + review_photos table
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setSubmittingReview(true);
    try {
      const photos = reviewForm.photoUrl?.trim() ? [reviewForm.photoUrl.trim()] : [];
      await api.post('/reviews', {
        productId: product.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        body: reviewForm.body,
        photos,
      });

      setReviewSuccessMsg('Your review has been submitted for moderation! Thank you for supporting handcrafted artistry.');
      setReviewForm({ rating: 5, title: '', body: '', photoUrl: '' });
      setTimeout(() => {
        setIsReviewModalOpen(false);
        setReviewSuccessMsg('');
      }, 2500);
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="pdp-page">
      {/* 1. Breadcrumb */}
      <div className="container pdp-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop">Shop</Link>
        {product.category_slug && (
          <>
            <ChevronRight size={14} />
            <Link to={`/shop?category=${product.category_slug}`}>{product.category_name}</Link>
          </>
        )}
        <ChevronRight size={14} />
        <span>{product.name}</span>
      </div>

      {/* 2. Main Product Hero (Gallery + Purchase Info) */}
      <div className="container pdp-main-grid">
        {/* Left: Gallery (Item #18: product_images) */}
        <div className="pdp-gallery-column">
          <div className="pdp-thumbnails">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                className={`pdp-thumb-btn ${activeImageIndex === idx ? 'is-active' : ''}`}
                onClick={() => setActiveImageIndex(idx)}
                aria-label={`View photo ${idx + 1}`}
              >
                <img src={img.url} alt={img.alt_text || `${product.name} view ${idx + 1}`} />
              </button>
            ))}
          </div>

          <div className="pdp-main-image-wrap">
            <img
              src={images[activeImageIndex]?.url || product.primary_image}
              alt={images[activeImageIndex]?.alt_text || product.name}
              className="pdp-main-image"
            />
            {product.badge && (
              <div className="pdp-badge-wrap">
                <Badge variant="gold" size="md">{product.badge}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="pdp-info-column">
          <span className="pdp-purity-tag">
            <Sparkles size={16} /> {product.material || 'Anti-Tarnish & Hypoallergenic Finish'}
          </span>

          <h1 className="pdp-title">{product.name}</h1>
          <span className="pdp-sku">SKU: {selectedVariant?.sku || `JAS-${product.id.toString().padStart(5, '0')}`}</span>

          {/* Rating */}
          <div className="pdp-rating-row">
            <div className="pdp-stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.floor(reviewStats.avgRating) ? 'var(--color-antique-gold)' : 'none'}
                  color="var(--color-antique-gold)"
                />
              ))}
            </div>
            <span className="pdp-rating-text">
              <strong>{reviewStats.avgRating}</strong> ({reviewStats.count > 0 ? `${reviewStats.count} Reviews` : 'Verified Patron Reviews'})
            </span>
          </div>

          {/* Price */}
          <div className="pdp-price-box">
            <div className="pdp-price-row">
              <span className="pdp-selling-price">{formatPrice(currentPrice)}</span>
              {product.mrp && product.mrp > currentPrice && (
                <>
                  <span className="pdp-mrp-price">{formatPrice(product.mrp)}</span>
                  <Badge variant="maroon" size="sm">Save {discount}%</Badge>
                </>
              )}
            </div>
            <span className="pdp-tax-note">Inclusive of all taxes & 3% GST. Free shipping above ₹499.</span>
          </div>

          {/* Variant Selector (Item #19: product_variants) */}
          {product.variants && product.variants.length > 0 && (
            <div className="pdp-variant-selector">
              <label className="variant-label">Select Variant / Size:</label>
              <div className="variant-chips-row">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`variant-chip ${selectedVariant?.id === v.id ? 'is-selected' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    <span>{v.size || 'Standard Free Size'}</span>
                    {v.price_override && Number(v.price_override) !== Number(product.selling_price) && (
                      <small style={{ marginLeft: '4px', opacity: 0.8 }}>₹{v.price_override}</small>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="pdp-quantity-selector">
            <label className="variant-label">Quantity:</label>
            <div className="qty-controls">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <span className="qty-display">{quantity}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pdp-actions-row">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={ShoppingBag}
              onClick={handleAddToCart}
            >
              Add To Bag
            </Button>
            <button
              className={`pdp-wishlist-toggle ${isFavorited ? 'is-favorited' : ''}`}
              onClick={() => toggleItem(product)}
              aria-label="Save to Wishlist"
            >
              <Heart size={20} fill={isFavorited ? 'var(--color-maroon)' : 'none'} />
            </button>
          </div>

          <Button
            variant="gold"
            size="lg"
            fullWidth
            className="pdp-buy-now-btn"
            onClick={handleBuyNow}
          >
            Express Checkout
          </Button>

          {/* Dynamic Pincode Serviceability (Item #17: pincode_serviceability) */}
          <div className="pdp-pincode-card">
            <span className="pincode-card-title">
              <Truck size={18} /> Check Delivery & COD Availability
            </span>
            <form onSubmit={handlePincodeCheck} className="pincode-input-row">
              <input
                type="text"
                placeholder="Enter 6-digit Pincode (e.g. 400001)"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="pincode-input"
              />
              <button type="submit" className="pincode-btn" disabled={pincodeChecking}>
                {pincodeChecking ? 'Checking...' : 'Check'}
              </button>
            </form>
            {deliveryResult && (
              <p className="pincode-status" style={{ color: deliveryResult.serviceable ? '#2e7d32' : '#c62828' }}>
                {deliveryResult.message}
              </p>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="pdp-trust-grid">
            <div className="pdp-trust-item">
              <ShieldCheck size={20} className="trust-ic" />
              <span>Anti-Tarnish & Waterproof</span>
            </div>
            <div className="pdp-trust-item">
              <Truck size={20} className="trust-ic" />
              <span>Fast Pan-India Express Delivery</span>
            </div>
            <div className="pdp-trust-item">
              <RefreshCw size={20} className="trust-ic" />
              <span>7-Day Easy Exchange Policy</span>
            </div>
            <div className="pdp-trust-item">
              <Check size={20} className="trust-ic" />
              <span>100% Skin-Friendly Hypoallergenic</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Product Tabs */}
      <div className="container pdp-tabs-section">
        <div className="pdp-tab-headers">
          <button
            className={`pdp-tab-btn ${activeTab === 'specs' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Specifications
          </button>
          <button
            className={`pdp-tab-btn ${activeTab === 'story' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('story')}
          >
            Description & Styling
          </button>
          <button
            className={`pdp-tab-btn ${activeTab === 'care' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('care')}
          >
            Jewellery Care
          </button>
          <button
            className={`pdp-tab-btn ${activeTab === 'reviews' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Patron Reviews ({reviews.length})
          </button>
        </div>

        <div className="pdp-tab-content">
          {activeTab === 'specs' && (
            <div className="specs-table-wrap">
              <table className="specs-table">
                <tbody>
                  <tr>
                    <th>Material / Finish</th>
                    <td>{product.material || 'Fashion Jewellery'}</td>
                  </tr>
                  <tr>
                    <th>Occasion</th>
                    <td>{product.occasion || 'College, Office & Festive'}</td>
                  </tr>
                  <tr>
                    <th>Approx Weight</th>
                    <td>{product.weight || 'Lightweight for all-day comfort'}</td>
                  </tr>
                  <tr>
                    <th>Dimensions</th>
                    <td>{product.dimensions || 'Standard ergonomic proportion'}</td>
                  </tr>
                  <tr>
                    <th>HSN / Tax</th>
                    <td>HSN 71179090 (3% GST)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'story' && (
            <div className="craft-story-content">
              <h3>{product.name}</h3>
              <p>{product.long_description || product.short_description || 'Handcrafted statement piece curated for effortless styling.'}</p>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="hallmark-guarantee-content">
              <h3>Jewellery Care Tips</h3>
              <p>{product.care_guide || 'Avoid contact with perfumes, chemicals, and water. Store in a dry airtight pouch after use.'}</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="pdp-reviews-tab-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Customer Experiences</h3>
                  <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.9rem' }}>
                    {reviews.length} Verified Patron Review(s) • Average Rating: {reviewStats.avgRating} / 5
                  </p>
                </div>
                <Button variant="gold" size="sm" onClick={() => setIsReviewModalOpen(true)}>
                  Write A Review
                </Button>
              </div>

              {reviews.length > 0 ? (
                <div className="pdp-reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      style={{
                        padding: '18px',
                        background: '#FFF',
                        borderRadius: '8px',
                        border: '1px solid #ECECEC',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < rev.rating ? '#D4AF37' : 'none'}
                              color="#D4AF37"
                            />
                          ))}
                        </div>
                        <strong style={{ fontSize: '0.95rem' }}>{rev.title || 'Exceptional Quality'}</strong>
                      </div>
                      <p style={{ margin: '6px 0 10px', color: '#444', fontSize: '0.92rem', lineHeight: '1.5' }}>
                        {rev.body}
                      </p>

                      {/* Attached review photos (Item #23) */}
                      {rev.photos && rev.photos.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                          {rev.photos.map((ph, pIdx) => (
                            <img
                              key={pIdx}
                              src={ph.url}
                              alt="Customer review photo"
                              style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }}
                            />
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: '0.8rem', color: '#888', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span>{rev.customer_name || 'Verified Customer'}</span>
                        <span>•</span>
                        <span style={{ color: '#2e7d32', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle size={12} /> Verified Purchase
                        </span>
                      </div>

                      {rev.admin_reply && (
                        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#F9F7F2', borderLeft: '3px solid #D4AF37', borderRadius: '4px', fontSize: '0.85rem' }}>
                          <strong>Jassera Team:</strong> {rev.admin_reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '36px', textAlign: 'center', background: '#FDFBF7', borderRadius: '8px', border: '1px dashed #D4AF37' }}>
                  <p style={{ margin: '0 0 12px', color: '#666' }}>No reviews yet for this design. Be the first to share your aesthetic styling!</p>
                  <Button variant="gold" size="sm" onClick={() => setIsReviewModalOpen(true)}>
                    Be First To Review
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Submission Modal (Items #23, #24) */}
      {isReviewModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>Write A Customer Review</h3>
            <p style={{ margin: '0 0 20px', color: '#666', fontSize: '0.88rem' }}>
              Sharing your honest feedback helps other jewellery lovers discover their perfect match.
            </p>

            {reviewSuccessMsg ? (
              <div style={{ padding: '16px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} /> {reviewSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>Rating:</label>
                  <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={24}
                        fill={star <= reviewForm.rating ? '#D4AF37' : 'none'}
                        color="#D4AF37"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>Review Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stunning craftsmanship, lightweight feel!"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>Your Detailed Experience</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about the shine, comfort, compliments received, or packaging..."
                    value={reviewForm.body}
                    onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>Photo Attachment URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={reviewForm.photoUrl}
                    onChange={(e) => setReviewForm({ ...reviewForm, photoUrl: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <Button variant="outline" type="button" onClick={() => setIsReviewModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="gold" type="submit" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. Related Products */}
      {relatedProducts.length > 0 && (
        <section className="section-related-products">
          <div className="container">
            <div className="section-header text-center">
              <span className="section-eyebrow">COMPLEMENTARY PIECES</span>
              <h2 className="section-title">Complete Your Look</h2>
            </div>
            <div className="products-grid-container">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
