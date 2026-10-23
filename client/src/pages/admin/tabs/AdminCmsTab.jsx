import React, { useState, useEffect } from 'react';
import { FileText, Edit2, CheckCircle, ExternalLink } from 'lucide-react';
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

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>CMS Pages & Policy Manager</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Dynamically edit policy content and static pages (<code>cms_pages</code> table) without touching codebase.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {pages.map((page) => (
          <div
            key={page.id}
            style={{
              background: '#FFF',
              borderRadius: '10px',
              border: '1px solid #ECECEC',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#D4AF37', fontWeight: 600, textTransform: 'uppercase' }}>
                  /{page.slug}
                </span>
                <a
                  href={`/pages/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.8rem', textDecoration: 'none' }}
                >
                  <ExternalLink size={13} /> View
                </a>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#1F1F1F' }}>{page.title}</h3>
              <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem' }}>
                {page.seo_description || 'Live published boutique page.'}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={Edit2}
              style={{ width: '100%' }}
              onClick={() => handleOpenEdit(page)}
            >
              Edit Page Content
            </Button>
          </div>
        ))}
      </div>

      {/* CMS Edit Modal */}
      {editingPage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '720px', padding: '28px', maxHeight: '88vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem' }}>Edit CMS Page: {editingPage.title}</h3>
            <p style={{ margin: '0 0 20px', color: '#666', fontSize: '0.85rem' }}>
              Changes to this content will immediately update <code>/pages/{editingPage.slug}</code> on the storefront.
            </p>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Page Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>URL Slug</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>SEO Meta Description</label>
                <input
                  type="text"
                  placeholder="Summary for Google and search engines..."
                  value={form.seo_description}
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Page Content (HTML supported)</label>
                <textarea
                  rows={10}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #CCC', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => setEditingPage(null)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit" disabled={saving}>
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
