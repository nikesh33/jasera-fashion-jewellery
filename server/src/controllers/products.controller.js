import { getPool } from '../config/db.js';

export async function getProducts(req, res) {
  const pool = getPool();
  const { category, search, sort, minPrice, maxPrice } = req.query;

  try {
    let sql = `
      SELECT
        p.id, p.name, p.slug, p.short_description, p.long_description,
        p.category_id, p.material, p.occasion, p.gemstone,
        p.selling_price, p.mrp, p.weight_grams as weight, p.status,
        c.name as category_name, c.slug as category_slug,
        (
          SELECT url FROM product_images
          WHERE product_id = p.id
          ORDER BY display_order ASC LIMIT 1
        ) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
    `;
    const params = [];

    if (category) {
      sql += ` AND c.slug = ?`;
      params.push(category);
    }

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.short_description LIKE ? OR p.gemstone LIKE ? OR p.material LIKE ?)`;
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }

    if (minPrice) {
      sql += ` AND p.selling_price >= ?`;
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      sql += ` AND p.selling_price <= ?`;
      params.push(Number(maxPrice));
    }

    if (sort === 'price_asc') {
      sql += ` ORDER BY p.selling_price ASC`;
    } else if (sort === 'price_desc') {
      sql += ` ORDER BY p.selling_price DESC`;
    } else {
      sql += ` ORDER BY p.id ASC`;
    }

    const [rows] = await pool.query(sql, params);

    // Fetch images and variants for each product
    const productIds = rows.map((r) => r.id);
    let imagesByProduct = {};
    let variantsByProduct = {};

    if (productIds.length > 0) {
      const [images] = await pool.query(
        `SELECT id, product_id, url, type, display_order FROM product_images WHERE product_id IN (?) ORDER BY display_order ASC`,
        [productIds]
      );
      for (const img of images) {
        if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
        imagesByProduct[img.product_id].push(img);
      }

      const [variants] = await pool.query(
        `SELECT id, product_id, sku, size, price_override, stock FROM product_variants WHERE product_id IN (?)`,
        [productIds]
      );
      for (const v of variants) {
        if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
        variantsByProduct[v.product_id].push(v);
      }
    }

    const products = rows.map((p) => ({
      ...p,
      selling_price: Number(p.selling_price),
      mrp: Number(p.mrp),
      images: imagesByProduct[p.id] || [{ url: p.primary_image }],
      variants: variantsByProduct[p.id] || [],
      rating: 4.9,
      review_count: 24,
    }));

    res.json({
      success: true,
      data: {
        products,
        total: products.length,
      },
    });
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products from database' });
  }
}

export async function getProductBySlug(req, res) {
  const pool = getPool();
  const { slug } = req.params;

  try {
    const isNum = !isNaN(slug);
    const [rows] = await pool.query(
      `SELECT
        p.*, p.weight_grams as weight,
        c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${isNum ? 'p.id = ?' : 'p.slug = ?'}`,
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Jewellery piece not found' });
    }

    const p = rows[0];

    const [images] = await pool.query(
      `SELECT id, url, type, display_order FROM product_images WHERE product_id = ? ORDER BY display_order ASC`,
      [p.id]
    );

    const [variants] = await pool.query(
      `SELECT id, sku, size, price_override, stock FROM product_variants WHERE product_id = ?`,
      [p.id]
    );

    const product = {
      ...p,
      selling_price: Number(p.selling_price),
      mrp: Number(p.mrp),
      weight: p.weight_grams ? `${p.weight_grams}g` : 'Lightweight Everyday Wear',
      purity: p.material || 'Anti-Tarnish & Hypoallergenic Finish',
      primary_image: images[0]?.url || '',
      images,
      variants,
      rating: 4.9,
      review_count: 24,
    };

    res.json({
      success: true,
      data: {
        product,
      },
    });
  } catch (err) {
    console.error('Product detail fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve product details' });
  }
}

export async function createProduct(req, res) {
  const pool = getPool();
  const {
    name,
    category_id,
    selling_price,
    mrp,
    short_description,
    long_description,
    material,
    occasion,
    image_url,
    stock,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Product name is required' });
  }

  const numPrice = Number(selling_price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({ success: false, message: 'Valid selling price greater than 0 is required' });
  }

  const numStock = Number(stock !== undefined ? stock : 20);
  if (isNaN(numStock) || numStock < 0) {
    return res.status(400).json({ success: false, message: 'Available stock cannot be negative' });
  }

  if (!category_id) {
    return res.status(400).json({ success: false, message: 'Product category is required' });
  }

  const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + '-' + Math.floor(100 + Math.random() * 900);

  try {
    const [pRes] = await pool.query(
      `INSERT INTO products (
        name, slug, short_description, long_description, category_id,
        material, occasion, selling_price, mrp, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        name.trim(),
        slug,
        short_description || name.trim(),
        long_description || short_description || name.trim(),
        category_id,
        material || 'Fashion Jewellery',
        occasion || 'Daily Wear & Party',
        numPrice,
        Number(mrp && mrp > numPrice ? mrp : numPrice * 1.5),
      ]
    );

    const productId = pRes.insertId;

    if (image_url && image_url.trim()) {
      await pool.query(
        `INSERT INTO product_images (product_id, url, type, display_order)
         VALUES (?, ?, 'front', 0)`,
        [productId, image_url.trim()]
      );
    }

    const sku = 'SUV-PRD-' + productId;
    await pool.query(
      `INSERT INTO product_variants (product_id, sku, size, price_override, stock)
       VALUES (?, ?, 'Standard Free Size', ?, ?)`,
      [productId, sku, numPrice, numStock]
    );

    res.status(201).json({
      success: true,
      message: 'Product added successfully to catalogue',
      data: {
        id: productId,
        name,
        slug,
      },
    });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ success: false, message: 'Failed to create product in database' });
  }
}

