import { getPool } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';
import { recordInventoryTransaction } from '../utils/inventoryLogger.js';

/**
 * POST /api/returns
 * Customer submits return / replacement request for an order
 */
export async function createReturnRequest(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { orderId, orderItemId = null, reason, refundMethod = 'original_source' } = req.body;
  if (!orderId || !reason?.trim()) {
    return res.status(400).json({ success: false, message: 'Order ID and reason for return are required' });
  }

  const pool = getPool();
  try {
    // Verify order belongs to this customer and is eligible (placed or delivered)
    const [orders] = await pool.query(
      'SELECT id, total, fulfilment_status FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found under your account' });
    }

    const order = orders[0];

    // Check if a return request already exists for this order
    const [existing] = await pool.query(
      'SELECT id, status FROM return_requests WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `A return request has already been logged for this order (Status: ${existing[0].status})`,
      });
    }

    const [result] = await pool.query(
      `INSERT INTO return_requests (
        order_id, order_item_id, user_id, reason,
        status, refund_method, refund_amount, created_at
      ) VALUES (?, ?, ?, ?, 'requested', ?, ?, NOW())`,
      [orderId, orderItemId || null, userId, reason.trim(), refundMethod, order.total]
    );

    return res.status(201).json({
      success: true,
      message: 'Return request submitted successfully. Our team will review within 24 hours.',
      data: { returnRequestId: result.insertId },
    });
  } catch (err) {
    console.error('Error creating return request:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit return request' });
  }
}

/**
 * GET /api/returns/my-returns
 * Get customer's submitted returns
 */
export async function getCustomerReturns(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const pool = getPool();
  try {
    const [rows] = await pool.query(
      `SELECT 
        rr.*,
        o.order_number,
        o.total as order_total
       FROM return_requests rr
       JOIN orders o ON o.id = rr.order_id
       WHERE rr.user_id = ?
       ORDER BY rr.id DESC`,
      [userId]
    );

    return res.json({ success: true, data: { returns: rows } });
  } catch (err) {
    console.error('Error fetching customer returns:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve returns' });
  }
}

/**
 * GET /api/returns/admin/all
 * Admin lists all customer return requests
 */
export async function getAllReturnRequests(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(`
      SELECT 
        rr.*,
        o.order_number,
        o.total as order_total,
        o.fulfilment_status as order_status,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone
      FROM return_requests rr
      JOIN orders o ON o.id = rr.order_id
      LEFT JOIN users u ON u.id = rr.user_id
      ORDER BY rr.id DESC
    `);

    return res.json({ success: true, data: { returnRequests: rows, count: rows.length } });
  } catch (err) {
    console.error('Admin fetching returns error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch return requests' });
  }
}

/**
 * PATCH /api/returns/admin/:id/status
 * Admin updates return request status
 */
export async function updateReturnRequestStatus(req, res) {
  const returnId = parseInt(req.params.id, 10);
  const { status, adminNote, refundAmount } = req.body;

  const validStatuses = ['requested', 'approved', 'rejected', 'picked_up', 'refunded'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid return status' });
  }

  const pool = getPool();
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT * FROM return_requests WHERE id = ?', [returnId]);
      if (existing.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Return request not found' });
      }

      const current = existing[0];

      await conn.query(
        `UPDATE return_requests SET
          status = ?,
          admin_note = COALESCE(?, admin_note),
          refund_amount = COALESCE(?, refund_amount),
          updated_at = NOW()
         WHERE id = ?`,
        [status, adminNote || null, refundAmount !== undefined ? Number(refundAmount) : null, returnId]
      );

      // If refunded or approved, update order status to 'returned' if applicable
      if (status === 'refunded') {
        await conn.query('UPDATE orders SET fulfilment_status = "returned", payment_status = "refunded" WHERE id = ?', [current.order_id]);
      }

      await logAdminAction({
        adminId: req.user?.id || 1,
        action: 'update_return_request_status',
        targetType: 'return_requests',
        targetId: returnId,
        beforeData: { status: current.status },
        afterData: { status, adminNote, refundAmount },
        ipAddress: req.ip,
        conn,
      });

      await conn.commit();
      return res.json({ success: true, message: `Return request status updated to "${status}"` });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error updating return request:', err);
    return res.status(500).json({ success: false, message: 'Failed to update return request status' });
  }
}
