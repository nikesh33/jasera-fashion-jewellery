import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, HeartHandshake, Star, PackageCheck, Zap, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProductCard } from '../../components/shop/ProductCard';
import { api } from '../../lib/api';
import './HomePage.css';

export function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes, bannerRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products?limit=8'),
          api.get('/banners').catch(() => null),
        ]);
        if (catRes?.data?.categories) setCategories(catRes.data.categories);
        if (prodRes?.data?.products) setFeaturedProducts(prodRes.data.products);
        if (bannerRes?.data?.banners) setBanners(bannerRes.data.banners);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const heroBanners = banners.filter((b) => b.position === 'hero');
  const promoBanner = banners.find((b) => b.position === 'promo' || b.position === 'feature');

  // Auto-rotate hero banners if more than 1 exist
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  const currentHero = heroBanners[heroIndex] || heroBanners[0] || {
    title: 'STATEMENT BRACELET',
    subtitle: 'Traditional Charm with a Modern Touch',
    imageUrl: '/images/jassera-hero-banner.jpg',
    linkUrl: '/shop',
  };

  return (
    <div className="home-page">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-eyebrow">
              <Sparkles size={16} /> AESTHETIC JEWELLERY • SIGNATURE DROPS
            </span>
            <h1 className="hero-title">
              Trendy Handcrafted Jewellery For Every Aesthetic
            </h1>
            <p className="hero-subtitle">
              From viral Instagram statement bracelets & jhumkas to anti-tarnish waterproof daily wear jewellery crafted to turn heads.
            </p>

            {/* Quality Feature Chips matching the Statement Bracelet poster */}
            <div className="hero-feature-chips">
              <span className="hero-chip">Elegant Design</span>
              <span className="hero-chip">Lightweight & Comfortable</span>
              <span className="hero-chip">Premium Quality Beads</span>
              <span className="hero-chip">Perfect for Every Occasion</span>
            </div>

            <div className="hero-actions">
              <Button
                variant="gold"
                size="lg"
                icon={ArrowRight}
                onClick={() => navigate('/shop')}
              >
                Shop Trending Drops
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="hero-secondary-btn"
                onClick={() => navigate('/shop')}
              >
                Explore Statement Pieces
              </Button>
            </div>
          </div>

          {/* Model Visual Showcase Card */}
          <div className="hero-visual-col">
            <div
              className="hero-visual-card"
              style={{ cursor: currentHero.linkUrl ? 'pointer' : 'default', position: 'relative' }}
              onClick={() => {
                if (currentHero.linkUrl) navigate(currentHero.linkUrl);
              }}
            >
              <img
                src={currentHero.imageUrl || '/images/jassera-hero-banner.jpg'}
                alt={currentHero.title || 'Jassera Jewellery'}
                className="hero-model-img"
              />
              <div className="hero-floating-glass-badge">
                <span className="glass-badge-tag">{currentHero.title || 'STATEMENT BRACELET'}</span>
                <span className="glass-badge-subtitle">
                  {currentHero.subtitle || 'Traditional Charm with a Modern Touch'}
                </span>
              </div>

              {/* Dots indicator when multiple hero banners are in database */}
              {heroBanners.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 10,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {heroBanners.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Slide ${idx + 1}`}
                      onClick={() => setHeroIndex(idx)}
                      style={{
                        width: heroIndex === idx ? '22px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: heroIndex === idx ? 'var(--color-antique-gold, #dfb972)' : 'rgba(255,255,255,0.6)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Value Proposition Strip */}
      <section className="value-strip">
        <div className="container value-strip-grid">
          <div className="value-pill">
            <ShieldCheck className="value-icon" size={24} />
            <div>
              <strong>Anti-Tarnish & Waterproof</strong>
              <span>Long-lasting everyday finish</span>
            </div>
          </div>
          <div className="value-pill">
            <PackageCheck className="value-icon" size={24} />
            <div>
              <strong>Pan-India Express Delivery</strong>
              <span>Live tracking right to your doorstep</span>
            </div>
          </div>
          <div className="value-pill">
            <HeartHandshake className="value-icon" size={24} />
            <div>
              <strong>100% Skin-Friendly</strong>
              <span>Lead & nickel free hypoallergenic</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Showcase (100% Database Driven) */}
      <section className="section-categories">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">CURATED SILHOUETTES</span>
            <h2 className="section-title">Shop By Category</h2>
            <p style={{ color: 'var(--grey-600)', fontSize: '0.95rem', marginTop: '6px' }}>
              Explore our handcrafted collections updated live from the boutique catalogue.
            </p>
            <div className="ornament-divider">
              <span className="ornament-line" />
              <span className="ornament-diamond">◆</span>
              <span className="ornament-line" />
            </div>
          </div>

          <div className="category-grid">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="category-card"
              >
                <div className="category-img-wrap">
                  <img
                    src={cat.image_url || 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80'}
                    alt={cat.name}
                    loading="lazy"
                  />
                  <div className="category-overlay" />
                </div>
                <div className="category-info">
                  <h3 className="category-title">{cat.name}</h3>
                  <span className="category-count">{cat.item_count || 1} Designs</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Featured Products (Trending On Instagram) */}
      <section className="section-featured">
        <div className="container">
          <div className="section-header-flex">
            <div>
              <span className="section-eyebrow">VIRAL PICKS</span>
              <h2 className="section-title">Trending On Instagram</h2>
            </div>
            <Link to="/shop" className="view-all-link">
              View Collections <ArrowRight size={16} />
            </Link>
          </div>

          <div className="products-grid-container">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. The Boutique Story Banner */}
      <section className="heritage-story-banner">
        <div className="container heritage-story-grid">
          <div className="heritage-image-wrapper">
            <img
              src={promoBanner?.imageUrl || "/images/jassera-logo.jpg"}
              alt={promoBanner?.title || "Jassera Jewellery & Accessories Emblem"}
              className="heritage-main-img"
              style={{ objectFit: 'contain', padding: '16px', background: '#FFFFFF', borderRadius: '24px' }}
            />
            <div className="heritage-floating-badge">
              <span className="badge-years">100%</span>
              <span className="badge-caption">Little details, big moments</span>
            </div>
          </div>

          <div className="heritage-text-content">
            <span className="section-eyebrow">
              {promoBanner?.title ? promoBanner.title.toUpperCase() : "HANDCRAFTED WITH CARE"}
            </span>
            <h2 className="heritage-title">
              {promoBanner?.subtitle || "The Art of Statement Jewellery"}
            </h2>
            <p className="heritage-desc">
              At Jassera, we believe beautiful jewellery shouldn't cost a fortune. Every statement bracelet, jhumka, earring, and choker is curated to take you effortlessly from college campuses and office desks to festive weddings and weekend dates.
            </p>
            <div className="heritage-points">
              <div className="point-item">
                <span className="point-bullet"><Check size={14} /></span>
                <span>Lightweight oxidised silver jhumkas with comfortable ear hooks</span>
              </div>
              <div className="point-item">
                <span className="point-bullet"><Check size={14} /></span>
                <span>Anti-tarnish, water-resistant daily wear stainless steel & brass</span>
              </div>
              <div className="point-item">
                <span className="point-bullet"><Check size={14} /></span>
                <span>Pocket-friendly luxury designed for aesthetic Instagram unboxings</span>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={() => navigate('/shop')}
            >
              Shop All Jewellery
            </Button>
          </div>
        </div>
      </section>

      {/* 6. Customer Testimonials */}
      <section className="section-testimonials">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">LOVED BY INSTAGRAM COMMUNITY</span>
            <h2 className="section-title">Customer Love & Reviews</h2>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="var(--color-antique-gold)" color="var(--color-antique-gold)" />
                ))}
              </div>
              <p className="testimonial-quote">
                “The Peacock Chandbali Jhumkas are so lightweight and gorgeous! Got so many compliments during college ethnic day. Definitely ordering more!”
              </p>
              <div className="testimonial-author">
                <strong>Aarchana Sharma</strong>
                <span>Mumbai • Verified Buyer</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="var(--color-antique-gold)" color="var(--color-antique-gold)" />
                ))}
              </div>
              <p className="testimonial-quote">
                “Ordered the anti-tarnish clover necklace and it hasn't lost its shine even after wearing it to work every day. The cute packaging made my day!”
              </p>
              <div className="testimonial-author">
                <strong>Ananya Nair</strong>
                <span>Bengaluru • Verified Buyer</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="var(--color-antique-gold)" color="var(--color-antique-gold)" />
                ))}
              </div>
              <p className="testimonial-quote">
                “Discovered this page through Instagram reels and took a chance. Delivered in 3 days with express tracking. The Afghan choker is stunning!”
              </p>
              <div className="testimonial-author">
                <strong>Riya Sen</strong>
                <span>Kolkata • Verified Buyer</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
