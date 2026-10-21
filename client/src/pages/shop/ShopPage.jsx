import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductGrid } from '../../components/shop/ProductGrid';
import { FilterSidebar } from '../../components/shop/FilterSidebar';
import { api } from '../../lib/api';
import './ShopPage.css';

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Read URL parameters
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'featured';

  // Local filter states
  const [filters, setFilters] = useState({
    category: categoryParam,
    minPrice: 0,
    maxPrice: 10000000,
    materials: [],
    occasions: [],
  });

  const [sortBy, setSortBy] = useState(sortParam);

  // Fetch categories once
  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        if (res?.data?.categories) setCategories(res.data.categories);
      })
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  // Listen for open-shop-filters triggered from mobile sidebar
  useEffect(() => {
    const handleOpenFilters = () => setIsMobileFiltersOpen(true);
    window.addEventListener('open-shop-filters', handleOpenFilters);
    return () => window.removeEventListener('open-shop-filters', handleOpenFilters);
  }, []);

  // Fetch real products from MySQL backend whenever filters change
  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        const activeCat = filters.category || categoryParam;
        if (activeCat) queryParams.set('category', activeCat);
        if (searchParam) queryParams.set('search', searchParam);
        if (filters.minPrice > 0) queryParams.set('minPrice', filters.minPrice);
        if (filters.maxPrice < 10000000) queryParams.set('maxPrice', filters.maxPrice);
        if (sortBy) queryParams.set('sort', sortBy);

        const res = await api.get(`/products?${queryParams.toString()}`);
        if (res?.data?.products) {
          let items = res.data.products;
          if (filters.materials.length > 0) {
            items = items.filter((p) => filters.materials.includes(p.material));
          }
          if (filters.occasions.length > 0) {
            items = items.filter((p) => filters.occasions.includes(p.occasion));
          }
          setProducts(items);
        }
      } catch (err) {
        console.error('Error querying products from database:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [filters, categoryParam, searchParam, sortBy]);

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    if (key === 'category') {
      if (value) {
        searchParams.set('category', value);
      } else {
        searchParams.delete('category');
      }
      setSearchParams(searchParams);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      category: '',
      minPrice: 0,
      maxPrice: 10000000,
      materials: [],
      occasions: [],
    });
    searchParams.delete('category');
    searchParams.delete('search');
    setSearchParams(searchParams);
  };

  const activeCategory = categories.find((c) => c.slug === (filters.category || categoryParam));

  return (
    <div className="shop-page">
      {/* 1. Breadcrumbs Path (Extreme left & top right below navbar) */}
      <div className="shop-header">
        <div className="shop-full-container shop-header-content">
          <nav className="shop-breadcrumb-text" aria-label="Breadcrumb">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <Link to="/shop" className="breadcrumb-link">Catalogue</Link>
            {activeCategory && (
              <>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{activeCategory.name}</span>
              </>
            )}
            {searchParam && (
              <>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">Search: "{searchParam}"</span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* 2. Main Content Layout (Extreme left & top) */}
      <div className="shop-full-container shop-body">
        {/* Mobile Filter Toggle */}
        <div className="shop-mobile-controls">
          <button
            className="mobile-filter-trigger"
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>
        </div>

        {/* Sidebar Filters (Desktop) */}
        <FilterSidebar
          filters={filters}
          categories={categories}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Mobile Filter Modal */}
        {isMobileFiltersOpen && (
          <div
            className="mobile-filter-modal-overlay"
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            <FilterSidebar
              filters={filters}
              categories={categories}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              isMobile={true}
              onCloseMobile={() => setIsMobileFiltersOpen(false)}
            />
          </div>
        )}

        {/* Main Catalogue Column */}
        <div className="shop-catalogue-column">
          {/* Top Bar with Count & Sort */}
          <div className="catalogue-top-bar">
            <span className="catalogue-item-count">
              Showing <strong>{products.length}</strong> Products
            </span>

            <div className="catalogue-sort-wrap">
              <label htmlFor="sort-select" className="sort-label">Sort By:</label>
              <select
                id="sort-select"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Active Filter Tags */}
          {(filters.materials.length > 0 || filters.occasions.length > 0 || filters.minPrice > 0 || searchParam) && (
            <div className="active-filter-chips">
              {searchParam && (
                <span className="filter-chip">
                  Query: {searchParam}
                  <X
                    size={14}
                    onClick={() => {
                      searchParams.delete('search');
                      setSearchParams(searchParams);
                    }}
                  />
                </span>
              )}
              {filters.materials.map((mat) => (
                <span key={mat} className="filter-chip">
                  {mat}
                  <X
                    size={14}
                    onClick={() =>
                      handleFilterChange(
                        'materials',
                        filters.materials.filter((m) => m !== mat)
                      )
                    }
                  />
                </span>
              ))}
              {filters.occasions.map((occ) => (
                <span key={occ} className="filter-chip">
                  {occ}
                  <X
                    size={14}
                    onClick={() =>
                      handleFilterChange(
                        'occasions',
                        filters.occasions.filter((o) => o !== occ)
                      )
                    }
                  />
                </span>
              ))}
              <button className="clear-all-chips-btn" onClick={handleResetFilters}>
                Clear All
              </button>
            </div>
          )}

          {/* Product Grid */}
          <ProductGrid products={products} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
