import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { useCartStore } from '../../stores/cartStore';
import { formatPrice } from '../../lib/utils';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import './CartDrawer.css';

export function CartDrawer() {
  const navigate = useNavigate();
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    getSubtotal,
    getItemCount,
  } = useCartStore();

  const handleCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={closeDrawer}
      title={`Shopping Bag (${getItemCount()})`}
      width="440px"
    >
      {items.length === 0 ? (
        <div className="cart-drawer-empty">
          <div className="cart-empty-icon-wrap">
            <ShoppingBag size={48} strokeWidth={1.2} />
          </div>
          <h4>Your bag is empty</h4>
          <p>Discover our trendy jhumkas & anti-tarnish everyday jewellery.</p>
          <Button
            variant="primary"
            onClick={() => {
              closeDrawer();
              navigate('/shop');
            }}
          >
            Explore Jewellery
          </Button>
        </div>
      ) : (
        <div className="cart-drawer-body">
          <div className="cart-drawer-items">
            {items.map((item) => (
              <div key={item.id} className="cart-drawer-item">
                <img
                  src={item.product.primary_image || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&q=80'}
                  alt={item.product.name}
                  className="cart-item-image"
                />
                <div className="cart-item-info">
                  <div className="cart-item-header">
                    <h5 className="cart-item-name">{item.product.name}</h5>
                    <button
                      className="cart-item-remove-btn"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {item.variant && (
                    <span className="cart-item-variant">
                      Size: {item.variant.size || 'Standard'} {item.variant.material && `• ${item.variant.material}`}
                    </span>
                  )}

                  <div className="cart-item-footer">
                    <div className="quantity-stepper">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="stepper-btn"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="stepper-count">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="stepper-btn"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="cart-item-pricing">
                      <span className="item-price">
                        {formatPrice(item.product.selling_price * item.quantity)}
                      </span>
                      {item.product.mrp > item.product.selling_price && (
                        <span className="item-mrp">
                          {formatPrice(item.product.mrp * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-drawer-footer">
            <div className="cart-subtotal-row">
              <span className="subtotal-label">Subtotal</span>
              <span className="subtotal-amount">{formatPrice(getSubtotal())}</span>
            </div>
            <p className="cart-shipping-notice">
              Taxes calculated at checkout. Complimentary insured shipping.
            </p>
            <div className="cart-drawer-actions">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                icon={ArrowRight}
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="outline"
                fullWidth
                size="md"
                onClick={handleViewCart}
              >
                View Full Bag
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
