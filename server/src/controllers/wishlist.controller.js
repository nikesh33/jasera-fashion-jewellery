import { getPool } from '../config/db.js';

/**
 * GET /api/wishlist
 * Get logged-in user's wishlist from MySQL database
 */
export async function getWishlist(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const pool = getPool();
  try {
    const [rows] = await pool.query(
      `SELECT 
        w.id as wishlist_id,
        w.product_id,
        w.variant_id,
        w.created_at,
        p.name,
        p.slug,
        p.selling_price,
        p.mrp,
        p.status,
        (SELECT url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as image_url,
        (SELECT stock FROM product_variants WHERE product_id = p.id ORDER BY is_default DESC, id ASC LIMIT 1) as stock
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );

    const items = rows.map((r) => ({
      wishlistId: r.wishlist_id,
      id: r.product_id,
      productId: r.product_id,
      variantId: r.variant_id,
      name: r.name,
      slug: r.slug,
      price: Number(r.selling_price),
      mrp: Number(r.mrp),
      images: r.image_url ? [r.image_url] : [],
      stock: r.stock !== null ? Number(r.stock) : 20,
      inStock: (r.stock !== null ? Number(r.stock) : 20) > 0,
      createdAt: r.created_at,
    }));

    return res.json({
      success: true,
      data: {
        items,
        count: items.length,
      },
    });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve wishlist' });
  }
}

/**
 * POST /api/wishlist/toggle
 * Toggle product in customer's wishlist
 */
export async function toggleWishlist(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { productId, variantId = null } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID is required' });
  }

  const pool = getPool();
  try {
    const [existing] = await pool.query(
      'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ? AND (variant_id = ? OR (? IS NULL AND variant_id IS NULL)) LIMIT 1',
      [userId, productId, variantId, variantId]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM wishlists WHERE id = ?', [existing[0].id]);
      return res.json({
        success: true,
        message: 'Product removed from wishlist',
        data: { inWishlist: false, productId },
      });
    }

    await pool.query(
      'INSERT INTO wishlists (user_id, product_id, variant_id, created_at) VALUES (?, ?, ?, NOW())',
      [userId, productId, variantId || null]
    );

    return res.json({
      success: true,
      message: 'Product saved to your wishlist',
      data: { inWishlist: true, productId },
    });
  } catch (err) {
    console.error('Error toggling wishlist item:', err);
    return res.status(500).json({ success: false, message: 'Failed to update wishlist' });
  }
}

/**
 * DELETE /api/wishlist/:productId
 * Remove item from wishlist
 */
export async function removeFromWishlist(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const productId = parseInt(req.params.productId, 10);
  const pool = getPool();
  try {
    await pool.query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, productId]);
    return res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
  }
}

/**
 * POST /api/wishlist/sync
 * Sync multiple product IDs from local state into MySQL database on login
 */
export async function syncWishlist(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { productIds } = req.body;
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.json({ success: true, message: 'Nothing to sync' });
  }

  const pool = getPool();
  try {
    for (const pid of productIds) {
      if (!pid) continue;
      await pool.query(
        'INSERT IGNORE INTO wishlists (user_id, product_id, created_at) VALUES (?, ?, NOW())',
        [userId, pid]
      );
    }
    return res.json({ success: true, message: 'Wishlist synced with database' });
  } catch (err) {
    console.error('Error syncing wishlist:', err);
    return res.status(500).json({ success: false, message: 'Failed to sync wishlist' });
  }
}
