import { getPool } from '../config/db.js';

/**
 * Log administrative action into admin_audit_log table
 * @param {Object} params
 * @param {number} params.adminId - Admin user ID
 * @param {string} params.action - e.g. 'create_product', 'update_order_status', 'delete_category'
 * @param {string} [params.targetType] - e.g. 'product', 'category', 'order', 'coupon', 'banner'
 * @param {number} [params.targetId] - ID of modified record
 * @param {any} [params.beforeData] - State before change
 * @param {any} [params.afterData] - State after change
 * @param {string} [params.ipAddress] - IP of request
 * @param {any} [params.conn] - Optional active transaction connection
 */
export async function logAdminAction({
  adminId,
  action,
  targetType = null,
  targetId = null,
  beforeData = null,
  afterData = null,
  ipAddress = null,
  conn = null,
}) {
  if (!adminId || !action) return;

  const sql = `
    INSERT INTO admin_audit_log (
      admin_id, action, target_type, target_id,
      before_data, after_data, ip_address, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const params = [
    adminId,
    action,
    targetType,
    targetId,
    beforeData ? JSON.stringify(beforeData) : null,
    afterData ? JSON.stringify(afterData) : null,
    ipAddress || null,
  ];

  try {
    const executor = conn || getPool();
    await executor.query(sql, params);
  } catch (err) {
    console.warn('Non-critical: Failed to write to admin_audit_log:', err.message);
  }
}
