import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useCartStore } from '../../stores/cartStore';
import { formatPrice } from '../../lib/utils';
import './WishlistPage.css';

export function WishlistPage() {
  const navigate = useNavigate();
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleMoveToBag = (product) => {
    addItem(product, null, 1);
    removeItem(product.id);
  };

  if (items.length === 0) {
    return (
      <div className="wishlist-empty container">
        <div className="wishlist-empty-icon">
          <Heart size={56} strokeWidth={1} color="var(--color-maroon)" />
        </div>
        <h2>Your Wishlist Is Empty</h2>
        <p>Save your favorite royal jewellery pieces to revisit or acquire anytime.</p>
        <Button variant="primary" size="lg" onClick={() => navigate('/shop')}>
          Discover Heirloom Jewels
        </Button>
      </div>
    );
  }

  return (
    <div className="wishlist-page container">
      <div className="wishlist-header">
        <div>
          <h1 className="wishlist-title">My Wishlist</h1>
          <span className="wishlist-count">{items.length} Saved Creations</span>
        </div>
        <button onClick={clearWishlist} className="clear-wishlist-btn">
          Clear Wishlist
        </button>
      </div>

      <div className="wishlist-grid">
        {items.map((item) => (
          <div key={item.id} className="wishlist-card">
            <div className="wishlist-media">
              <Link to={`/product/${item.slug || item.id}`}>
                <img src={item.primary_image} alt={item.name} />
              </Link>
              <button
                className="wishlist-remove-btn"
                onClick={() => removeItem(item.id)}
                title="Remove item"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="wishlist-info">
              <span className="wishlist-mat">{item.material || 'Boutique Jewellery'}</span>
              <h3 className="wishlist-item-name">
                <Link to={`/product/${item.slug || item.id}`}>{item.name}</Link>
              </h3>
              <div className="wishlist-pricing">
                <span className="wishlist-price">{formatPrice(item.selling_price)}</span>
                {item.mrp && item.mrp > item.selling_price && (
                  <span className="wishlist-mrp">{formatPrice(item.mrp)}</span>
                )}
              </div>

              <Button
                variant="primary"
                size="sm"
                fullWidth
                icon={ShoppingBag}
                onClick={() => handleMoveToBag(item)}
              >
                Move To Bag
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
