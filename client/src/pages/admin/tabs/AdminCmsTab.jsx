import React, { useState, useEffect } from 'react';
import { FileText, Edit2, ExternalLink, Search, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminCmsTab({ onNotify }) {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    seo_title: '',
    seo_description: '',
  });
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const loadCmsPages = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/cms/admin/all');
      if (res?.data?.pages) {
        setPages(res.data.pages);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load CMS pages', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCmsPages();
  }, []);

  const handleOpenEdit = (p) => {
    setEditingPage(p);
    setForm({
      title: p.title,
      slug: p.slug,
      content: p.content,
      seo_title: p.seo_title || '',
      seo_description: p.seo_description || '',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingPage) return;
    setSaving(true);

    try {
      await api.put(`/cms/admin/${editingPage.id}`, form);
      onNotify?.(`CMS page "${form.title}" updated and published!`, 'success');
      setEditingPage(null);
      loadCmsPages();
    } catch (err) {
      onNotify?.(err.message || 'Failed to save page', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredPages = pages.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.title?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.seo_description?.toLowerCase().includes(q) ||
      p.content?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-tab-content">
      <div className="admin-table-card">
        <div className="table-card-header">
          <div>
            <h3>CMS Pages & Policy Manager</h3>
            <p className="table-card-sub">
              Manage dynamic brand policies, terms, shipping guides, and institutional boutique pages.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="admin-filter-bar">
          <div className="admin-search-input-wrap">
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by page title, URL slug or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              className="admin-filter-reset"
              onClick={() => setSearchQuery('')}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}

          <span className="admin-filter-count">
            Showing {filteredPages.length} of {pages.length}
          </span>
        </div>

        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Page Title & URL</th>
                <th>SEO Meta Summary</th>
                <th>Content Length</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                    {isLoading ? 'Loading CMS pages...' : 'No CMS pages match your search.'}
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr key={page.id}>
                    <td>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--color-charcoal, #1a1a1a)' }}>
                        {page.title}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-maroon, #6B1E2C)', fontFamily: 'monospace', marginTop: '2px' }}>
                        /pages/{page.slug}
                      </span>
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--grey-600, #666)' }}>
                        {page.seo_description || 'Live published storefront page.'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-count">
                        {(page.content || '').length} characters
                      </span>
                    </td>
                    <td style={{ color: '#888', fontSize: '0.84rem' }}>
                      {page.updated_at ? new Date(page.updated_at).toLocaleDateString('en-IN') : 'Live'}
                    </td>
                    <td className="actions-cell" style={{ textAlign: 'right' }}>
                      <a
                        href={`/pages/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-edit"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ExternalLink size={13} /> View
                      </a>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleOpenEdit(page)}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CMS Edit Modal */}
      {editingPage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '10px', width: '100%', maxWidth: '720px', padding: '28px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontFamily: 'var(--font-heading, serif)' }}>
              Edit CMS Page: {editingPage.title}
            </h3>
            <p className="table-card-sub" style={{ marginBottom: '16px' }}>
              Changes to this page will update <code>/pages/{editingPage.slug}</code> instantly across the storefront.
            </p>

            <form onSubmit={handleSave}>
              <div className="form-grid" style={{ marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Page Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>URL Slug</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>SEO Meta Summary Description</label>
                <input
                  type="text"
                  placeholder="Summary for Google and search engines..."
                  value={form.seo_description}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Page Content (HTML Supported)</label>
                <textarea
                  rows={10}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--grey-300, #ccc)', fontFamily: 'monospace', fontSize: '0.86rem', lineHeight: '1.5' }}
                />
              </div>

              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setEditingPage(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={saving}>
                  {saving ? 'Publishing...' : 'Save & Publish Page'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
