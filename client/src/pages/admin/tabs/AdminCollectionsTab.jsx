import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Search, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';

export function AdminCollectionsTab({ onNotify }) {
  const [collections, setCollections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [selectedColForProducts, setSelectedColForProducts] = useState(null);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    hero_image_url: '',
    display_order: 1,
    status: 'active',
  });

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const [colRes, prodRes] = await Promise.allSettled([
        api.get('/collections'),
        api.get('/products?limit=100'),
      ]);
      if (colRes.status === 'fulfilled' && colRes.value?.data?.collections) {
        setCollections(colRes.value.data.collections);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value?.data?.products) {
        setAllProducts(prodRes.value.data.products);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to load collections', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleOpenCreate = () => {
    setEditingCollection(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      hero_image_url: '',
      display_order: collections.length + 1,
      status: 'active',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCollection(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      hero_image_url: c.hero_image_url || '',
      display_order: c.display_order || 1,
      status: c.status || 'active',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      onNotify?.('Collection name is required', 'error');
      return;
    }

    try {
      if (editingCollection) {
        await api.put(`/collections/admin/${editingCollection.id}`, form);
        onNotify?.('Collection updated successfully!', 'success');
      } else {
        await api.post('/collections/admin', form);
        onNotify?.('New collection created in database!', 'success');
      }
      setShowModal(false);
      loadCollections();
    } catch (err) {
      onNotify?.(err.message || 'Failed to save collection', 'error');
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/collections/admin/${deleteConfirm.id}`);
      onNotify?.(`Collection "${deleteConfirm.name}" deleted from database`, 'success');
      setDeleteConfirm(null);
      loadCollections();
    } catch (err) {
      onNotify?.(err.message || 'Failed to delete collection', 'error');
    }
  };

  const handleAddProductToCollection = async () => {
    if (!selectedProductIdToAdd || !selectedColForProducts) return;
    try {
      await api.post(`/collections/admin/${selectedColForProducts.id}/products`, {
        productId: selectedProductIdToAdd,
      });
      onNotify?.('Product mapped to collection successfully!', 'success');
      setSelectedProductIdToAdd('');
      const res = await api.get(`/collections/${selectedColForProducts.slug}`);
      if (res?.data?.collection) {
        setSelectedColForProducts(res.data.collection);
      }
      loadCollections();
    } catch (err) {
      onNotify?.(err.message || 'Failed to map product', 'error');
    }
  };

  const handleRemoveProductFromCollection = async (productId) => {
    if (!selectedColForProducts) return;
    try {
      await api.delete(`/collections/admin/${selectedColForProducts.id}/products/${productId}`);
      onNotify?.('Product removed from collection', 'success');
      const res = await api.get(`/collections/${selectedColForProducts.slug}`);
      if (res?.data?.collection) {
        setSelectedColForProducts(res.data.collection);
      }
      loadCollections();
    } catch (err) {
      onNotify?.(err.message || 'Failed to unmap product', 'error');
    }
  };

  const openProductMappingModal = async (col) => {
    try {
      const res = await api.get(`/collections/${col.slug}`);
      if (res?.data?.collection) {
        setSelectedColForProducts(res.data.collection);
      } else {
        setSelectedColForProducts(col);
      }
    } catch {
      setSelectedColForProducts(col);
    }
  };

  const filteredCollections = collections.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.slug?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' ||
      (c.status || 'active') === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-tab-content">
      <div className="admin-table-card">
        <div className="table-card-header">
          <div>
            <h3>Collections & Suite Curator</h3>
            <p className="table-card-sub">
              Manage royal heritage suites and curate featured catalog product memberships.
            </p>
          </div>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate}>
            Create Collection
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="admin-filter-bar">
          <div className="admin-search-input-wrap">
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by collection name, slug or lore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              className="admin-filter-reset"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}

          <span className="admin-filter-count">
            Showing {filteredCollections.length} of {collections.length}
          </span>
        </div>

        {/* Collections Grid */}
        <div className="admin-grid-cards">
          {filteredCollections.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#888' }}>
              {isLoading ? 'Loading collections...' : 'No collections match your filter criteria.'}
            </div>
          ) : (
            filteredCollections.map((c) => (
              <div key={c.id} className="admin-card-item">
                <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                  <img
                    src={c.hero_image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'}
                    alt={c.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'var(--color-antique-gold, #D4AF37)', padding: '3px 10px', borderRadius: '14px', fontSize: '0.74rem', fontWeight: 600 }}>
                    {c.product_count || 0} Designs
                  </div>
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                    <span
                      className="stock-pill"
                      style={{
                        background: c.status === 'active' ? 'rgba(46,125,50,0.9)' : 'rgba(198,40,40,0.9)',
                        color: '#FFF',
                        fontSize: '0.72rem',
                      }}
                    >
                      {c.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: 'var(--color-charcoal, #1a1a1a)' }}>{c.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'monospace' }}>/{c.slug}</span>
                  </div>
                  <p style={{ margin: '0 0 16px', color: 'var(--grey-600, #666)', fontSize: '0.84rem', lineHeight: '1.5', flexGrow: 1 }}>
                    {c.description || 'Curated royal jewellery suite.'}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--grey-200, #ECECEC)', paddingTop: '12px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Package}
                      style={{ flexGrow: 1, fontSize: '0.78rem' }}
                      onClick={() => openProductMappingModal(c)}
                    >
                      Manage Products
                    </Button>
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => handleOpenEdit(c)}
                      title="Edit collection"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => setDeleteConfirm(c)}
                      title="Delete collection"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Collection Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '10px', width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontFamily: 'var(--font-heading, serif)' }}>
              {editingCollection ? 'Edit Collection' : 'Create Curated Collection'}
            </h3>

            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Collection Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Temple Treasures of Madurai"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>URL Slug</label>
                <input
                  type="text"
                  placeholder="temple-treasures"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Hero Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={form.hero_image_url}
                  onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Description / Lore</label>
                <textarea
                  rows={3}
                  placeholder="Describe royal heritage inspiration and craftsmanship..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid var(--grey-300, #ccc)', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-grid" style={{ marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {editingCollection ? 'Update Collection' : 'Create Collection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Membership Mapping Modal */}
      {selectedColForProducts && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '10px', width: '100%', maxWidth: '620px', padding: '24px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontFamily: 'var(--font-heading, serif)' }}>
              Products in "{selectedColForProducts.name}"
            </h3>
            <p className="table-card-sub" style={{ marginBottom: '16px' }}>
              Add or remove catalog designs mapped to this collection suite.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#F8F8F8', padding: '14px', borderRadius: '6px' }}>
              <select
                value={selectedProductIdToAdd}
                onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
                style={{ flexGrow: 1, padding: '9px 12px', borderRadius: '4px', border: '1px solid var(--grey-300, #ccc)', fontSize: '0.85rem' }}
              >
                <option value="">Select a product from catalogue...</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.selling_price})
                  </option>
                ))}
              </select>
              <Button variant="primary" size="sm" icon={Plus} onClick={handleAddProductToCollection} disabled={!selectedProductIdToAdd}>
                Add
              </Button>
            </div>

            <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: 'var(--color-charcoal, #1a1a1a)' }}>Currently Mapped Designs:</h4>
            {selectedColForProducts.products && selectedColForProducts.products.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedColForProducts.products.map((cp) => (
                  <div
                    key={cp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: '#FFF',
                      border: '1px solid var(--grey-200, #EEE)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {cp.primary_image && (
                        <img src={cp.primary_image} alt={cp.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                      <div>
                        <strong style={{ fontSize: '0.88rem' }}>{cp.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.78rem', color: '#666' }}>₹{cp.selling_price}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleRemoveProductFromCollection(cp.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                No products mapped yet. Select a product above to add to this royal collection.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="primary" size="sm" onClick={() => setSelectedColForProducts(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '10px', width: '100%', maxWidth: '420px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.15rem', color: '#C62828' }}>Delete Collection?</h3>
            <p style={{ margin: '0 0 20px', color: '#666', fontSize: '0.88rem' }}>
              Are you sure you want to delete collection <strong>"{deleteConfirm.name}"</strong>? Products will remain safely in the catalog.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={executeDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
