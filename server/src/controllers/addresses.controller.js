import { getPool } from '../config/db.js';

/**
 * Helper to normalize address row from DB to consistent client format
 */
function formatAddress(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    pincode: row.pincode,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 || '',
    landmark: row.landmark || '',
    city: row.city,
    state: row.state,
    addressType: row.address_type || 'home',
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Also include snake_case for maximum compatibility
    full_name: row.full_name,
    address_line1: row.address_line1,
    address_line2: row.address_line2 || '',
    address_type: row.address_type || 'home',
    is_default: Boolean(row.is_default),
  };
}

/**
 * GET /api/addresses
 * Retrieve all saved addresses for the authenticated customer
 */
export async function getAddresses(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const pool = getPool();
  try {
    const [rows] = await pool.query(
      `SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    const addresses = rows.map(formatAddress);
    return res.json({
      success: true,
      data: {
        addresses,
        count: addresses.length,
      },
    });
  } catch (err) {
    console.error('Error fetching addresses:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve saved addresses' });
  }
}

/**
 * POST /api/addresses
 * Create a new delivery address in MySQL database for the authenticated customer
 */
export async function createAddress(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const {
    fullName, full_name,
    phone,
    pincode,
    addressLine1, address_line1,
    addressLine2, address_line2,
    landmark,
    city,
    state,
    addressType, address_type,
    isDefault, is_default,
  } = req.body;

  const resolvedFullName = (fullName || full_name || '').trim();
  const resolvedPhone = (phone || '').trim();
  const resolvedPincode = (pincode || '').trim();
  const resolvedLine1 = (addressLine1 || address_line1 || '').trim();
  const resolvedLine2 = (addressLine2 || address_line2 || '').trim();
  const resolvedLandmark = (landmark || '').trim();
  const resolvedCity = (city || '').trim();
  const resolvedState = (state || '').trim();
  const resolvedType = (addressType || address_type || 'home').toLowerCase();
  const shouldBeDefault = Boolean(isDefault || is_default);

  // Validate mandatory fields
  if (!resolvedFullName || !resolvedPhone || !resolvedPincode || !resolvedLine1 || !resolvedCity || !resolvedState) {
    return res.status(400).json({
      success: false,
      message: 'Full name, phone, 6-digit pincode, address line 1, city, and state are required',
    });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Check count of existing addresses for this customer
    const [existing] = await conn.query(
      `SELECT COUNT(*) as cnt FROM addresses WHERE user_id = ?`,
      [userId]
    );
    const existingCount = existing[0]?.cnt || 0;

    // If customer has no existing addresses, this one must be default
    const isFirstAddress = existingCount === 0;
    const finalDefault = (shouldBeDefault || isFirstAddress) ? 1 : 0;

    // If this address is set as default, unset all existing default addresses for this user
    if (finalDefault === 1) {
      await conn.query(
        `UPDATE addresses SET is_default = 0 WHERE user_id = ?`,
        [userId]
      );
    }

    const [result] = await conn.query(
      `INSERT INTO addresses (
        user_id, full_name, phone, pincode,
        address_line1, address_line2, landmark,
        city, state, address_type, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        resolvedFullName,
        resolvedPhone,
        resolvedPincode,
        resolvedLine1,
        resolvedLine2 || null,
        resolvedLandmark || null,
        resolvedCity,
        resolvedState,
        ['home', 'work', 'other'].includes(resolvedType) ? resolvedType : 'home',
        finalDefault,
      ]
    );

    const [createdRows] = await conn.query(
      `SELECT * FROM addresses WHERE id = ?`,
      [result.insertId]
    );

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Delivery address saved to database successfully',
      data: {
        address: formatAddress(createdRows[0]),
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error creating address:', err);
    return res.status(500).json({ success: false, message: 'Failed to save address to database' });
  } finally {
    conn.release();
  }
}

/**
 * PUT /api/addresses/:id
 * Update an existing address in MySQL database
 */
export async function updateAddress(req, res) {
  const userId = req.user?.id;
  const addressId = parseInt(req.params.id, 10);

  if (!userId || isNaN(addressId)) {
    return res.status(400).json({ success: false, message: 'Valid address ID is required' });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Verify ownership
    const [existingRows] = await conn.query(
      `SELECT * FROM addresses WHERE id = ? AND user_id = ?`,
      [addressId, userId]
    );

    if (existingRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    const existing = existingRows[0];
    const {
      fullName, full_name,
      phone,
      pincode,
      addressLine1, address_line1,
      addressLine2, address_line2,
      landmark,
      city,
      state,
      addressType, address_type,
      isDefault, is_default,
    } = req.body;

    const resolvedFullName = (fullName ?? full_name ?? existing.full_name).trim();
    const resolvedPhone = (phone ?? existing.phone).trim();
    const resolvedPincode = (pincode ?? existing.pincode).trim();
    const resolvedLine1 = (addressLine1 ?? address_line1 ?? existing.address_line1).trim();
    const resolvedLine2 = (addressLine2 ?? address_line2 ?? existing.address_line2 ?? '').trim();
    const resolvedLandmark = (landmark ?? existing.landmark ?? '').trim();
    const resolvedCity = (city ?? existing.city).trim();
    const resolvedState = (state ?? existing.state).trim();
    const resolvedType = (addressType ?? address_type ?? existing.address_type ?? 'home').toLowerCase();
    const shouldBeDefault = isDefault !== undefined ? Boolean(isDefault) : (is_default !== undefined ? Boolean(is_default) : Boolean(existing.is_default));

    if (shouldBeDefault) {
      await conn.query(
        `UPDATE addresses SET is_default = 0 WHERE user_id = ?`,
        [userId]
      );
    }

    await conn.query(
      `UPDATE addresses SET
        full_name = ?,
        phone = ?,
        pincode = ?,
        address_line1 = ?,
        address_line2 = ?,
        landmark = ?,
        city = ?,
        state = ?,
        address_type = ?,
        is_default = ?
      WHERE id = ? AND user_id = ?`,
      [
        resolvedFullName,
        resolvedPhone,
        resolvedPincode,
        resolvedLine1,
        resolvedLine2 || null,
        resolvedLandmark || null,
        resolvedCity,
        resolvedState,
        ['home', 'work', 'other'].includes(resolvedType) ? resolvedType : 'home',
        shouldBeDefault ? 1 : 0,
        addressId,
        userId,
      ]
    );

    const [updatedRows] = await conn.query(
      `SELECT * FROM addresses WHERE id = ?`,
      [addressId]
    );

    await conn.commit();

    return res.json({
      success: true,
      message: 'Address updated successfully',
      data: {
        address: formatAddress(updatedRows[0]),
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating address:', err);
    return res.status(500).json({ success: false, message: 'Failed to update address' });
  } finally {
    conn.release();
  }
}

/**
 * DELETE /api/addresses/:id
 * Remove a delivery address from MySQL database
 */
export async function deleteAddress(req, res) {
  const userId = req.user?.id;
  const addressId = parseInt(req.params.id, 10);

  if (!userId || isNaN(addressId)) {
    return res.status(400).json({ success: false, message: 'Valid address ID is required' });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      `SELECT * FROM addresses WHERE id = ? AND user_id = ?`,
      [addressId, userId]
    );

    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    const wasDefault = Boolean(existing[0].is_default);

    await conn.query(
      `DELETE FROM addresses WHERE id = ? AND user_id = ?`,
      [addressId, userId]
    );

    // If the deleted address was default, make the most recent remaining address default
    if (wasDefault) {
      const [remaining] = await conn.query(
        `SELECT id FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
      if (remaining.length > 0) {
        await conn.query(
          `UPDATE addresses SET is_default = 1 WHERE id = ?`,
          [remaining[0].id]
        );
      }
    }

    await conn.commit();

    return res.json({
      success: true,
      message: 'Address deleted successfully from database',
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error deleting address:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete address' });
  } finally {
    conn.release();
  }
}

/**
 * PATCH /api/addresses/:id/default
 * Mark a specific address as default in database
 */
export async function setDefaultAddress(req, res) {
  const userId = req.user?.id;
  const addressId = parseInt(req.params.id, 10);

  if (!userId || isNaN(addressId)) {
    return res.status(400).json({ success: false, message: 'Valid address ID is required' });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      `SELECT id FROM addresses WHERE id = ? AND user_id = ?`,
      [addressId, userId]
    );

    if (existing.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    await conn.query(
      `UPDATE addresses SET is_default = 0 WHERE user_id = ?`,
      [userId]
    );

    await conn.query(
      `UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?`,
      [addressId, userId]
    );

    const [updatedRows] = await conn.query(
      `SELECT * FROM addresses WHERE id = ?`,
      [addressId]
    );

    await conn.commit();

    return res.json({
      success: true,
      message: 'Default address updated successfully',
      data: {
        address: formatAddress(updatedRows[0]),
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error setting default address:', err);
    return res.status(500).json({ success: false, message: 'Failed to set default address' });
  } finally {
    conn.release();
  }
}
