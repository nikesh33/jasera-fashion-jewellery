import { getPool } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';

/**
 * Helper to record payment transaction
 */
export async function recordPaymentTransaction({
  orderId,
  amount,
  method = 'upi',
  gateway = 'manual',
  status = 'created',
  gatewayPaymentId = null,
  gatewayOrderId = null,
  conn = null,
}) {
  const sql = `
    INSERT INTO payments (
      order_id, gateway, gateway_order_id, gateway_payment_id,
      amount, currency, status, method, created_at
    ) VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, NOW())
  `;
  const params = [
    orderId,
    gateway,
    gatewayOrderId || null,
    gatewayPaymentId || null,
    amount,
    status,
    method,
  ];

  const executor = conn || getPool();
  const [res] = await executor.query(sql, params);
  return res.insertId;
}

/**
 * GET /api/payments/admin/all
 * Admin list all payments with order and customer metadata
 */
export async function getAllPaymentsAdmin(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        o.order_number,
        o.fulfilment_status,
        o.placed_at,
        u.full_name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY p.id DESC
    `);

    // Financial KPI aggregation
    let totalCaptured = 0;
    let totalPending = 0;
    let totalRefunded = 0;

    rows.forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (p.status === 'captured') totalCaptured += amt;
      else if (p.status === 'created' || p.status === 'authorized') totalPending += amt;
      else if (p.status === 'refunded') totalRefunded += amt;
    });

    return res.json({
      success: true,
      data: {
        payments: rows,
        count: rows.length,
        summary: {
          totalCaptured: Math.round(totalCaptured * 100) / 100,
          totalPending: Math.round(totalPending * 100) / 100,
          totalRefunded: Math.round(totalRefunded * 100) / 100,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching payments ledger:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payment records' });
  }
}

/**
 * PATCH /api/payments/admin/:id/verify
 * Admin verifies manual payment received (e.g. UPI screenshot, bank transfer, COD handover)
 */
export async function verifyPayment(req, res) {
  const paymentId = parseInt(req.params.id, 10);
  const { transactionRef, note } = req.body;
  const adminId = req.user?.id || 1;

  const pool = getPool();
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
      if (existing.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      const p = existing[0];

      // Mark payment as captured
      await conn.query(
        `UPDATE payments SET
          status = 'captured',
          gateway_payment_id = COALESCE(?, gateway_payment_id),
          updated_at = NOW()
         WHERE id = ?`,
        [transactionRef || `MANUAL-${Date.now()}`, paymentId]
      );

      // Update order payment status to paid & confirm order if placed
      await conn.query(
        `UPDATE orders SET
          payment_status = 'paid',
          fulfilment_status = CASE WHEN fulfilment_status = 'placed' THEN 'confirmed' ELSE fulfilment_status END,
          confirmed_at = CASE WHEN confirmed_at IS NULL THEN NOW() ELSE confirmed_at END
         WHERE id = ?`,
        [p.order_id]
      );

      // Record in order status history with actor_id = adminId
      await conn.query(
        `INSERT INTO order_status_history (order_id, status, note, actor_type, actor_id, created_at)
         VALUES (?, 'paid', ?, 'admin', ?, NOW())`,
        [p.order_id, note || `Payment verified by Admin (Ref: ${transactionRef || 'Manual'})`, adminId]
      );

      await logAdminAction({
        adminId,
        action: 'verify_payment_received',
        targetType: 'payments',
        targetId: paymentId,
        afterData: { status: 'captured', transactionRef, note },
        ipAddress: req.ip,
        conn,
      });

      await conn.commit();
      return res.json({
        success: true,
        message: 'Payment verified and captured successfully. Order updated to Paid & Confirmed.',
      });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
}

/**
 * PATCH /api/payments/admin/:id/refund
 * Admin records refund
 */
export async function refundPayment(req, res) {
  const paymentId = parseInt(req.params.id, 10);
  const { reason, refundRef } = req.body;
  const adminId = req.user?.id || 1;

  const pool = getPool();
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
      if (existing.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      const p = existing[0];

      await conn.query(
        `UPDATE payments SET
          status = 'refunded',
          gateway_payment_id = COALESCE(?, gateway_payment_id),
          error_message = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [refundRef || `REF-${Date.now()}`, reason || 'Refund issued by Admin', paymentId]
      );

      await conn.query(
        `UPDATE orders SET payment_status = 'refunded' WHERE id = ?`,
        [p.order_id]
      );

      await conn.query(
        `INSERT INTO order_status_history (order_id, status, note, actor_type, actor_id, created_at)
         VALUES (?, 'refunded', ?, 'admin', ?, NOW())`,
        [p.order_id, `Refund processed: ${reason || 'Admin refund'}`, adminId]
      );

      await logAdminAction({
        adminId,
        action: 'refund_payment',
        targetType: 'payments',
        targetId: paymentId,
        afterData: { status: 'refunded', refundRef, reason },
        ipAddress: req.ip,
        conn,
      });

      await conn.commit();
      return res.json({ success: true, message: 'Payment marked as refunded successfully' });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error issuing refund:', err);
    return res.status(500).json({ success: false, message: 'Failed to record refund' });
  }
}
