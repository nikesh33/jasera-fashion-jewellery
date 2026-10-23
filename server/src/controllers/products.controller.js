import { getPool } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';
import { recordInventoryTransaction } from '../utils/inventoryLogger.js';

export async function getProducts(req, res) {
  const pool = getPool();
  const { category, collection, search, sort, minPrice, maxPrice } = req.query;

  try {
    let sql = `
      SELECT
        p.id, p.name, p.slug, p.short_description, p.long_description,
        p.category_id, p.collection_id, p.brand, p.material, p.occasion,
        p.colour, p.gemstone, p.selling_price, p.mrp, p.cost_price,
        p.weight_grams as weight, p.dimensions, p.tags, p.care_guide,
        p.avg_rating, p.review_count, p.units_sold, p.status,
        c.name as category_name, c.slug as category_slug,
        col.name as collection_name, col.slug as collection_slug,
        (
          SELECT url FROM product_images
          WHERE product_id = p.id
          ORDER BY display_order ASC, id ASC LIMIT 1
        ) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN collections col ON p.collection_id = col.id
      WHERE p.status = 'active'
    `;
    const params = [];

    if (category) {
      sql += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (collection) {
      sql += ` AND (col.slug = ? OR col.id = ?)`;
      params.push(collection, collection);
    }

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.short_description LIKE ? OR p.gemstone LIKE ? OR p.material LIKE ? OR p.tags LIKE ?)`;
      const q = `%${search}%`;
      params.push(q, q, q, q, q);
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
    } else if (sort === 'rating') {
      sql += ` ORDER BY p.avg_rating DESC, p.review_count DESC`;
    } else if (sort === 'popularity') {
      sql += ` ORDER BY p.units_sold DESC, p.id DESC`;
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
        `SELECT id, product_id, variant_id, url, alt_text, type, display_order 
         FROM product_images WHERE product_id IN (?) ORDER BY display_order ASC, id ASC`,
        [productIds]
      );
      for (const img of images) {
        if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
        imagesByProduct[img.product_id].push(img);
      }

      const [variants] = await pool.query(
        `SELECT id, product_id, sku, size, material, colour, price_override, stock, 
                low_stock_threshold, reorder_point, weight_grams, dimensions, is_default 
         FROM product_variants WHERE product_id IN (?) ORDER BY is_default DESC, id ASC`,
        [productIds]
      );
      for (const v of variants) {
        if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
        variantsByProduct[v.product_id].push(v);
      }
    }

    const products = rows.map((p) => {
      const pImages = imagesByProduct[p.id] || [];
      const primaryUrl = p.primary_image || (pImages.length > 0 ? pImages[0].url : '');
      return {
        ...p,
        selling_price: Number(p.selling_price),
        mrp: Number(p.mrp),
        cost_price: p.cost_price ? Number(p.cost_price) : null,
        primary_image: primaryUrl,
        images: pImages.length > 0 ? pImages : [{ url: primaryUrl, alt_text: p.name, type: 'front' }],
        variants: variantsByProduct[p.id] || [],
        rating: Number(p.avg_rating) || 4.9,
        review_count: Number(p.review_count) || 0,
      };
    });

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
        c.name as category_name, c.slug as category_slug,
        col.name as collection_name, col.slug as collection_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN collections col ON p.collection_id = col.id
       WHERE ${isNum ? 'p.id = ?' : 'p.slug = ?'}`,
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Jewellery piece not found' });
    }

    const p = rows[0];

    const [images] = await pool.query(
      `SELECT id, product_id, variant_id, url, alt_text, type, display_order 
       FROM product_images WHERE product_id = ? ORDER BY display_order ASC, id ASC`,
      [p.id]
    );

    const [variants] = await pool.query(
      `SELECT id, product_id, sku, size, material, colour, price_override, stock, 
              low_stock_threshold, reorder_point, weight_grams, dimensions, is_default 
       FROM product_variants WHERE product_id = ? ORDER BY is_default DESC, id ASC`,
      [p.id]
    );

    const primaryUrl = images[0]?.url || '';

    const product = {
      ...p,
      selling_price: Number(p.selling_price),
      mrp: Number(p.mrp),
      cost_price: p.cost_price ? Number(p.cost_price) : null,
      weight: p.weight_grams ? `${p.weight_grams}g` : 'Lightweight Everyday Wear',
      purity: p.material || 'Anti-Tarnish & Hypoallergenic Finish',
      primary_image: primaryUrl,
      images: images.length > 0 ? images : [{ url: primaryUrl, alt_text: p.name, type: 'front' }],
      variants,
      rating: Number(p.avg_rating) || 4.9,
      review_count: Number(p.review_count) || 0,
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
    collection_id,
    brand = 'Jassera',
    selling_price,
    mrp,
    cost_price,
    short_description,
    long_description,
    material,
    occasion,
    colour,
    gemstone,
    hsn_code,
    gst_rate = 3.0,
    weight_grams,
    dimensions,
    care_guide,
    tags,
    image_url,
    stock = 20,
    status = 'active',
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
        name, slug, short_description, long_description, category_id, collection_id,
        brand, material, occasion, colour, gemstone, selling_price, mrp, cost_price,
        hsn_code, gst_rate, weight_grams, dimensions, care_guide, tags, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        slug,
        short_description || name.trim(),
        long_description || short_description || name.trim(),
        category_id,
        collection_id || null,
        brand || 'Jassera',
        material || 'Fashion Jewellery',
        occasion || 'Daily Wear & Party',
        colour || null,
        gemstone || null,
        numPrice,
        Number(mrp && mrp > numPrice ? mrp : numPrice * 1.5),
        cost_price ? Number(cost_price) : null,
        hsn_code || '71179090',
        Number(gst_rate) || 3.0,
        weight_grams ? Number(weight_grams) : null,
        dimensions || null,
        care_guide || 'Avoid contact with perfumes, chemicals, and water. Store in a dry box.',
        tags || null,
        status || 'active',
      ]
    );

    const productId = pRes.insertId;

    if (image_url && image_url.trim()) {
      await pool.query(
        `INSERT INTO product_images (product_id, url, alt_text, type, display_order)
         VALUES (?, ?, ?, 'front', 0)`,
        [productId, image_url.trim(), name.trim()]
      );
    }

    const sku = 'JAS-PRD-' + productId;
    const [vRes] = await pool.query(
      `INSERT INTO product_variants (
        product_id, sku, size, material, colour, price_override,
        stock, weight_grams, dimensions, is_default
      ) VALUES (?, ?, 'Standard Free Size', ?, ?, ?, ?, ?, ?, 1)`,
      [
        productId,
        sku,
        material || null,
        colour || null,
        numPrice,
        numStock,
        weight_grams ? Number(weight_grams) : null,
        dimensions || null,
      ]
    );

    // Record initial stock receipt
    await recordInventoryTransaction({
      variantId: vRes.insertId,
      quantityChange: numStock,
      reason: 'receipt',
      referenceId: productId,
      note: 'Initial catalog stock entry',
      actorId: req.user?.id || 1,
    });

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'create_product',
      targetType: 'products',
      targetId: productId,
      afterData: { name: name.trim(), slug, selling_price: numPrice, stock: numStock },
      ipAddress: req.ip,
    });

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
    collection_id,
    brand,
    selling_price,
    mrp,
    cost_price,
    short_description,
    long_description,
    material,
    occasion,
    colour,
    gemstone,
    hsn_code,
    gst_rate,
    weight_grams,
    dimensions,
    care_guide,
    tags,
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

  try {
    const [oldRows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const oldP = oldRows[0];

    await pool.query(
      `UPDATE products SET
        name = ?,
        category_id = ?,
        collection_id = ?,
        brand = COALESCE(?, brand),
        selling_price = ?,
        mrp = ?,
        cost_price = ?,
        short_description = ?,
        long_description = ?,
        material = ?,
        occasion = ?,
        colour = ?,
        gemstone = ?,
        hsn_code = COALESCE(?, hsn_code),
        gst_rate = COALESCE(?, gst_rate),
        weight_grams = ?,
        dimensions = ?,
        care_guide = ?,
        tags = ?,
        status = ?
       WHERE id = ?`,
      [
        name.trim(),
        category_id || oldP.category_id,
        collection_id !== undefined ? (collection_id || null) : oldP.collection_id,
        brand || null,
        numPrice,
        Number(mrp || numPrice * 1.5),
        cost_price ? Number(cost_price) : null,
        short_description || name.trim(),
        long_description || short_description || name.trim(),
        material || 'Fashion Jewellery',
        occasion || 'Daily Wear & Party',
        colour || null,
        gemstone || null,
        hsn_code || null,
        gst_rate ? Number(gst_rate) : null,
        weight_grams ? Number(weight_grams) : null,
        dimensions || null,
        care_guide || null,
        tags || null,
        status || 'active',
        id,
      ]
    );

    // Update default variant price & stock if provided
    if (stock !== undefined) {
      const numStock = Number(stock);
      const [vRows] = await pool.query(
        'SELECT id, stock FROM product_variants WHERE product_id = ? ORDER BY is_default DESC LIMIT 1',
        [id]
      );
      if (vRows.length > 0) {
        const delta = numStock - vRows[0].stock;
        await pool.query(
          `UPDATE product_variants SET stock = ?, price_override = ? WHERE id = ?`,
          [numStock, numPrice, vRows[0].id]
        );
        if (delta !== 0) {
          await recordInventoryTransaction({
            variantId: vRows[0].id,
            quantityChange: delta,
            reason: delta > 0 ? 'receipt' : 'adjustment',
            referenceId: Number(id),
            note: 'Admin stock adjustment from edit modal',
            actorId: req.user?.id || 1,
          });
        }
      }
    }

    // Update primary image if provided
    if (image_url && image_url.trim()) {
      const [imgRows] = await pool.query(
        `SELECT id FROM product_images WHERE product_id = ? ORDER BY display_order ASC LIMIT 1`,
        [id]
      );
      if (imgRows.length > 0) {
        await pool.query(`UPDATE product_images SET url = ?, alt_text = ? WHERE id = ?`, [
          image_url.trim(),
          name.trim(),
          imgRows[0].id,
        ]);
      } else {
        await pool.query(
          `INSERT INTO product_images (product_id, url, alt_text, type, display_order) VALUES (?, ?, ?, 'front', 0)`,
          [id, image_url.trim(), name.trim()]
        );
      }
    }

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'update_product',
      targetType: 'products',
      targetId: parseInt(id, 10),
      beforeData: oldP,
      afterData: { name: name.trim(), selling_price: numPrice, status },
      ipAddress: req.ip,
    });

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
    const [[{ order_count }]] = await pool.query(
      `SELECT COUNT(*) as order_count FROM order_items WHERE product_id = ?`,
      [id]
    );

    if (order_count > 0) {
      await pool.query(`UPDATE products SET status = 'archived' WHERE id = ?`, [id]);
      await logAdminAction({
        adminId: req.user?.id || 1,
        action: 'archive_product',
        targetType: 'products',
        targetId: parseInt(id, 10),
        afterData: { status: 'archived', reason: 'Has orders; archived rather than deleted' },
        ipAddress: req.ip,
      });
      return res.json({
        success: true,
        message: 'Product archived from storefront (preserved for existing customer orders)',
      });
    }

    await pool.query('DELETE FROM product_images WHERE product_id = ?', [id]);
    await pool.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    await logAdminAction({
      adminId: req.user?.id || 1,
      action: 'delete_product',
      targetType: 'products',
      targetId: parseInt(id, 10),
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Product removed from catalogue' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
}

/**
 * Product Image Management (Item #18: variant_id, alt_text, display_order)
 */
export async function addProductImage(req, res) {
  const productId = parseInt(req.params.id, 10);
  const { url, alt_text, variant_id = null, display_order = 0, type = 'front' } = req.body;

  if (!url?.trim()) {
    return res.status(400).json({ success: false, message: 'Image URL is required' });
  }

  const pool = getPool();
  try {
    const [result] = await pool.query(
      `INSERT INTO product_images (product_id, variant_id, url, alt_text, display_order, type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [productId, variant_id || null, url.trim(), alt_text || null, Number(display_order) || 0, type]
    );

    return res.status(201).json({
      success: true,
      message: 'Product image added successfully',
      data: { id: result.insertId, product_id: productId, url },
    });
  } catch (err) {
    console.error('Error adding product image:', err);
    return res.status(500).json({ success: false, message: 'Failed to add image' });
  }
}

export async function deleteProductImage(req, res) {
  const imageId = parseInt(req.params.imageId, 10);
  const pool = getPool();
  try {
    await pool.query('DELETE FROM product_images WHERE id = ?', [imageId]);
    return res.json({ success: true, message: 'Product image removed successfully' });
  } catch (err) {
    console.error('Error deleting product image:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
}

/**
 * Product Variant Management (Item #19: product_variants table)
 */
export async function addProductVariant(req, res) {
  const productId = parseInt(req.params.id, 10);
  const {
    sku,
    size,
    material,
    colour,
    price_override,
    stock = 0,
    low_stock_threshold = 5,
    reorder_point = 10,
    weight_grams,
    dimensions,
    is_default = 0,
  } = req.body;

  const generatedSku = sku?.trim() || `JAS-VAR-${productId}-${Date.now().toString().slice(-4)}`;
  const pool = getPool();

  try {
    const [result] = await pool.query(
      `INSERT INTO product_variants (
        product_id, sku, size, material, colour, price_override,
        stock, low_stock_threshold, reorder_point, weight_grams, dimensions, is_default, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        productId,
        generatedSku,
        size || 'Standard Free Size',
        material || null,
        colour || null,
        price_override ? Number(price_override) : null,
        Number(stock) || 0,
        Number(low_stock_threshold) || 5,
        Number(reorder_point) || 10,
        weight_grams ? Number(weight_grams) : null,
        dimensions || null,
        is_default ? 1 : 0,
      ]
    );

    const variantId = result.insertId;

    if (stock > 0) {
      await recordInventoryTransaction({
        variantId,
        quantityChange: Number(stock),
        reason: 'receipt',
        referenceId: productId,
        note: 'New variant initial stock',
        actorId: req.user?.id || 1,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Product variant created successfully',
      data: { id: variantId, product_id: productId, sku: generatedSku },
    });
  } catch (err) {
    console.error('Error adding product variant:', err);
    return res.status(500).json({ success: false, message: 'Failed to add variant' });
  }
}

export async function updateProductVariant(req, res) {
  const variantId = parseInt(req.params.variantId, 10);
  const {
    sku,
    size,
    material,
    colour,
    price_override,
    stock,
    low_stock_threshold,
    reorder_point,
    weight_grams,
    dimensions,
    is_default,
  } = req.body;

  const pool = getPool();
  try {
    const [oldRows] = await pool.query('SELECT * FROM product_variants WHERE id = ?', [variantId]);
    if (oldRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }
    const oldV = oldRows[0];

    await pool.query(
      `UPDATE product_variants SET
        sku = COALESCE(?, sku),
        size = COALESCE(?, size),
        material = COALESCE(?, material),
        colour = COALESCE(?, colour),
        price_override = ?,
        stock = COALESCE(?, stock),
        low_stock_threshold = COALESCE(?, low_stock_threshold),
        reorder_point = COALESCE(?, reorder_point),
        weight_grams = ?,
        dimensions = ?,
        is_default = COALESCE(?, is_default)
       WHERE id = ?`,
      [
        sku || null,
        size || null,
        material || null,
        colour || null,
        price_override !== undefined ? (price_override ? Number(price_override) : null) : oldV.price_override,
        stock !== undefined ? Number(stock) : oldV.stock,
        low_stock_threshold !== undefined ? Number(low_stock_threshold) : oldV.low_stock_threshold,
        reorder_point !== undefined ? Number(reorder_point) : oldV.reorder_point,
        weight_grams !== undefined ? (weight_grams ? Number(weight_grams) : null) : oldV.weight_grams,
        dimensions !== undefined ? dimensions : oldV.dimensions,
        is_default !== undefined ? (is_default ? 1 : 0) : oldV.is_default,
        variantId,
      ]
    );

    if (stock !== undefined && Number(stock) !== oldV.stock) {
      const delta = Number(stock) - oldV.stock;
      await recordInventoryTransaction({
        variantId,
        quantityChange: delta,
        reason: delta > 0 ? 'receipt' : 'adjustment',
        referenceId: oldV.product_id,
        note: 'Admin variant stock adjustment',
        actorId: req.user?.id || 1,
      });
    }

    return res.json({ success: true, message: 'Variant updated successfully' });
  } catch (err) {
    console.error('Error updating variant:', err);
    return res.status(500).json({ success: false, message: 'Failed to update variant' });
  }
}

export async function deleteProductVariant(req, res) {
  const variantId = parseInt(req.params.variantId, 10);
  const pool = getPool();
  try {
    await pool.query('DELETE FROM product_variants WHERE id = ?', [variantId]);
    return res.json({ success: true, message: 'Variant removed successfully' });
  } catch (err) {
    console.error('Error deleting variant:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete variant' });
  }
}
