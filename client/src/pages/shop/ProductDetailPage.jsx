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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProductCard } from '../../components/shop/ProductCard';
import { useCartStore } from '../../stores/cartStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import { formatPrice, calculateDiscount } from '../../lib/utils';
import { api } from '../../lib/api';
import './ProductDetailPage.css';

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs');
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        if (res?.data?.product) {
          const p = res.data.product;
          setProduct(p);
          setSelectedVariant(p.variants?.[0] || null);

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
        <p>Retrieving masterpiece from Jasera vault...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Heirloom Piece Not Found</h2>
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

  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setDeliveryStatus('Delivery available in 3-5 business days via insured express transit.');
    } else {
      setDeliveryStatus('Please enter a valid 6-digit Indian PIN code.');
    }
  };

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    addItem(product, selectedVariant, quantity);
    navigate('/checkout');
  };

  return (
    <div className="pdp-page">
      {/* 1. Breadcrumbs */}
      <div className="container pdp-breadcrumb-bar">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop">Catalogue</Link>
        <ChevronRight size={14} />
        <Link to={`/shop?category=${product.category_slug}`}>{product.category_name || product.material}</Link>
        <ChevronRight size={14} />
        <span className="current-crumb">{product.name}</span>
      </div>

      {/* 2. Main Product Hero */}
      <div className="container pdp-hero-grid">
        {/* Left: Gallery */}
        <div className="pdp-gallery-wrap">
          <div className="pdp-thumbnail-strip">
            {images.map((img, idx) => (
              <button
                key={idx}
                className={`pdp-thumb-btn ${activeImageIndex === idx ? 'is-active' : ''}`}
                onClick={() => setActiveImageIndex(idx)}
              >
                <img src={img.url} alt={`${product.name} thumbnail ${idx + 1}`} />
              </button>
            ))}
          </div>

          <div className="pdp-main-image-wrap">
            <img
              src={images[activeImageIndex]?.url || product.primary_image}
              alt={product.name}
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
          <span className="pdp-sku">SKU: SUV-{product.id.toString().padStart(5, '0')}</span>

          {/* Rating */}
          <div className="pdp-rating-row">
            <div className="pdp-stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.floor(product.rating || 5) ? 'var(--color-antique-gold)' : 'none'}
                  color="var(--color-antique-gold)"
                />
              ))}
            </div>
            <span className="pdp-rating-text">
              <strong>{product.rating || 4.9}</strong> ({product.review_count || 24} Verified Patron Reviews)
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
            <span className="pdp-tax-note">Inclusive of all taxes & 3% GST. Free transit insurance included.</span>
            <span className="pdp-emi-note">
              EMI starts at ₹{Math.round(currentPrice / 12).toLocaleString('en-IN')}/month with leading banks.
            </span>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="pdp-variant-selector">
              <label className="variant-label">Select Size / Fit:</label>
              <div className="variant-options">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    className={`variant-pill ${selectedVariant?.id === v.id ? 'is-selected' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & CTA Buttons */}
          <div className="pdp-actions-row">
            <div className="pdp-quantity-stepper">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="pdp-qty-btn"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="pdp-qty-display">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="pdp-qty-btn"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="pdp-add-cart-btn"
              icon={ShoppingBag}
              onClick={handleAddToCart}
            >
              Add To Shopping Bag
            </Button>

            <button
              className={`pdp-wishlist-toggle ${isFavorited ? 'is-active' : ''}`}
              onClick={() => toggleItem(product)}
              aria-label="Save to wishlist"
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

          {/* Pincode Check */}
          <div className="pdp-pincode-card">
            <span className="pincode-card-title">
              <Truck size={18} /> Check Insured Delivery By Pincode
            </span>
            <form onSubmit={handlePincodeCheck} className="pincode-input-row">
              <input
                type="text"
                placeholder="Enter 6-digit Pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="pincode-input"
              />
              <button type="submit" className="pincode-btn">Check</button>
            </form>
            {deliveryStatus && <p className="pincode-status">{deliveryStatus}</p>}
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
            Product Specifications
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
            className={`pdp-tab-btn ${activeTab === 'shipping' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            Express Shipping & Returns
          </button>
        </div>

        <div className="pdp-tab-content">
          {activeTab === 'specs' && (
            <div className="specs-table-wrap">
              <table className="specs-table">
                <tbody>
                  <tr>
                    <th>Material / Finish</th>
                    <td>{product.material || 'Oxidised Silver Finish'}</td>
                  </tr>
                  <tr>
                    <th>Approx Weight</th>
                    <td>{product.weight || 'Lightweight & comfortable for all-day wear'}</td>
                  </tr>
                  <tr>
                    <th>Category</th>
                    <td>{product.category_name || 'Boutique Jewellery'}</td>
                  </tr>
                  <tr>
                    <th>Occasion</th>
                    <td>{product.occasion || 'College, Office, Festive & Daily Wear'}</td>
                  </tr>
                  <tr>
                    <th>Packaging</th>
                    <td>Cute aesthetic boutique pouch / box ready for gifting</td>
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
              <p>
                Keep your boutique jewellery shining bright for years with these easy care tips:
              </p>
              <ul>
                <li><strong>Avoid Harsh Perfumes:</strong> Apply perfumes and body mists before wearing your jewellery.</li>
                <li><strong>Dry Storage:</strong> Keep in an airtight pouch or our complimentary boutique box when not in use.</li>
                <li><strong>Gentle Cleaning:</strong> Wipe clean after wearing with a soft microfiber cloth to remove moisture and oils.</li>
                <li><strong>Water Friendly:</strong> While anti-tarnish, avoid swimming in chlorinated pools while wearing.</li>
              </ul>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="shipping-policy-content">
              <h3>Express Shipping & Pan-India Delivery</h3>
              <p>
                All orders are packed with care in aesthetic boutique packaging and shipped within 24 hours via reliable couriers (BlueDart & Delhivery). You will receive an SMS and email with live tracking as soon as your package is dispatched.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Related Products */}
      {relatedProducts.length > 0 && (
        <section className="section-related-products">
          <div className="container">
            <div className="section-header text-center">
              <span className="section-eyebrow">COMPLEMENTARY PIECES</span>
              <h2 className="section-title">Complete Your Heirloom Parure</h2>
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
