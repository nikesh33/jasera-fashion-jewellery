import { getPool } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';

const DEFAULT_SETTINGS = [
  { key: 'store_name', value: 'Jassera', group: 'general' },
  { key: 'tagline', value: 'Jewellery & Accessories', group: 'general' },
  { key: 'announcement_banner_text', value: 'Free Shipping on orders above ₹499 | Handcrafted with Care by Jassera', group: 'header' },
  { key: 'announcement_banner_link', value: '/shop', group: 'header' },
  { key: 'support_email', value: 'support@jassera.in', group: 'contact' },
  { key: 'support_phone', value: '+91 98200 12345', group: 'contact' },
  { key: 'whatsapp_number', value: '+91 98200 12345', group: 'contact' },
  { key: 'free_shipping_threshold', value: '499', group: 'checkout' },
  { key: 'shipping_fee', value: '50', group: 'checkout' },
  { key: 'tax_rate_percent', value: '3', group: 'checkout' },
  { key: 'cod_enabled', value: 'true', group: 'checkout' },
  { key: 'instagram_url', value: 'https://instagram.com/jassera.jewels', group: 'social' },
];

/**
 * Ensure default store settings exist in database
 */
async function ensureDefaultSettings(pool) {
  try {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM store_settings');
    if ((countRows[0]?.cnt || 0) === 0) {
      for (const item of DEFAULT_SETTINGS) {
        await pool.query(
          `INSERT INTO store_settings (setting_key, setting_value, setting_group) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [item.key, item.value, item.group]
        );
      }
    }
  } catch (err) {
    console.warn('Could not auto-seed default store settings:', err.message);
  }
}

/**
 * GET /api/settings
 * Public endpoint to fetch active store settings as key-value pairs
 */
export async function getStoreSettings(req, res) {
  const pool = getPool();
  try {
    await ensureDefaultSettings(pool);
    const [rows] = await pool.query('SELECT setting_key, setting_value, setting_group FROM store_settings');
    const settings = {};
    rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });

    return res.json({
      success: true,
      data: {
        settings,
        raw: rows,
      },
    });
  } catch (err) {
    console.error('Error fetching store settings:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve store settings' });
  }
}

/**
 * PUT /api/settings/admin
 * Admin endpoint to update store settings
 */
export async function updateStoreSettings(req, res) {
  const pool = getPool();
  const settingsObj = req.body.settings || req.body;
  if (!settingsObj || typeof settingsObj !== 'object') {
    return res.status(400).json({ success: false, message: 'Settings object is required' });
  }

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [beforeRows] = await conn.query('SELECT setting_key, setting_value FROM store_settings');

      for (const [key, value] of Object.entries(settingsObj)) {
        await conn.query(
          `INSERT INTO store_settings (setting_key, setting_value, setting_group)
           VALUES (?, ?, 'general')
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [key, String(value), String(value)]
        );
      }

      await logAdminAction({
        adminId: req.user?.id || 1,
        action: 'update_store_settings',
        targetType: 'store_settings',
        beforeData: beforeRows,
        afterData: settingsObj,
        ipAddress: req.ip,
        conn,
      });

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    return res.json({
      success: true,
      message: 'Store settings updated successfully in database',
    });
  } catch (err) {
    console.error('Error updating store settings:', err);
    return res.status(500).json({ success: false, message: 'Failed to update store settings' });
  }
}
