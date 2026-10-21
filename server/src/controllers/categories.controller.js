import { getPool } from '../config/db.js';

export async function getCategories(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(
      `SELECT
        c.id, c.name, c.slug, c.description, c.image_url, c.display_order, c.status,
        COUNT(p.id) as item_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
       WHERE c.status = 'active'
       GROUP BY c.id
       ORDER BY c.display_order ASC`
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
        c.id, c.name, c.slug, c.description, c.image_url, c.display_order, c.status,
        COUNT(p.id) as item_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.display_order ASC`
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
  const { name, slug, description, image_url } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  const cleanSlug = (slug && slug.trim()) || name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  try {
    const [existing] = await pool.query(`SELECT id FROM categories WHERE slug = ?`, [cleanSlug]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Category with slug "${cleanSlug}" already exists` });
    }

    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, description, image_url, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [name.trim(), cleanSlug, description ? description.trim() : null, image_url ? image_url.trim() : null]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully in database',
      data: {
        id: result.insertId,
        name: name.trim(),
        slug: cleanSlug,
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
  const { name, slug, description, image_url, status } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  const cleanSlug = (slug && slug.trim()) || name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  try {
    // Check slug collision with other categories
    const [existing] = await pool.query(`SELECT id FROM categories WHERE slug = ? AND id != ?`, [cleanSlug, id]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Another category with slug "${cleanSlug}" already exists` });
    }

    const [resUpdate] = await pool.query(
      `UPDATE categories
       SET name = ?, slug = ?, description = ?, image_url = ?, status = ?
       WHERE id = ?`,
      [
        name.trim(),
        cleanSlug,
        description ? description.trim() : null,
        image_url ? image_url.trim() : null,
        status || 'active',
        id,
      ]
    );

    if (resUpdate.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({
      success: true,
      message: 'Category updated successfully in database',
      data: {
        id: Number(id),
        name: name.trim(),
        slug: cleanSlug,
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
    // 1. Check if category exists
    const [catRows] = await pool.query(`SELECT id, name FROM categories WHERE id = ?`, [id]);
    if (catRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // 2. Check and safely unlink any products belonging to this category
    const [[{ prod_count }]] = await pool.query(
      `SELECT COUNT(*) as prod_count FROM products WHERE category_id = ?`,
      [id]
    );

    if (prod_count > 0) {
      await pool.query(`UPDATE products SET category_id = NULL WHERE category_id = ?`, [id]);
    }

    // 3. Delete category
    await pool.query(`DELETE FROM categories WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: `Category "${catRows[0].name}" deleted successfully${prod_count > 0 ? ` (${prod_count} product(s) unlinked)` : ''}`,
    });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
}
