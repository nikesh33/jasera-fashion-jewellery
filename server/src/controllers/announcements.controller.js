import { getPool } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';

const DEFAULT_ANNOUNCEMENTS = [
  {
    text: 'Free Pan-India Delivery on orders above ₹499',
    link_text: 'Shop Collection',
    link_url: '/shop',
    is_active: true,
    display_order: 1,
  },
  {
    text: 'Handcrafted Statement Jewellery & Accessories',
    link_text: 'Explore Jhumkas',
    link_url: '/shop?category=jhumkas',
    is_active: true,
    display_order: 2,
  },
  {
    text: 'Special Welcome Offer: Flat 10% Off with code JASSERA10',
    link_text: 'Claim Discount',
    link_url: '/shop',
    is_active: true,
    display_order: 3,
  },
  {
    text: 'Need Custom Styling Advice or Gifting Assistance?',
    link_text: 'WhatsApp Concierge',
    link_url: '/contact',
    is_active: true,
    display_order: 4,
  },
  {
    text: 'Express BlueDart & Delhivery Tracking',
    link_text: 'Track Parcel',
    link_url: '/track-order',
    is_active: true,
    display_order: 5,
  },
];

export async function ensureAnnouncementsTable(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        text VARCHAR(255) NOT NULL,
        link_text VARCHAR(100) DEFAULT NULL,
        link_url VARCHAR(255) DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM announcements');
    if ((rows[0]?.cnt || 0) === 0) {
      for (const item of DEFAULT_ANNOUNCEMENTS) {
        await pool.query(
          `INSERT INTO announcements (text, link_text, link_url, is_active, display_order)
           VALUES (?, ?, ?, ?, ?)`,
          [item.text, item.link_text, item.link_url, item.is_active, item.display_order]
        );
      }
    }
  } catch (err) {
    console.warn('Could not auto-verify announcements table:', err.message);
  }
}

function formatAnnouncement(a) {
  if (!a) return null;
  return {
    id: a.id,
    text: a.text || '',
    linkText: a.link_text || '',
    linkUrl: a.link_url || '',
    isActive: Boolean(a.is_active),
    displayOrder: a.display_order ?? 0,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
    // snake_case
    link_text: a.link_text || '',
    link_url: a.link_url || '',
    is_active: Boolean(a.is_active),
    display_order: a.display_order ?? 0,
  };
}

/**
 * GET /api/announcements
 * Public endpoint to fetch all active announcements for storefront header
 */
export async function getPublicAnnouncements(req, res) {
  const pool = getPool();
  try {
    await ensureAnnouncementsTable(pool);
    const [rows] = await pool.query(
      `SELECT * FROM announcements 
       WHERE is_active = TRUE 
       ORDER BY display_order ASC, id ASC`
    );

    return res.json({
      success: true,
      announcements: rows.map(formatAnnouncement),
    });
  } catch (err) {
    console.error('Error fetching public announcements:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load announcements',
    });
  }
}

/**
 * GET /api/announcements/admin
 * Admin endpoint to fetch all announcements (active & inactive)
 */
export async function getAdminAnnouncements(req, res) {
  const pool = getPool();
  try {
    await ensureAnnouncementsTable(pool);
    const [rows] = await pool.query(
      `SELECT * FROM announcements ORDER BY display_order ASC, id ASC`
    );

    return res.json({
      success: true,
      announcements: rows.map(formatAnnouncement),
    });
  } catch (err) {
    console.error('Error fetching admin announcements:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load announcements for admin',
    });
  }
}

/**
 * POST /api/announcements/admin
 * Admin endpoint to create a new announcement
 */
export async function createAnnouncement(req, res) {
  const pool = getPool();
  const { text, link_text, linkText, link_url, linkUrl, is_active, isActive, display_order, displayOrder } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Announcement text is required',
    });
  }

  const finalLinkText = (link_text || linkText || '').trim();
  const finalLinkUrl = (link_url || linkUrl || '').trim();
  const finalActive = is_active !== undefined ? Boolean(is_active) : (isActive !== undefined ? Boolean(isActive) : true);
  const finalOrder = Number.isInteger(display_order) ? display_order : (Number.isInteger(displayOrder) ? displayOrder : 0);

  try {
    const [result] = await pool.query(
      `INSERT INTO announcements (text, link_text, link_url, is_active, display_order)
       VALUES (?, ?, ?, ?, ?)`,
      [text.trim(), finalLinkText, finalLinkUrl, finalActive, finalOrder]
    );

    const [createdRows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [result.insertId]);
    const createdItem = formatAnnouncement(createdRows[0]);

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'create_announcement',
      targetType: 'announcements',
      targetId: result.insertId,
      afterData: createdItem,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement: createdItem,
    });
  } catch (err) {
    console.error('Error creating announcement:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
    });
  }
}

/**
 * PUT /api/announcements/admin/:id
 * Admin endpoint to update an existing announcement
 */
export async function updateAnnouncement(req, res) {
  const pool = getPool();
  const { id } = req.params;
  const { text, link_text, linkText, link_url, linkUrl, is_active, isActive, display_order, displayOrder } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    const current = existing[0];
    const newText = text !== undefined ? String(text).trim() : current.text;
    const newLinkText = link_text !== undefined ? String(link_text).trim() : (linkText !== undefined ? String(linkText).trim() : current.link_text);
    const newLinkUrl = link_url !== undefined ? String(link_url).trim() : (linkUrl !== undefined ? String(linkUrl).trim() : current.link_url);
    const newActive = is_active !== undefined ? Boolean(is_active) : (isActive !== undefined ? Boolean(isActive) : Boolean(current.is_active));
    const newOrder = display_order !== undefined ? Number(display_order) : (displayOrder !== undefined ? Number(displayOrder) : current.display_order);

    await pool.query(
      `UPDATE announcements 
       SET text = ?, link_text = ?, link_url = ?, is_active = ?, display_order = ?
       WHERE id = ?`,
      [newText, newLinkText, newLinkUrl, newActive, newOrder, id]
    );

    const [updatedRows] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    const updatedItem = formatAnnouncement(updatedRows[0]);

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'update_announcement',
      targetType: 'announcements',
      targetId: id,
      beforeData: formatAnnouncement(current),
      afterData: updatedItem,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: updatedItem,
    });
  } catch (err) {
    console.error('Error updating announcement:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
    });
  }
}

/**
 * DELETE /api/announcements/admin/:id
 * Admin endpoint to delete an announcement
 */
export async function deleteAnnouncement(req, res) {
  const pool = getPool();
  const { id } = req.params;

  try {
    const [existing] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    await pool.query('DELETE FROM announcements WHERE id = ?', [id]);

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'delete_announcement',
      targetType: 'announcements',
      targetId: id,
      beforeData: formatAnnouncement(existing[0]),
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
    });
  }
}
