import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, MessageSquare, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import './CmsPage.css';

/**
 * Format markdown or plain text into clean, structured HTML
 */
function formatCmsContent(raw) {
  if (!raw) return '';

  // Harmonize branding
  let text = raw.replace(/\bJasera\b/g, 'Jassera');

  // If already full HTML blocks, return directly
  if (/<(p|h1|h2|h3|h4|div|ul|ol|table)[\s>]/i.test(text)) {
    return text;
  }

  const lines = text.split('\n');
  const result = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Headers
    if (line.startsWith('### ')) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(`<h2>${formatInline(line.slice(2))}</h2>`);
      continue;
    }

    // Bullet list items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${formatInline(line.slice(2))}</li>`);
      continue;
    }

    // End list if normal line
    if (inList) {
      result.push('</ul>');
      inList = false;
    }

    // Skip empty lines
    if (!line) {
      continue;
    }

    // Regular paragraph
    result.push(`<p>${formatInline(line)}</p>`);
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}

function formatInline(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
}

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
      <div className="cms-page">
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-antique-gold, #c5a059)' }}>Loading boutique policy & information...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="cms-page">
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-maroon, #6B1D2F)' }}>Page Not Found</h2>
          <p style={{ color: '#666', margin: '16px 0 24px' }}>The requested boutique policy or page does not exist.</p>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-maroon, #6B1D2F)',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            <ArrowLeft size={16} /> Return to Storefront Home
          </Link>
        </div>
      </div>
    );
  }

  const formattedHtml = formatCmsContent(page.content);

  return (
    <div className="cms-page">
      {/* 1. Hero Header */}
      <div className="cms-hero">
        <div className="cms-hero-content">
          <span className="cms-eyebrow">
            <Sparkles size={14} /> JASSERA BOUTIQUE
          </span>
          <h1 className="cms-title">{page.title}</h1>
          {page.seo_description && (
            <p className="cms-subtitle">{page.seo_description}</p>
          )}
        </div>
      </div>

      {/* 2. Main Content Card */}
      <div className="cms-main-wrap">
        <div className="cms-card">
          <div
            className="cms-content"
            dangerouslySetInnerHTML={{ __html: formattedHtml }}
          />

          {/* 3. Footer Bar */}
          <div className="cms-footer-bar">
            <Link to="/" className="cms-back-link">
              <ArrowLeft size={16} /> Back to Storefront
            </Link>

            <span className="cms-concierge-note">
              <MessageSquare size={15} /> Questions? Contact{' '}
              <Link to="/contact">Patron Concierge</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