export async function updateProduct(req, res) {
  const pool = getPool();
  const { id } = req.params;
  const {
    name,
    category_id,
    selling_price,
    mrp,
    short_description,
    long_description,
    material,
    occasion,
    image_url,
    stock,
    status,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Product name is required' });
  }

  const numPrice = Number(selling_price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({ success: false, message: 'Valid selling price greater than 0 is required' });
  }

  const numStock = Number(stock !== undefined ? stock : 0);
  if (isNaN(numStock) || numStock < 0) {
    return res.status(400).json({ success: false, message: 'Available stock cannot be negative' });
  }

  try {
    const [pUpdate] = await pool.query(
      `UPDATE products SET
        name = ?,
        category_id = ?,
        selling_price = ?,
        mrp = ?,
        short_description = ?,
        long_description = ?,
        material = ?,
        occasion = ?,
        status = ?
       WHERE id = ?`,
      [
        name.trim(),
        category_id,
        numPrice,
        Number(mrp || numPrice * 1.5),
        short_description || name.trim(),
        long_description || short_description || name.trim(),
        material || 'Fashion Jewellery',
        occasion || 'Daily Wear & Party',
        status || 'active',
        id,
      ]
    );

    if (pUpdate.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update variant stock and price
    await pool.query(
      `UPDATE product_variants SET stock = ?, price_override = ? WHERE product_id = ?`,
      [numStock, numPrice, id]
    );

    // Update primary image if provided
    if (image_url && image_url.trim()) {
      const [imgRows] = await pool.query(
        `SELECT id FROM product_images WHERE product_id = ? ORDER BY display_order ASC LIMIT 1`,
        [id]
      );
      if (imgRows.length > 0) {
        await pool.query(`UPDATE product_images SET url = ? WHERE id = ?`, [image_url.trim(), imgRows[0].id]);
      } else {
        await pool.query(
          `INSERT INTO product_images (product_id, url, type, display_order) VALUES (?, ?, 'front', 0)`,
          [id, image_url.trim()]
        );
      }
    }

    res.json({
      success: true,
      message: 'Product updated successfully in catalogue',
      data: { id: Number(id), name: name.trim() },
    });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
}

export async function deleteProduct(req, res) {
  const pool = getPool();
  const { id } = req.params;

  try {
    // Check if product is referenced in existing orders
    const [[{ order_count }]] = await pool.query(
      `SELECT COUNT(*) as order_count FROM order_items WHERE product_id = ?`,
      [id]
    );

    if (order_count > 0) {
      // Archive instead of hard-deleting to preserve historical customer orders
      await pool.query(`UPDATE products SET status = 'archived' WHERE id = ?`, [id]);
      return res.json({
        success: true,
        message: 'Product archived from storefront (preserved for existing order records)',
      });
    }

    // Safe to hard-delete if no orders exist
    await pool.query('DELETE FROM product_images WHERE product_id = ?', [id]);
    await pool.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ success: true, message: 'Product removed from catalogue' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
}

