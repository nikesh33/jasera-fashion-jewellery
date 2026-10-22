import { getPool } from '../config/db.js';

/**
 * Format database banner row to camelCase response
 */
function formatBanner(b) {
  if (!b) return null;
  return {
    id: b.id,
    title: b.title || '',
    subtitle: b.subtitle || '',
    imageUrl: b.image_url,
    mobileImageUrl: b.mobile_image_url || null,
    linkUrl: b.link_url || '/shop',
    displayOrder: b.display_order ?? 0,
    publishFrom: b.publish_from,
    publishTo: b.publish_to,
    position: b.position || 'hero',
    status: b.status || 'active',
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    // snake_case aliases
    image_url: b.image_url,
    mobile_image_url: b.mobile_image_url,
    link_url: b.link_url,
    display_order: b.display_order,
  };
}

/**
 * GET /api/banners
 * Public endpoint to fetch all currently active banners for the storefront
 */
export async function getPublicBanners(req, res) {
  const pool = getPool();
  const position = req.query.position; // optional 'hero', 'promo', 'feature'

  try {
    let sql = `
      SELECT * FROM banners 
      WHERE status = 'active'
        AND (publish_from IS NULL OR publish_from <= NOW())
        AND (publish_to IS NULL OR publish_to >= NOW())
    `;
    const params = [];

    if (position && ['hero', 'promo', 'feature'].includes(position)) {
      sql += ` AND position = ?`;
      params.push(position);
    }

    sql += ` ORDER BY display_order ASC, id ASC`;

    const [rows] = await pool.query(sql, params);
    const banners = rows.map(formatBanner);

    return res.json({
      success: true,
      data: {
        banners,
        count: banners.length,
      },
    });
  } catch (err) {
    console.error('Error fetching public banners:', err);
    return res.status(500).json({ success: false, message: 'Failed to load banners' });
  }
}

/**
 * GET /api/banners/all
 * Admin endpoint to list all banners (active & inactive)
 */
export async function getAllBanners(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(`SELECT * FROM banners ORDER BY position ASC, display_order ASC, id DESC`);
    const banners = rows.map(formatBanner);
    return res.json({
      success: true,
      data: {
        banners,
        count: banners.length,
      },
    });
  } catch (err) {
    console.error('Error fetching all banners:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve banners' });
  }
}

/**
 * POST /api/banners
 * Admin endpoint to create a new banner
 */
