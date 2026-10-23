import { getPool } from '../config/db.js';

/**
 * GET /api/audit
 * Fetch recent audit logs for Admin Panel
 */
export async function getAuditLogs(req, res) {
  const pool = getPool();
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const [rows] = await pool.query(
      `SELECT 
        l.*,
        u.full_name as admin_name,
        u.email as admin_email
       FROM admin_audit_log l
       LEFT JOIN users u ON u.id = l.admin_id
       ORDER BY l.id DESC
       LIMIT ?`,
      [limit]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit log' });
  }
}
