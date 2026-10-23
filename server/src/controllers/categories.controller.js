import { getPool } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';

export async function getCategories(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(
      `SELECT
        c.id, c.parent_id, c.name, c.slug, c.description, c.image_url,
        c.display_order, c.seo_title, c.seo_description, c.status,
        parent.name as parent_name,
        COUNT(p.id) as item_count
       FROM categories c
       LEFT JOIN categories parent ON parent.id = c.parent_id
       LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
       WHERE c.status = 'active'
       GROUP BY c.id
       ORDER BY c.display_order ASC, c.name ASC`
    );

    res.json({
      success: true,
      data: {
        categories: rows,
      },
    });
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
}

export async function getAllCategoriesAdmin(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(
      `SELECT
        c.id, c.parent_id, c.name, c.slug, c.description, c.image_url,
        c.display_order, c.seo_title, c.seo_description, c.status,
        parent.name as parent_name,
        COUNT(p.id) as item_count
       FROM categories c
       LEFT JOIN categories parent ON parent.id = c.parent_id
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.display_order ASC, c.name ASC`
    );

    res.json({
      success: true,
      data: {
        categories: rows,
      },
    });
  } catch (err) {
    console.error('Admin categories error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin categories' });
  }
}

export async function createCategory(req, res) {
  const pool = getPool();
  const {
    name,
    slug,
    description,
    image_url,
    parent_id,
    seo_title,
    seo_description,
    display_order = 0,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  const cleanSlug = (slug && slug.trim()) || name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  const parsedParentId = parent_id ? parseInt(parent_id, 10) : null;

  try {
    const [existing] = await pool.query(`SELECT id FROM categories WHERE slug = ?`, [cleanSlug]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Category with slug "${cleanSlug}" already exists` });
    }

    const [result] = await pool.query(
      `INSERT INTO categories (
        parent_id, name, slug, description, image_url,
        display_order, seo_title, seo_description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        parsedParentId,
        name.trim(),
        cleanSlug,
        description ? description.trim() : null,
        image_url ? image_url.trim() : null,
        Number(display_order) || 0,
        seo_title ? seo_title.trim() : null,
        seo_description ? seo_description.trim() : null,
      ]
    );

    const newId = result.insertId;

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'create_category',
      targetType: 'categories',
      targetId: newId,
      afterData: { name: name.trim(), slug: cleanSlug, parent_id: parsedParentId },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully in database',
      data: {
        id: newId,
        name: name.trim(),
        slug: cleanSlug,
        parent_id: parsedParentId,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
      },
    });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
}

export async function updateCategory(req, res) {
  const pool = getPool();
  const { id } = req.params;
  const {
    name,
    slug,
    description,
    image_url,
    parent_id,
    seo_title,
    seo_description,
    display_order,
    status,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  const cleanSlug = (slug && slug.trim()) || name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  const parsedParentId = parent_id ? parseInt(parent_id, 10) : null;

  try {
    const [existing] = await pool.query(`SELECT id FROM categories WHERE slug = ? AND id != ?`, [cleanSlug, id]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Another category with slug "${cleanSlug}" already exists` });
    }

    const [oldRows] = await pool.query(`SELECT * FROM categories WHERE id = ?`, [id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const [resUpdate] = await pool.query(
      `UPDATE categories
       SET parent_id = ?, name = ?, slug = ?, description = ?, image_url = ?,
           display_order = ?, seo_title = ?, seo_description = ?, status = ?
       WHERE id = ?`,
      [
        parsedParentId,
        name.trim(),
        cleanSlug,
        description ? description.trim() : null,
        image_url ? image_url.trim() : null,
        display_order !== undefined ? Number(display_order) : oldRows[0].display_order,
        seo_title !== undefined ? (seo_title ? seo_title.trim() : null) : oldRows[0].seo_title,
        seo_description !== undefined ? (seo_description ? seo_description.trim() : null) : oldRows[0].seo_description,
        status || oldRows[0].status,
        id,
      ]
    );

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'update_category',
      targetType: 'categories',
      targetId: parseInt(id, 10),
      beforeData: oldRows[0],
      afterData: { name: name.trim(), slug: cleanSlug, parent_id: parsedParentId },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Category updated successfully in database',
      data: {
        id: Number(id),
        name: name.trim(),
        slug: cleanSlug,
        parent_id: parsedParentId,
      },
    });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
}

export async function deleteCategory(req, res) {
  const pool = getPool();
  const { id } = req.params;

  try {
    const [catRows] = await pool.query(`SELECT id, name FROM categories WHERE id = ?`, [id]);
    if (catRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const [[{ prod_count }]] = await pool.query(
      `SELECT COUNT(*) as prod_count FROM products WHERE category_id = ?`,
      [id]
    );

    if (prod_count > 0) {
      await pool.query(`UPDATE products SET category_id = NULL WHERE category_id = ?`, [id]);
    }

    await pool.query(`DELETE FROM categories WHERE id = ?`, [id]);

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'delete_category',
      targetType: 'categories',
      targetId: parseInt(id, 10),
      beforeData: catRows[0],
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Category "${catRows[0].name}" deleted successfully${prod_count > 0 ? ` (${prod_count} product(s) unlinked)` : ''}`,
    });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
}