export async function createBanner(req, res) {
  const pool = getPool();
  const {
    title,
    subtitle,
    imageUrl, image_url,
    mobileImageUrl, mobile_image_url,
    linkUrl, link_url,
    displayOrder, display_order,
    publishFrom, publish_from,
    publishTo, publish_to,
    position = 'hero',
    status = 'active',
  } = req.body;

  const resolvedImage = (imageUrl || image_url || '').trim();
  if (!resolvedImage) {
    return res.status(400).json({ success: false, message: 'Banner image URL is required' });
  }

  const resolvedTitle = (title || '').trim() || null;
  const resolvedSubtitle = (subtitle || '').trim() || null;
  const resolvedMobileImage = (mobileImageUrl || mobile_image_url || '').trim() || null;
  const resolvedLink = (linkUrl || link_url || '/shop').trim();
  const resolvedOrder = parseInt(displayOrder ?? display_order ?? 0, 10) || 0;
  const validPositions = ['hero', 'promo', 'feature'];
  const resolvedPosition = validPositions.includes(position) ? position : 'hero';
  const resolvedStatus = status === 'inactive' ? 'inactive' : 'active';

  try {
    const [result] = await pool.query(
      `INSERT INTO banners (
        title, subtitle, image_url, mobile_image_url, link_url,
        display_order, publish_from, publish_to, position, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resolvedTitle,
        resolvedSubtitle,
        resolvedImage,
        resolvedMobileImage,
        resolvedLink,
        resolvedOrder,
        publishFrom || publish_from || null,
        publishTo || publish_to || null,
        resolvedPosition,
        resolvedStatus,
      ]
    );

    const [createdRows] = await pool.query(`SELECT * FROM banners WHERE id = ?`, [result.insertId]);
    return res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: {
        banner: formatBanner(createdRows[0]),
      },
    });
  } catch (err) {
    console.error('Error creating banner:', err);
    return res.status(500).json({ success: false, message: 'Failed to create banner' });
  }
}

/**
 * PUT /api/banners/:id
 * Admin endpoint to update banner
 */
export async function updateBanner(req, res) {
  const bannerId = parseInt(req.params.id, 10);
  if (!bannerId) {
    return res.status(400).json({ success: false, message: 'Invalid banner ID' });
  }

  const pool = getPool();
  const {
    title,
    subtitle,
    imageUrl, image_url,
    mobileImageUrl, mobile_image_url,
    linkUrl, link_url,
    displayOrder, display_order,
    publishFrom, publish_from,
    publishTo, publish_to,
    position,
    status,
  } = req.body;

  try {
    const [existing] = await pool.query(`SELECT * FROM banners WHERE id = ?`, [bannerId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    const current = existing[0];
    const resolvedImage = imageUrl !== undefined || image_url !== undefined
      ? (imageUrl || image_url || '').trim()
      : current.image_url;

    if (!resolvedImage) {
      return res.status(400).json({ success: false, message: 'Banner image URL cannot be empty' });
    }

    const resolvedTitle = title !== undefined ? (title ? title.trim() : null) : current.title;
    const resolvedSubtitle = subtitle !== undefined ? (subtitle ? subtitle.trim() : null) : current.subtitle;
    const resolvedMobileImage = mobileImageUrl !== undefined || mobile_image_url !== undefined
      ? (mobileImageUrl || mobile_image_url || '').trim() || null
      : current.mobile_image_url;
    const resolvedLink = linkUrl !== undefined || link_url !== undefined
      ? (linkUrl || link_url || '/shop').trim()
      : current.link_url;
    const resolvedOrder = displayOrder !== undefined || display_order !== undefined
      ? parseInt(displayOrder ?? display_order ?? 0, 10) || 0
      : current.display_order;
    const resolvedPosition = position && ['hero', 'promo', 'feature'].includes(position)
      ? position
      : current.position;
    const resolvedStatus = status && ['active', 'inactive'].includes(status)
      ? status
      : current.status;

    await pool.query(
      `UPDATE banners SET
        title = ?,
        subtitle = ?,
        image_url = ?,
        mobile_image_url = ?,
        link_url = ?,
        display_order = ?,
        publish_from = ?,
        publish_to = ?,
        position = ?,
        status = ?
      WHERE id = ?`,
      [
        resolvedTitle,
        resolvedSubtitle,
        resolvedImage,
        resolvedMobileImage,
        resolvedLink,
        resolvedOrder,
        publishFrom || publish_from || null,
        publishTo || publish_to || null,
        resolvedPosition,
        resolvedStatus,
        bannerId,
      ]
    );

    const [updatedRows] = await pool.query(`SELECT * FROM banners WHERE id = ?`, [bannerId]);
    return res.json({
      success: true,
      message: 'Banner updated successfully',
      data: {
        banner: formatBanner(updatedRows[0]),
      },
    });
  } catch (err) {
    console.error('Error updating banner:', err);
    return res.status(500).json({ success: false, message: 'Failed to update banner' });
  }
}

/**
 * DELETE /api/banners/:id
 * Admin endpoint to delete a banner
 */
export async function deleteBanner(req, res) {
  const bannerId = parseInt(req.params.id, 10);
  if (!bannerId) {
    return res.status(400).json({ success: false, message: 'Invalid banner ID' });
  }

  const pool = getPool();
  try {
    const [result] = await pool.query(`DELETE FROM banners WHERE id = ?`, [bannerId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    return res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (err) {
    console.error('Error deleting banner:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete banner' });
  }
}

/**
 * PATCH /api/banners/:id/status
 * Admin endpoint to toggle banner status
 */
export async function toggleBannerStatus(req, res) {
  const bannerId = parseInt(req.params.id, 10);
  if (!bannerId) {
    return res.status(400).json({ success: false, message: 'Invalid banner ID' });
  }

  const pool = getPool();
  try {
    const [existing] = await pool.query(`SELECT id, status FROM banners WHERE id = ?`, [bannerId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    const newStatus = existing[0].status === 'active' ? 'inactive' : 'active';
    await pool.query(`UPDATE banners SET status = ? WHERE id = ?`, [newStatus, bannerId]);

    return res.json({
      success: true,
      message: `Banner status changed to ${newStatus}`,
      data: { status: newStatus },
    });
  } catch (err) {
    console.error('Error toggling banner status:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle banner status' });
  }
}
