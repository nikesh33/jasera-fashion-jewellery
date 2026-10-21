import React from 'react';
import { ProductCard } from './ProductCard';
import './ProductGrid.css';

export function ProductGrid({ products, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="product-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} className="product-card-skeleton">
            <div className="skeleton-img" />
            <div className="skeleton-text short" />
            <div className="skeleton-text long" />
            <div className="skeleton-text price" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="product-grid-empty">
        <p>No heirloom pieces match your selected criteria.</p>
        <span>Try adjusting or clearing your filters to explore our full collection.</span>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
