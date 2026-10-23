import { getPool } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';

/**
 * GET /api/collections
 * Public endpoint to list all active collections with assigned product counts
 */
export async function getPublicCollections(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id, c.name, c.slug, c.description, c.hero_image_url,
        COUNT(cp.product_id) as product_count
      FROM collections c
      LEFT JOIN collection_products cp ON cp.collection_id = c.id
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    return res.json({ success: true, data: { collections: rows } });
  } catch (err) {
    console.error('Error fetching collections:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve collections' });
  }
}

/**
 * GET /api/collections/:slug
 * Public endpoint to get a collection and its products
 */
export async function getCollectionBySlug(req, res) {
  const pool = getPool();
  const slug = req.params.slug;

  try {
    const [collRows] = await pool.query(
      `SELECT * FROM collections WHERE slug = ? AND status = 'active' LIMIT 1`,
      [slug]
    );

    if (collRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const collection = collRows[0];

    const [products] = await pool.query(
      `SELECT 
        p.*,
        (SELECT url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as primary_image
       FROM collection_products cp
       JOIN products p ON p.id = cp.product_id
       WHERE cp.collection_id = ? AND p.status = 'active'
       ORDER BY cp.display_order ASC, p.id DESC`,
      [collection.id]
    );

    return res.json({
      success: true,
      data: {
        collection,
        products,
        productCount: products.length,
      },
    });
  } catch (err) {
    console.error('Error fetching collection details:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve collection' });
  }
}

/**
 * GET /api/collections/admin/all
 * Admin endpoint to list all collections with product counts
 */
export async function getAllCollections(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.*,
        COUNT(cp.product_id) as product_count
      FROM collections c
      LEFT JOIN collection_products cp ON cp.collection_id = c.id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);

    return res.json({ success: true, data: { collections: rows } });
  } catch (err) {
    console.error('Admin fetching collections error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch collections' });
  }
}

/**
 * POST /api/collections/admin
 * Admin endpoint to create collection
 */
export async function createCollection(req, res) {
  const pool = getPool();
  const { name, slug, description, hero_image_url, status = 'active' } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: 'Collection name is required' });
  }

  const cleanSlug = (slug || name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

  try {
    const [result] = await pool.query(
      `INSERT INTO collections (name, slug, description, hero_image_url, status, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name.trim(), cleanSlug, description || '', hero_image_url || '', status]
    );

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'create_collection',
      targetType: 'collections',
      targetId: result.insertId,
      afterData: { name, slug: cleanSlug },
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, message: 'Collection created successfully', data: { id: result.insertId } });
  } catch (err) {
    console.error('Error creating collection:', err);
    return res.status(500).json({ success: false, message: 'Failed to create collection' });
  }
}

/**
 * PUT /api/collections/admin/:id
 * Admin endpoint to update collection
 */
export async function updateCollection(req, res) {
  const pool = getPool();
  const id = parseInt(req.params.id, 10);
  const { name, slug, description, hero_image_url, status } = req.body;

  try {
    await pool.query(
      `UPDATE collections SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        hero_image_url = COALESCE(?, hero_image_url),
        status = COALESCE(?, status),
        updated_at = NOW()
       WHERE id = ?`,
      [name || null, slug || null, description !== undefined ? description : null, hero_image_url !== undefined ? hero_image_url : null, status || null, id]
    );

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'update_collection',
      targetType: 'collections',
      targetId: id,
      afterData: req.body,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Collection updated successfully' });
  } catch (err) {
    console.error('Error updating collection:', err);
    return res.status(500).json({ success: false, message: 'Failed to update collection' });
  }
}

/**
 * DELETE /api/collections/admin/:id
 * Admin endpoint to delete collection
 */
export async function deleteCollection(req, res) {
  const pool = getPool();
  const id = parseInt(req.params.id, 10);

  try {
    await pool.query('DELETE FROM collections WHERE id = ?', [id]);
    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'delete_collection',
      targetType: 'collections',
      targetId: id,
      ipAddress: req.ip,
    });
    return res.json({ success: true, message: 'Collection deleted successfully' });
  } catch (err) {
    console.error('Error deleting collection:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete collection' });
  }
}

/**
 * POST /api/collections/admin/:id/products
 * Admin endpoint to assign products to collection
 */
export async function assignProductsToCollection(req, res) {
  const pool = getPool();
  const collectionId = parseInt(req.params.id, 10);
  const productIds = Array.isArray(req.body.productIds) ? req.body.productIds : [req.body.productId];

  try {
    for (const pid of productIds) {
      if (!pid) continue;
      await pool.query(
        `INSERT IGNORE INTO collection_products (collection_id, product_id, display_order)
         VALUES (?, ?, 0)`,
        [collectionId, pid]
      );
    }
    return res.json({ success: true, message: 'Products assigned to collection' });
  } catch (err) {
    console.error('Error assigning products to collection:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign products' });
  }
}

/**
 * DELETE /api/collections/admin/:id/products/:productId
 * Admin endpoint to unassign product from collection
 */
export async function removeProductFromCollection(req, res) {
  const pool = getPool();
  const collectionId = parseInt(req.params.id, 10);
  const productId = parseInt(req.params.productId, 10);

  try {
    await pool.query(
      'DELETE FROM collection_products WHERE collection_id = ? AND product_id = ?',
      [collectionId, productId]
    );
    return res.json({ success: true, message: 'Product removed from collection' });
  } catch (err) {
    console.error('Error removing product from collection:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove product' });
  }
}
