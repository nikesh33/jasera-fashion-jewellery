import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useCartStore } from '../../stores/cartStore';
import { formatPrice, calculateDiscount } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import './ProductCard.css';

export function ProductCard({ product }) {
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { addItem } = useCartStore();

  const isFavorited = isInWishlist(product.id);
  const discount = calculateDiscount(product.selling_price, product.mrp);

  // Fallback images if not provided
  const primaryImg = product.primary_image || (product.images && product.images[0]?.url) || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80';
  const secondaryImg = (product.images && product.images[1]?.url) || primaryImg;

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, product.variants?.[0] || null, 1);
  };

  return (
    <div className="product-card">
      <div className="product-card-media">
        <Link to={`/product/${product.slug || product.id}`}>
          <img
            src={primaryImg}
            alt={product.name}
            className="product-card-img primary-img"
            loading="lazy"
          />
          {secondaryImg && (
            <img
              src={secondaryImg}
              alt={`${product.name} alternate view`}
              className="product-card-img secondary-img"
              loading="lazy"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="product-card-badges">
          {product.badge && (
            <Badge variant="gold" size="sm">
              {product.badge}
            </Badge>
          )}
          {discount > 0 && (
            <Badge variant="maroon" size="sm">
              {discount}% OFF
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          className={`product-wishlist-btn ${isFavorited ? 'is-active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={18} fill={isFavorited ? 'var(--color-maroon)' : 'none'} />
        </button>

        {/* Quick Add Action Bar */}
        <div className="product-card-overlay-actions">
          <button
            className="card-quick-add-btn"
            onClick={handleAddToCart}
            aria-label="Add to shopping bag"
          >
            <ShoppingBag size={16} />
            <span>Add to Bag</span>
          </button>
        </div>
      </div>

      <div className="product-card-content">
        <span className="product-card-material">
          {product.material || 'Handcrafted Boutique Finish'}
        </span>
        <h4 className="product-card-title">
          <Link to={`/product/${product.slug || product.id}`}>{product.name}</Link>
        </h4>
        <div className="product-card-pricing">
          <span className="product-selling-price">{formatPrice(product.selling_price)}</span>
          {product.mrp && product.mrp > product.selling_price && (
            <span className="product-mrp-price">{formatPrice(product.mrp)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
