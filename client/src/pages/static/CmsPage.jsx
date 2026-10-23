import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import './AboutPage.css';

export function CmsPage({ slugOverride }) {
  const { slug } = useParams();
  const activeSlug = slugOverride || slug;
  const [page, setPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeSlug) return;
    setIsLoading(true);
    setError(null);

    api
      .get(`/cms/${activeSlug}`)
      .then((res) => {
        if (res?.data?.page) {
          setPage(res.data.page);
        } else {
          setError('Page not found');
        }
      })
      .catch((err) => {
        console.error('Failed to load CMS page:', err);
        setError('Page could not be loaded');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeSlug]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-antique-gold, #c5a059)' }}>Loading boutique page...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Page Not Found</h2>
        <p style={{ color: '#666', margin: '16px 0 24px' }}>The requested boutique policy or page does not exist.</p>
        <Link to="/" style={{ color: 'var(--color-antique-gold, #c5a059)', textDecoration: 'underline' }}>
          Return to Storefront Home
        </Link>
      </div>
    );
  }

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container about-hero-content">
          <span className="about-eyebrow">
            <Sparkles size={14} /> JASERA BOUTIQUE
          </span>
          <h1 className="about-title">{page.title}</h1>
          {page.seo_description && <p className="about-subtitle">{page.seo_description}</p>}
        </div>
      </div>

      <div className="container about-section" style={{ maxWidth: '850px', padding: '60px 20px' }}>
        <div
          className="cms-html-content"
          style={{ lineHeight: '1.8', fontSize: '1.05rem', color: '#333333' }}
          dangerouslySetInnerHTML={{ __html: page.content }}
        />

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #EBEBEB' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-burgundy, #5c1a2b)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
