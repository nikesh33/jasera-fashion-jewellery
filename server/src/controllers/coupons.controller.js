import { getPool } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';

/**
 * POST /api/coupons/validate
 * Validate coupon code against subtotal and user criteria
 */
export async function validateCoupon(req, res) {
  const { code, cartSubtotal = 0 } = req.body;
  const userId = req.user?.id || null;

  if (!code?.trim()) {
    return res.status(400).json({ success: false, message: 'Coupon code is required' });
  }

  const cleanCode = code.toUpperCase().trim();
  const subtotal = Number(cartSubtotal) || 0;
  const pool = getPool();

  try {
    const [rows] = await pool.query(
      `SELECT * FROM coupons WHERE code = ? AND status = 'active' LIMIT 1`,
      [cleanCode]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    }

    const coupon = rows[0];
    const now = new Date();

    // Check validity window
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return res.status(400).json({ success: false, message: 'This coupon offer has not started yet' });
    }
    if (coupon.valid_to && new Date(coupon.valid_to) < now) {
      return res.status(400).json({ success: false, message: 'This coupon code has expired' });
    }

    // Check minimum order amount
    const minAmount = Number(coupon.min_order_amount) || 0;
    if (subtotal < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Cart subtotal must be at least ₹${minAmount} to apply this coupon`,
      });
    }

    // Check total usage cap
    if (coupon.total_usage_cap && coupon.total_used >= coupon.total_usage_cap) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its maximum usage limit' });
    }

    // Check customer-specific usage caps if user is logged in
    if (userId) {
      if (coupon.first_order_only) {
        const [userOrders] = await pool.query(
          `SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND payment_status != 'failed'`,
          [userId]
        );
        if ((userOrders[0]?.count || 0) > 0) {
          return res.status(400).json({ success: false, message: 'This coupon is valid on first order only' });
        }
      }

      const [usageRows] = await pool.query(
        `SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?`,
        [coupon.id, userId]
      );
      const userUsedCount = usageRows[0]?.count || 0;
      if (coupon.per_customer_cap && userUsedCount >= coupon.per_customer_cap) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon code' });
      }
    }

    // Calculate discount value
    let discountAmount = 0;
    const couponValue = Number(coupon.value);

    if (coupon.type === 'percentage') {
      discountAmount = Math.round((subtotal * (couponValue / 100)) * 100) / 100;
      if (coupon.max_discount && discountAmount > Number(coupon.max_discount)) {
        discountAmount = Number(coupon.max_discount);
      }
    } else if (coupon.type === 'flat') {
      discountAmount = Math.min(couponValue, subtotal);
    } else if (coupon.type === 'free_shipping') {
      discountAmount = 50; // free standard shipping
    }

    return res.json({
      success: true,
      message: `Coupon "${cleanCode}" applied successfully! You saved ₹${discountAmount}`,
      data: {
        couponId: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        finalSubtotal: Math.max(0, subtotal - discountAmount),
      },
    });
  } catch (err) {
    console.error('Error validating coupon:', err);
    return res.status(500).json({ success: false, message: 'Failed to apply coupon' });
  }
}

/**
 * GET /api/coupons/admin/all
 * Admin endpoint to list all coupons
 */
export async function getAllCoupons(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = c.id) as actual_usage_count
      FROM coupons c
      ORDER BY c.id DESC
    `);
    return res.json({ success: true, data: { coupons: rows } });
  } catch (err) {
    console.error('Error fetching admin coupons:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
}

/**
 * POST /api/coupons/admin
 * Admin endpoint to create new coupon
 */
export async function createCoupon(req, res) {
  const pool = getPool();
  const {
    code, description, type = 'percentage', value,
    min_order_amount = 0, max_discount = null,
    valid_from = null, valid_to = null,
    total_usage_cap = null, per_customer_cap = 1,
    first_order_only = 0, status = 'active',
  } = req.body;

  if (!code?.trim() || value === undefined) {
    return res.status(400).json({ success: false, message: 'Coupon code and discount value are required' });
  }

  const cleanCode = code.toUpperCase().trim();

  try {
    const [result] = await pool.query(
      `INSERT INTO coupons (
        code, description, type, value, min_order_amount, max_discount,
        valid_from, valid_to, total_usage_cap, per_customer_cap,
        first_order_only, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        cleanCode, description || null, type, Number(value),
        Number(min_order_amount) || 0, max_discount ? Number(max_discount) : null,
        valid_from || null, valid_to || null,
        total_usage_cap ? parseInt(total_usage_cap, 10) : null,
        per_customer_cap ? parseInt(per_customer_cap, 10) : 1,
        first_order_only ? 1 : 0, status,
      ]
    );

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'create_coupon',
      targetType: 'coupons',
      targetId: result.insertId,
      afterData: { code: cleanCode, type, value },
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, message: 'Coupon created successfully', data: { id: result.insertId } });
  } catch (err) {
    console.error('Error creating coupon:', err);
    return res.status(500).json({ success: false, message: 'Failed to create coupon. Code may already exist.' });
  }
}

/**
 * PUT /api/coupons/admin/:id
 * Admin endpoint to update coupon
 */
export async function updateCoupon(req, res) {
  const pool = getPool();
  const id = parseInt(req.params.id, 10);
  const {
    code, description, type, value, min_order_amount, max_discount,
    valid_from, valid_to, total_usage_cap, per_customer_cap,
    first_order_only, status,
  } = req.body;

  try {
    await pool.query(
      `UPDATE coupons SET
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        type = COALESCE(?, type),
        value = COALESCE(?, value),
        min_order_amount = COALESCE(?, min_order_amount),
        max_discount = COALESCE(?, max_discount),
        valid_from = ?,
        valid_to = ?,
        total_usage_cap = ?,
        per_customer_cap = COALESCE(?, per_customer_cap),
        first_order_only = COALESCE(?, first_order_only),
        status = COALESCE(?, status),
        updated_at = NOW()
       WHERE id = ?`,
      [
        code ? code.toUpperCase().trim() : null,
        description !== undefined ? description : null,
        type || null,
        value !== undefined ? Number(value) : null,
        min_order_amount !== undefined ? Number(min_order_amount) : null,
        max_discount !== undefined ? (max_discount ? Number(max_discount) : null) : null,
        valid_from || null,
        valid_to || null,
        total_usage_cap ? parseInt(total_usage_cap, 10) : null,
        per_customer_cap !== undefined ? parseInt(per_customer_cap, 10) : null,
        first_order_only !== undefined ? (first_order_only ? 1 : 0) : null,
        status || null,
        id,
      ]
    );

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'update_coupon',
      targetType: 'coupons',
      targetId: id,
      afterData: req.body,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Coupon updated successfully' });
  } catch (err) {
    console.error('Error updating coupon:', err);
    return res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
}

/**
 * DELETE /api/coupons/admin/:id
 * Admin endpoint to delete coupon
 */
export async function deleteCoupon(req, res) {
  const pool = getPool();
  const id = parseInt(req.params.id, 10);

  try {
    await pool.query('DELETE FROM coupons WHERE id = ?', [id]);
    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'delete_coupon',
      targetType: 'coupons',
      targetId: id,
      ipAddress: req.ip,
    });
    return res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    console.error('Error deleting coupon:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
}

/**
 * GET /api/coupons/admin/:id/usage
 * Admin endpoint to view usage history of a coupon
 */
export async function getCouponUsageHistory(req, res) {
  const pool = getPool();
  const id = parseInt(req.params.id, 10);

  try {
    const [rows] = await pool.query(
      `SELECT 
        cu.id, cu.used_at, cu.order_id,
        u.full_name as user_name, u.email as user_email,
        o.order_number, o.total as order_total
       FROM coupon_usage cu
       LEFT JOIN users u ON u.id = cu.user_id
       LEFT JOIN orders o ON o.id = cu.order_id
       WHERE cu.coupon_id = ?
       ORDER BY cu.used_at DESC`,
      [id]
    );

    return res.json({ success: true, data: { usage: rows, count: rows.length } });
  } catch (err) {
    console.error('Error fetching coupon usage:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve coupon usage history' });
  }
}
