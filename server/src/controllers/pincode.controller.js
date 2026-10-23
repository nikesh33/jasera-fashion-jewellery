import { getPool } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';

const SEED_PINCODES = [
  { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', is_serviceable: 1, cod_available: 1, estimated_days: 2 },

];

async function ensureDefaultPincodes(pool) {
  try {
    const [cnt] = await pool.query('SELECT COUNT(*) as cnt FROM pincode_serviceability');
    if ((cnt[0]?.cnt || 0) === 0) {
      for (const p of SEED_PINCODES) {
        await pool.query(
          `INSERT INTO pincode_serviceability (pincode, city, state, is_serviceable, cod_available, estimated_days)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE is_serviceable = VALUES(is_serviceable)`,
          [p.pincode, p.city, p.state, p.is_serviceable, p.cod_available, p.estimated_days]
        );
      }
    }
  } catch (err) {
    console.warn('Could not auto-seed pincodes:', err.message);
  }
}

/**
 * GET /api/pincodes/check/:pincode
 * Public endpoint to check serviceability, COD availability, and estimated delivery days
 */
export async function checkPincode(req, res) {
  const pincode = (req.params.pincode || '').trim();
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit Indian pincode' });
  }

  const pool = getPool();
  try {
    await ensureDefaultPincodes(pool);
    const [rows] = await pool.query(
      'SELECT pincode, city, state, is_serviceable, cod_available, estimated_days FROM pincode_serviceability WHERE pincode = ?',
      [pincode]
    );

    if (rows.length > 0) {
      const p = rows[0];
      return res.json({
        success: true,
        data: {
          pincode: p.pincode,
          city: p.city,
          state: p.state,
          serviceable: Boolean(p.is_serviceable),
          codAvailable: Boolean(p.cod_available),
          estimatedDays: p.estimated_days || 4,
          message: p.is_serviceable
            ? `Delivery available in ${p.estimated_days || 4} days to ${p.city || ''} (${p.cod_available ? 'COD Available' : 'Prepaid Only'})`
            : 'Delivery currently unavailable to this pincode',
        },
      });
    }

    // Default fallback for other Indian pincodes
    return res.json({
      success: true,
      data: {
        pincode,
        city: 'India',
        state: '',
        serviceable: true,
        codAvailable: true,
        estimatedDays: 4,
        message: 'Standard delivery available in 4-6 business days (Cash on Delivery eligible)',
      },
    });
  } catch (err) {
    console.error('Pincode check error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify pincode serviceability' });
  }
}

/**
 * GET /api/pincodes/admin/all
 * Admin endpoint to list all configured pincodes
 */
export async function getAllPincodes(req, res) {
  const pool = getPool();
  try {
    await ensureDefaultPincodes(pool);
    const [rows] = await pool.query('SELECT * FROM pincode_serviceability ORDER BY state ASC, city ASC');
    return res.json({ success: true, data: { pincodes: rows } });
  } catch (err) {
    console.error('Error fetching pincodes:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch pincodes' });
  }
}

/**
 * POST /api/pincodes/admin
 * Admin endpoint to add or update pincode
 */
export async function savePincode(req, res) {
  const pool = getPool();
  const { pincode, city, state, is_serviceable = 1, cod_available = 1, estimated_days = 4 } = req.body;

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ success: false, message: 'Valid 6-digit pincode is required' });
  }

  try {
    await pool.query(
      `INSERT INTO pincode_serviceability (pincode, city, state, is_serviceable, cod_available, estimated_days)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         city = VALUES(city),
         state = VALUES(state),
         is_serviceable = VALUES(is_serviceable),
         cod_available = VALUES(cod_available),
         estimated_days = VALUES(estimated_days)`,
      [pincode, city || '', state || '', is_serviceable ? 1 : 0, cod_available ? 1 : 0, parseInt(estimated_days, 10) || 4]
    );

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'save_pincode_rule',
      targetType: 'pincode_serviceability',
      afterData: { pincode, city, state, is_serviceable, cod_available, estimated_days },
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: `Pincode ${pincode} rule saved successfully` });
  } catch (err) {
    console.error('Error saving pincode:', err);
    return res.status(500).json({ success: false, message: 'Failed to save pincode rule' });
  }
}

/**
 * DELETE /api/pincodes/admin/:pincode
 * Admin endpoint to delete pincode
 */
export async function deletePincode(req, res) {
  const pool = getPool();
  const pincode = req.params.pincode;

  try {
    await pool.query('DELETE FROM pincode_serviceability WHERE pincode = ?', [pincode]);
    return res.json({ success: true, message: `Pincode ${pincode} removed` });
  } catch (err) {
    console.error('Error deleting pincode:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete pincode' });
  }
}
