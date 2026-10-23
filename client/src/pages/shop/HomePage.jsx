import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Star,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  Gem,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProductCard } from '../../components/shop/ProductCard';
import { api } from '../../lib/api';
import './HomePage.css';

export function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [collections, setCollections] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const slideTimerRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes, bannerRes, collRes, revRes] = await Promise.allSettled([
          api.get('/categories'),
          api.get('/products?limit=8'),
          api.get('/banners?position=hero'),
          api.get('/collections'),
          api.get('/reviews?limit=3'),
        ]);

        if (catRes.status === 'fulfilled' && catRes.value?.data?.categories) {
          setCategories(catRes.value.data.categories);
        }
        if (prodRes.status === 'fulfilled' && prodRes.value?.data?.products) {
          setFeaturedProducts(prodRes.value.data.products);
        }
        if (bannerRes.status === 'fulfilled' && bannerRes.value?.data?.banners?.length > 0) {
          setBanners(bannerRes.value.data.banners);
        }
        if (collRes.status === 'fulfilled' && collRes.value?.data?.collections) {
          setCollections(collRes.value.data.collections);
        }
        if (revRes.status === 'fulfilled' && revRes.value?.data?.reviews?.length > 0) {
          setReviews(revRes.value.data.reviews);
        }
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-play Banner Carousel
  useEffect(() => {
    if (banners.length <= 1) return;

    slideTimerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5500);

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [banners.length]);

  const handlePrevSlide = () => {
    if (banners.length <= 1) return;
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (banners.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const activeBanner = banners[currentSlide] || {
    title: 'Statement Bracelet Collection',
    subtitle: 'Traditional Charm with a Modern Touch — Beautifully Handcrafted by Jassera.',
    imageUrl: '/images/jassera-hero-banner.jpg',
    linkUrl: '/shop',
  };

  return (
    <div className="home-page">
      {/* 1. Multi-Banner Carousel (Database Driven) */}
      <section
        className="hero-section hero-carousel-container"
        onMouseEnter={() => slideTimerRef.current && clearInterval(slideTimerRef.current)}
        onMouseLeave={() => {
          if (banners.length > 1) {
            slideTimerRef.current = setInterval(() => {
              setCurrentSlide((prev) => (prev + 1) % banners.length);
            }, 5500);
          }
        }}
      >
        {banners.length > 0 ? (
          banners.map((b, idx) => (
            <div
              key={b.id || idx}
              className={`hero-slide ${idx === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: `url(${b.imageUrl || b.image_url})`,
              }}
            >
              <div className="hero-overlay" />
              <div className="container hero-content">
                <span className="hero-eyebrow">
                  AESTHETIC JEWELLERY
                </span>
                <h1 className="hero-title">{b.title}</h1>
                <p className="hero-subtitle">{b.subtitle}</p>
                <div className="hero-actions">
                  <Button
                    variant="gold"
                    size="lg"
                    icon={ArrowRight}
                    onClick={() => navigate(b.linkUrl || b.link_url || '/shop')}
                  >
                    Shop Collection
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="hero-secondary-btn"
                    onClick={() => navigate('/shop?category=jhumkas')}
                  >
                    Explore Best Sellers
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            className="hero-slide active"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=85')`,
            }}
          >
            <div className="hero-overlay" />
            <div className="container hero-content">
              <span className="hero-eyebrow">
                AESTHETIC JEWELLERY
              </span>
              <h1 className="hero-title">Trendy Handcrafted Jewellery For Every Aesthetic</h1>
              <p className="hero-subtitle">
                From viral Instagram jhumkas & oxidised silver to anti-tarnish waterproof daily wear jewellery crafted to turn heads.
              </p>
              <div className="hero-actions">
                <Button variant="gold" size="lg" icon={ArrowRight} onClick={() => navigate('/shop')}>
                  Shop Trending Drops
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Carousel Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              className="hero-carousel-arrow hero-arrow-left"
              onClick={handlePrevSlide}
              aria-label="Previous Banner"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              className="hero-carousel-arrow hero-arrow-right"
              onClick={handleNextSlide}
              aria-label="Next Banner"
            >
              <ChevronRight size={24} />
            </button>

            {/* Carousel Dot Indicators */}
            <div className="hero-carousel-dots">
              {banners.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  className={`hero-dot ${dotIdx === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(dotIdx)}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 2. Value Proposition Strip */}
      <section className="value-strip">
        <div className="container value-strip-grid">
          <div className="value-pill">
            <ShieldCheck className="value-icon" size={24} />
            <div>
              <strong>Waterproof</strong>
              <span>Long-lasting everyday finish</span>
            </div>
          </div>
          <div className="value-pill">
            <PackageCheck className="value-icon" size={24} />
            <div>
              <strong>Pan-India Delivery</strong>
              <span>Live tracking right to your doorstep</span>
            </div>
          </div>
          <div className="value-pill">
            <HeartHandshake className="value-icon" size={24} />
            <div>
              <strong>100% Skin-Friendly</strong>
              <span>Lead and nickel free hypoallergenic</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Showcase (Database Driven) */}
      <section className="section-categories">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow"></span>
            <h2 className="section-title">Shop By Category</h2>
            {/* <p style={{ color: 'var(--grey-600)', fontSize: '0.95rem', marginTop: '6px' }}>
              Explore our collections.
            </p> */}
            <div className="ornament-divider">
              <span className="ornament-line" />
              <span className="ornament-diamond">◆</span>
              <span className="ornament-line" />
            </div>
          </div>

          <div className="category-grid">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="category-card">
                <div className="category-img-wrap">
                  <img
                    src={cat.image_url || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80'}
                    alt={cat.name}
                    className="category-img"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80';
                    }}
                  />
                  <div className="category-overlay">
                    <span className="category-view-text">
                      Explore {cat.name} <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
                <div className="category-meta">
                  <h3 className="category-name">{cat.name}</h3>
                  <span className="category-count">{cat.item_count || 0} Designs</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Curated Collections Section (collections & collection_products) */}
      {collections.length > 0 && (
        <section className="section-collections-hub">
          <div className="container">
            <div className="section-header text-center">
              <span className="section-eyebrow">ROYAL HERITAGE CURATIONS</span>
              <h2 className="section-title">Exclusive Collections</h2>
              <p style={{ color: 'var(--grey-600)', fontSize: '0.95rem', marginTop: '6px' }}>
                Handpicked suites themed after India's historic palaces and regal dynasties.
              </p>
              <div className="ornament-divider">
                <span className="ornament-line" />
                <span className="ornament-diamond">◆</span>
                <span className="ornament-line" />
              </div>
            </div>

            <div className="collections-curated-grid">
              {collections.map((col) => (
                <div key={col.id} className="collection-curated-card">
                  <div className="collection-card-image-wrap">
                    <img
                      src={col.hero_image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'}
                      alt={col.name}
                      className="collection-card-img"
                    />
                    <div className="collection-card-gradient" />
                    <div className="collection-card-badge">
                      <Gem size={14} /> Curated Suite
                    </div>
                  </div>
                  <div className="collection-card-body">
                    <h3 className="collection-card-title">{col.name}</h3>
                    <p className="collection-card-desc">{col.description}</p>
                    <Link to={`/shop?collection=${col.slug}`} className="collection-card-cta">
                      View Collection <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Featured Products (Trending Drops) */}
      <section className="section-featured">
        <div className="container">
          <div className="section-header-flex">
            <div>
              <span className="section-eyebrow">VIRAL PICKS</span>
              <h2 className="section-title">Trending On Instagram</h2>
            </div>
            <Link to="/shop" className="view-all-link">
              View All Catalogue <ArrowRight size={16} />
            </Link>
          </div>

          <div className="products-grid-container">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. The Boutique Story Banner */}
      <section className="heritage-story-banner">
        <div className="container heritage-story-grid">
          <div className="heritage-image-wrapper">
            <img
              src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80"
              alt="Handcrafted boutique jewellery"
              className="heritage-main-img"
            />
            <div className="heritage-floating-badge">
              <span className="badge-years">100%</span>
              <span className="badge-caption">Handcrafted With Love</span>
            </div>
          </div>

          <div className="heritage-text-content">
            <span className="section-eyebrow">HANDCRAFTED WITH CARE</span>
            <h2 className="heritage-title">The Art of Statement Jewellery</h2>
            <p className="heritage-desc">
              At Jassera, we believe beautiful jewellery shouldn't cost a fortune. Every jhumka, statement earring, and choker is curated to take you effortlessly from college campuses and office desks to festive weddings and weekend dates.
            </p>
            <div className="heritage-points">
              <div className="point-item">
                <span className="point-bullet">✓</span>
                <span>Lightweight oxidised silver jhumkas with comfortable ear hooks</span>
              </div>
              <div className="point-item">
                <span className="point-bullet">✓</span>
                <span>Anti-tarnish, water-resistant daily wear stainless steel & brass</span>
              </div>
              <div className="point-item">
                <span className="point-bullet">✓</span>
                <span>Pocket-friendly luxury designed for aesthetic Instagram unboxings</span>
              </div>
            </div>
            <Button variant="primary" size="md" icon={ArrowRight} onClick={() => navigate('/shop')}>
              Shop All Jewellery
            </Button>
          </div>
        </div>
      </section>

      {/* 7. Customer Testimonials (Dynamic reviews integration) */}
      <section className="section-testimonials">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">LOVED BY INSTAGRAM COMMUNITY</span>
            <h2 className="section-title">Reviews</h2>
          </div>

          <div className="testimonials-grid">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev.id} className="testimonial-card">
                  <div className="rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < rev.rating ? 'var(--color-antique-gold)' : 'none'}
                        color="var(--color-antique-gold)"
                      />
                    ))}
                  </div>
                  {rev.title && <strong style={{ display: 'block', margin: '8px 0 4px', fontSize: '1rem' }}>{rev.title}</strong>}
                  <p className="testimonial-quote">“{rev.body}”</p>
                  <div className="testimonial-author">
                    <strong>{rev.customer_name || 'Verified Patron'}</strong>
                    <span>{rev.product_name ? `${rev.product_name} • ` : ''}Verified Buyer</span>
                  </div>
                </div>
              ))
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
