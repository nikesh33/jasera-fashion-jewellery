import { getPool } from '../config/db.js';

/**
 * Helper to get or create cart for user
 */
async function getOrCreateCart(conn, userId) {
  let [carts] = await conn.query('SELECT id FROM carts WHERE user_id = ? LIMIT 1', [userId]);
  if (carts.length > 0) {
    return carts[0].id;
  }
  const [insertRes] = await conn.query(
    'INSERT INTO carts (user_id, created_at) VALUES (?, NOW())',
    [userId]
  );
  return insertRes.insertId;
}

/**
 * GET /api/cart
 * Retrieve current customer's cart items from MySQL database
 */
export async function getCart(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const pool = getPool();
  try {
    const conn = await pool.getConnection();
    try {
      const cartId = await getOrCreateCart(conn, userId);

      const [items] = await conn.query(
        `SELECT 
          ci.id as cart_item_id,
          ci.quantity,
          ci.created_at,
          p.id as product_id,
          p.name as product_name,
          p.slug,
          p.selling_price,
          p.mrp,
          p.status as product_status,
          pv.id as variant_id,
          pv.size as variant_size,
          pv.colour as variant_colour,
          pv.material as variant_material,
          pv.price_override,
          pv.stock as available_stock,
          (SELECT url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as product_image
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         LEFT JOIN product_variants pv ON pv.id = ci.variant_id
         WHERE ci.cart_id = ? AND p.status = 'active'`,
        [cartId]
      );

      const formatted = items.map((i) => {
        const unitPrice = i.price_override ? Number(i.price_override) : Number(i.selling_price);
        return {
          id: i.cart_item_id,
          productId: i.product_id,
          variantId: i.variant_id,
          quantity: i.quantity,
          product: {
            id: i.product_id,
            name: i.product_name,
            slug: i.slug,
            price: unitPrice,
            mrp: Number(i.mrp),
            images: i.product_image ? [i.product_image] : [],
          },
          variant: i.variant_id ? {
            id: i.variant_id,
            size: i.variant_size,
            colour: i.variant_colour,
            material: i.variant_material,
            price: unitPrice,
            stock: i.available_stock,
          } : null,
          unitPrice,
          total: Math.round(unitPrice * i.quantity * 100) / 100,
        };
      });

      const subtotal = formatted.reduce((sum, item) => sum + item.total, 0);

      return res.json({
        success: true,
        data: {
          cartId,
          items: formatted,
          itemCount: formatted.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: Math.round(subtotal * 100) / 100,
        },
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error fetching cart:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve shopping cart' });
  }
}

/**
 * POST /api/cart/items
 * Add an item or increment quantity in customer's database cart
 */
export async function addToCart(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { productId, variantId = null, quantity = 1 } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID is required' });
  }

  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const pool = getPool();

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const cartId = await getOrCreateCart(conn, userId);

      // Verify product exists and is active
      const [prods] = await conn.query('SELECT id, status FROM products WHERE id = ? AND status = "active"', [productId]);
      if (prods.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Product not found or inactive' });
      }

      await conn.query(
        `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, created_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), updated_at = NOW()`,
        [cartId, productId, variantId || null, qty]
      );

      await conn.commit();
      return res.status(201).json({ success: true, message: 'Item added to shopping cart' });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error adding to cart:', err);
    return res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
}

/**
 * PUT /api/cart/items/:id
 * Update quantity of a specific cart item
 */
export async function updateCartItem(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const cartItemId = parseInt(req.params.id, 10);
  const { quantity } = req.body;
  const qty = parseInt(quantity, 10);

  const pool = getPool();
  try {
    const conn = await pool.getConnection();
    try {
      const cartId = await getOrCreateCart(conn, userId);

      if (qty <= 0) {
        await conn.query('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [cartItemId, cartId]);
      } else {
        await conn.query(
          'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ? AND cart_id = ?',
          [qty, cartItemId, cartId]
        );
      }
      return res.json({ success: true, message: 'Cart item updated' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error updating cart item:', err);
    return res.status(500).json({ success: false, message: 'Failed to update cart item' });
  }
}

/**
 * DELETE /api/cart/items/:id
 * Remove item from cart
 */
export async function removeCartItem(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const cartItemId = parseInt(req.params.id, 10);
  const pool = getPool();
  try {
    const conn = await pool.getConnection();
    try {
      const cartId = await getOrCreateCart(conn, userId);
      await conn.query('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [cartItemId, cartId]);
      return res.json({ success: true, message: 'Item removed from cart' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error removing cart item:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove cart item' });
  }
}

/**
 * POST /api/cart/sync
 * Sync items from local storage cart into MySQL database on login
 */
export async function syncCart(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.json({ success: true, message: 'No items to sync' });
  }

  const pool = getPool();
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const cartId = await getOrCreateCart(conn, userId);

      for (const item of items) {
        const productId = item.productId || item.product?.id || item.id;
        const variantId = item.variantId || item.variant?.id || null;
        const quantity = Math.max(1, parseInt(item.quantity || 1, 10));

        if (!productId) continue;

        await conn.query(
          `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, created_at)
           VALUES (?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE quantity = GREATEST(quantity, VALUES(quantity)), updated_at = NOW()`,
          [cartId, productId, variantId, quantity]
        );
      }

      await conn.commit();
      return res.json({ success: true, message: 'Cart synced with database successfully' });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error syncing cart:', err);
    return res.status(500).json({ success: false, message: 'Failed to sync cart' });
  }
}

/**
 * DELETE /api/cart/clear
 * Clear all items from customer's cart
 */
export async function clearCart(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const pool = getPool();
  try {
    const conn = await pool.getConnection();
    try {
      const cartId = await getOrCreateCart(conn, userId);
      await conn.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
      return res.json({ success: true, message: 'Cart cleared' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error clearing cart:', err);
    return res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
}
