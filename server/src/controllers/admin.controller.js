import { getPool } from '../config/db.js';

export async function getDashboardStats(req, res) {
  const pool = getPool();

  try {
    const [[revRow]] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as paid_revenue FROM orders WHERE payment_status = 'paid'`
    );

    const [[pendingCodRow]] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as pending_cod_revenue FROM orders WHERE payment_status = 'pending_cod'`
    );

    const [[ordersRow]] = await pool.query(
      `SELECT COUNT(*) as total_orders FROM orders`
    );

    const [[productsRow]] = await pool.query(
      `SELECT COUNT(*) as total_products FROM products WHERE status = 'active'`
    );

    const [[usersRow]] = await pool.query(
      `SELECT COUNT(*) as total_users FROM users`
    );

    const [[catRow]] = await pool.query(
      `SELECT COUNT(*) as total_categories FROM categories WHERE status = 'active'`
    );

    const [[lowStockRow]] = await pool.query(
      `SELECT COUNT(*) as low_stock_count FROM product_variants WHERE stock <= 5`
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalRevenue: Number(revRow.paid_revenue),
          pendingCodRevenue: Number(pendingCodRow.pending_cod_revenue),
          totalOrders: Number(ordersRow.total_orders),
          totalProducts: Number(productsRow.total_products),
          totalUsers: Number(usersRow.total_users),
          totalCategories: Number(catRow.total_categories),
          lowStockCount: Number(lowStockRow.low_stock_count),
        },
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to compute dashboard analytics' });
  }
}

export async function getAllOrders(req, res) {
  const pool = getPool();

  try {
    const [orders] = await pool.query(
      `SELECT
        o.*,
        u.full_name as customer_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.placed_at DESC`
    );

    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT
           oi.*,
           p.slug as product_slug,
           p.name as product_name,
           (SELECT url FROM product_images WHERE product_id = oi.product_id ORDER BY display_order ASC LIMIT 1) as product_image
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;

      if (typeof order.shipping_address === 'string') {
        try {
          order.shipping_address = JSON.parse(order.shipping_address);
        } catch {
          // Keep as string if parsing fails
        }
      }
    }

    res.json({
      success: true,
      data: {
        orders,
      },
    });
  } catch (err) {
    console.error('Admin all orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
  }
}

export async function updateOrderStatus(req, res) {
  const pool = getPool();
  const { id } = req.params;
  const { status, note } = req.body;

  const validStatuses = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(
      `SELECT id, fulfilment_status, payment_status, payment_method FROM orders WHERE id = ? OR order_number = ?`,
      [id, id]
    );

    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];
    const prevStatus = order.fulfilment_status;

    // Check cancellation: if changing to cancelled from an uncancelled state, restore inventory
    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      const [items] = await conn.query(
        `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?`,
        [order.id]
      );
      for (const item of items) {
        if (item.variant_id) {
          await conn.query(
            `UPDATE product_variants SET stock = stock + ? WHERE id = ?`,
            [item.quantity, item.variant_id]
          );
        } else {
          await conn.query(
            `UPDATE product_variants SET stock = stock + ? WHERE product_id = ?`,
            [item.quantity, item.product_id]
          );
        }
      }
    }

    // Set timestamps based on status
    let timestampField = '';
    if (status === 'confirmed') timestampField = ', confirmed_at = NOW()';
    else if (status === 'packed') timestampField = ', packed_at = NOW()';
    else if (status === 'shipped') timestampField = ', shipped_at = NOW()';
    else if (status === 'delivered') timestampField = ', delivered_at = NOW()';
    else if (status === 'cancelled') timestampField = ', cancelled_at = NOW(), cancel_reason = ?';

    // If COD order is delivered, cash has been collected so payment_status becomes paid
    let codPaymentUpdate = '';
    if (status === 'delivered' && order.payment_status === 'pending_cod') {
      codPaymentUpdate = `, payment_status = 'paid'`;
    }

    const queryParams = [status];
    if (status === 'cancelled') {
      queryParams.push(note || 'Cancelled by store administrator');
    }
    queryParams.push(order.id);

    await conn.query(
      `UPDATE orders SET fulfilment_status = ? ${timestampField} ${codPaymentUpdate} WHERE id = ?`,
      queryParams
    );

    // Record in history
    await conn.query(
      `INSERT INTO order_status_history (order_id, status, note, actor_type, actor_id)
       VALUES (?, ?, ?, 'admin', ?)`,
      [order.id, status, note || `Status updated from ${prevStatus} to ${status} by store admin`, req.user?.id || null]
    );

    await conn.commit();

    res.json({
      success: true,
      message: `Order status updated to "${status}"`,
      data: {
        orderId: order.id,
        newStatus: status,
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error('Update order status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  } finally {
    conn.release();
  }
}
