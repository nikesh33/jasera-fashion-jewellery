import React, { useState } from 'react';
import { X, RotateCcw, ChevronDown } from 'lucide-react';
import './FilterSidebar.css';

export function FilterSidebar({
  filters,
  categories = [],
  onFilterChange,
  onReset,
  isMobile = false,
  onCloseMobile,
}) {
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    materials: false,
    occasions: false,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const priceRanges = [
    { label: 'All Prices', min: 0, max: 100000 },
    { label: 'Under ₹499', min: 0, max: 499 },
    { label: '₹499 - ₹799', min: 499, max: 799 },
    { label: '₹799 - ₹1,299', min: 799, max: 1299 },
    { label: 'Above ₹1,299', min: 1299, max: 100000 },
  ];

  const materials = [
    'Oxidised German Silver',
    'Gold Plated Brass & Enamel',
    'Anti-Tarnish 18K PVD Steel',
    'Micro-Kundan & Brass',
    'Dual-Tone Brass',
    'Antique Oxidised Alloy',
  ];

  const occasions = [
    'Everyday Chic',
    'College & Casual',
    'Festive Occasion',
    'Wedding & Sangeet',
    'Party & Cocktail',
  ];

  return (
    <aside className={`filter-sidebar ${isMobile ? 'filter-sidebar-mobile' : ''}`}>
      <div className="filter-sidebar-header">
        <h3 className="filter-title">Filters</h3>
        <div className="filter-header-actions">
          <button className="filter-reset-btn" onClick={onReset} title="Clear all filters">
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          {isMobile && (
            <button className="filter-close-btn" onClick={onCloseMobile} aria-label="Close filters">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 1. Category Filter */}
      <div className="filter-group">
        <button
          type="button"
          className="filter-group-header"
          onClick={() => toggleSection('categories')}
          aria-expanded={openSections.categories}
        >
          <span className="filter-group-title">Categories</span>
          <ChevronDown
            size={15}
            className={`filter-chevron ${openSections.categories ? 'is-rotated' : ''}`}
          />
        </button>

        {openSections.categories && (
          <div className="filter-options-list">
            <label className="filter-radio-item">
              <input
                type="radio"
                name="category"
                checked={(filters.category || '') === ''}
                onChange={() => onFilterChange('category', '')}
              />
              <span className="filter-label-text">All Categories</span>
            </label>
            {categories.map((cat) => (
              <label key={cat.id} className="filter-radio-item">
                <input
                  type="radio"
                  name="category"
                  checked={(filters.category || '') === cat.slug}
                  onChange={() => onFilterChange('category', cat.slug)}
                />
                <span className="filter-label-text">{cat.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 2. Price Filter */}
      <div className="filter-group">
        <button
          type="button"
          className="filter-group-header"
          onClick={() => toggleSection('price')}
          aria-expanded={openSections.price}
        >
          <span className="filter-group-title">Price</span>
          <ChevronDown
            size={15}
            className={`filter-chevron ${openSections.price ? 'is-rotated' : ''}`}
          />
        </button>

        {openSections.price && (
          <div className="filter-options-list">
            {priceRanges.map((range, idx) => (
              <label key={idx} className="filter-radio-item">
                <input
                  type="radio"
                  name="priceRange"
                  checked={filters.minPrice === range.min && filters.maxPrice === range.max}
                  onChange={() => {
                    onFilterChange('minPrice', range.min);
                    onFilterChange('maxPrice', range.max);
                  }}
                />
                <span className="filter-label-text">{range.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 3. Material Filter */}
      <div className="filter-group">
        <button
          type="button"
          className="filter-group-header"
          onClick={() => toggleSection('materials')}
          aria-expanded={openSections.materials}
        >
          <span className="filter-group-title">
            Material
            {(filters.materials || []).length > 0 && (
              <span className="filter-active-count">({filters.materials.length})</span>
            )}
          </span>
          <ChevronDown
            size={15}
            className={`filter-chevron ${openSections.materials ? 'is-rotated' : ''}`}
          />
        </button>

        {openSections.materials && (
          <div className="filter-options-list">
            {materials.map((mat) => (
              <label key={mat} className="filter-checkbox-item">
                <input
                  type="checkbox"
                  checked={(filters.materials || []).includes(mat)}
                  onChange={(e) => {
                    const current = filters.materials || [];
                    const updated = e.target.checked
                      ? [...current, mat]
                      : current.filter((m) => m !== mat);
                    onFilterChange('materials', updated);
                  }}
                />
                <span className="filter-label-text">{mat}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 4. Occasion Filter */}
      <div className="filter-group">
        <button
          type="button"
          className="filter-group-header"
          onClick={() => toggleSection('occasions')}
          aria-expanded={openSections.occasions}
        >
          <span className="filter-group-title">
            Occasion
            {(filters.occasions || []).length > 0 && (
              <span className="filter-active-count">({filters.occasions.length})</span>
            )}
          </span>
          <ChevronDown
            size={15}
            className={`filter-chevron ${openSections.occasions ? 'is-rotated' : ''}`}
          />
        </button>

        {openSections.occasions && (
          <div className="filter-options-list">
            {occasions.map((occ) => (
              <label key={occ} className="filter-checkbox-item">
                <input
                  type="checkbox"
                  checked={(filters.occasions || []).includes(occ)}
                  onChange={(e) => {
                    const current = filters.occasions || [];
                    const updated = e.target.checked
                      ? [...current, occ]
                      : current.filter((o) => o !== occ);
                    onFilterChange('occasions', updated);
                  }}
                />
                <span className="filter-label-text">{occ}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
