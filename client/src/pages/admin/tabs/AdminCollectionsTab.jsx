import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Gem, Package, Link2, CheckCircle } from 'lucide-react';
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

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete collection "${name}"? Products will remain in catalog unlinked.`)) return;
    try {
      await api.delete(`/collections/admin/${id}`);
      onNotify?.('Collection deleted from database', 'success');
      loadCollections();
    } catch (err) {
      onNotify?.(err.message || 'Failed to delete collection', 'error');
    }
  };

  // Add Product to collection_products table (Item #6)
  const handleAddProductToCollection = async () => {
    if (!selectedProductIdToAdd || !selectedColForProducts) return;
    try {
      await api.post(`/collections/admin/${selectedColForProducts.id}/products`, {
        productId: selectedProductIdToAdd,
      });
      onNotify?.('Product mapped to collection successfully!', 'success');
      setSelectedProductIdToAdd('');
      // Refresh current collection detail
      const res = await api.get(`/collections/${selectedColForProducts.slug}`);
      if (res?.data?.collection) {
        setSelectedColForProducts(res.data.collection);
      }
      loadCollections();
    } catch (err) {
      onNotify?.(err.message || 'Failed to map product', 'error');
    }
  };

  // Remove Product from collection_products table
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

  return (
    <div className="admin-tab-pane">
      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="panel-heading" style={{ margin: 0 }}>Collections & Suite Curator</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Manage royal heritage collections (collections table) and curate product memberships (collection_products table).
          </p>
        </div>
        <Button variant="gold" size="sm" icon={Plus} onClick={handleOpenCreate}>
          Create Collection
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {collections.map((c) => (
          <div
            key={c.id}
            style={{
              background: '#FFF',
              borderRadius: '10px',
              border: '1px solid #EBEBEB',
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ position: 'relative', height: '160px' }}>
              <img
                src={c.hero_image_url || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'}
                alt={c.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: '#D4AF37', padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
                {c.product_count || 0} Products
              </div>
            </div>

            <div style={{ padding: '18px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: '#1F1F1F' }}>{c.name}</h3>
              <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem', lineHeight: '1.5', flexGrow: 1 }}>
                {c.description || 'Curated royal suite'}
              </p>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F0F0F0', paddingTop: '14px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Package}
                  style={{ flexGrow: 1, fontSize: '0.8rem' }}
                  onClick={() => openProductMappingModal(c)}
                >
                  Manage Products
                </Button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(c)}
                  style={{ background: 'none', border: '1px solid #CCC', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}
                  title="Edit collection"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id, c.name)}
                  style={{ background: 'none', border: '1px solid #FFCDD2', borderRadius: '4px', padding: '6px 10px', color: '#C62828', cursor: 'pointer' }}
                  title="Delete collection"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Collection Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>
              {editingCollection ? 'Edit Collection' : 'Create Curated Collection'}
            </h3>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Collection Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Temple Treasures of Madurai"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>URL Slug</label>
                <input
                  type="text"
                  placeholder="temple-treasures"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Hero Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={form.hero_image_url}
                  onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Description / Lore</label>
                <textarea
                  rows={3}
                  placeholder="Describe the royal heritage inspiration and craftsmanship..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit">
                  {editingCollection ? 'Update Collection' : 'Create Collection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Membership Mapping Modal (Item #6: collection_products) */}
      {selectedColForProducts && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#FFF', borderRadius: '12px', width: '100%', maxWidth: '620px', padding: '24px', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>
              Products in "{selectedColForProducts.name}"
            </h3>
            <p style={{ margin: '0 0 16px', color: '#666', fontSize: '0.85rem' }}>
              Add or remove products mapped to this collection via <code>collection_products</code> table.
            </p>

            {/* Add product select */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#F8F8F8', padding: '14px', borderRadius: '8px' }}>
              <select
                value={selectedProductIdToAdd}
                onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
                style={{ flexGrow: 1, padding: '9px 12px', borderRadius: '6px', border: '1px solid #CCC' }}
              >
                <option value="">Select a product from catalogue to add...</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.selling_price})
                  </option>
                ))}
              </select>
              <Button variant="gold" size="sm" icon={Plus} onClick={handleAddProductToCollection} disabled={!selectedProductIdToAdd}>
                Map to Collection
              </Button>
            </div>

            {/* List of currently mapped products */}
            <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem' }}>Currently Mapped Designs:</h4>
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
                      border: '1px solid #EEE',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {cp.primary_image && (
                        <img src={cp.primary_image} alt={cp.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{cp.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#666' }}>₹{cp.selling_price}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProductFromCollection(cp.id)}
                      style={{ background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic', padding: '16px 0' }}>
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
    </div>
  );
}
