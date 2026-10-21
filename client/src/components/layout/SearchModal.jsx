import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import './SearchModal.css';

export function SearchModal() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const popularSearches = [
    'Oxidised Jhumkas',
    'Anti-Tarnish Clover',
    'Afghani Mirror Choker',
    'Korean Stud Earrings',
    'Boho Bangles',
    'Statement Rings',
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      closeSearch();
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectKeyword = (keyword) => {
    closeSearch();
    navigate(`/shop?search=${encodeURIComponent(keyword)}`);
  };

  if (!isSearchOpen) return null;

  return (
    <div className="search-overlay" onClick={closeSearch}>
      <div className="search-container" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSearch} className="search-form">
          <Search size={22} className="search-input-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search jhumkas, earrings, anti-tarnish necklaces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="search-close-button"
            onClick={closeSearch}
            aria-label="Close search"
          >
            <X size={22} />
          </button>
        </form>

        <div className="search-recommendations">
          <div className="search-section-header">
            <TrendingUp size={16} />
            <span>Popular Searches</span>
          </div>
          <div className="search-keywords-pills">
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                className="search-pill"
                onClick={() => handleSelectKeyword(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
