import { getPool } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';

const SEED_PAGES = [
  {
    title: 'About Us',
    slug: 'about-us',
    seo_title: 'About Jassera — Jewellery & Accessories',
    seo_description: 'Discover the story behind Jassera: handcrafted statement jewellery for everyday moments.',
    content: `<h3>Crafted for the Modern Muse</h3><p>At Jassera, we curate timeless, handcrafted jewellery pieces that celebrate your personal aesthetic without the luxury markup. From viral statement bracelets to anti-tarnish stainless steel daily wear, every design is created with passion and precision.</p>`,
    status: 'published',
  },
  {
    title: 'Terms & Conditions',
    slug: 'terms-conditions',
    seo_title: 'Terms & Conditions — Jassera Jewellery',
    seo_description: 'Official terms and conditions for ordering from Jassera Jewellery & Accessories.',
    content: `<p>Welcome to Jassera. By accessing our website and placing orders, you agree to comply with our terms of service, payment procedures, and care policies.</p>`,
    status: 'published',
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    seo_title: 'Privacy Policy — Jassera Jewellery',
    seo_description: 'How Jassera protects and respects your personal data.',
    content: `<p>Your privacy is of utmost importance to us. Jassera ensures all customer details, delivery addresses, and payment transactions are secured with industry-standard encryption.</p>`,
    status: 'published',
  },
  {
    title: 'Shipping & Returns',
    slug: 'shipping-returns',
    seo_title: 'Shipping & Returns Policy — Jassera Jewellery',
    seo_description: 'Fast pan-India delivery details and 7-day hassle-free return policy.',
    content: `<p>We offer Pan-India express delivery with live tracking. Orders above ₹499 qualify for Free Shipping. Easy 7-day replacement/return on damaged or incorrect items.</p>`,
    status: 'published',
  },
];

async function ensureDefaultCmsPages(pool) {
  try {
    const [count] = await pool.query('SELECT COUNT(*) as cnt FROM cms_pages');
    if ((count[0]?.cnt || 0) === 0) {
      for (const p of SEED_PAGES) {
        await pool.query(
          `INSERT INTO cms_pages (title, slug, content, seo_title, seo_description, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [p.title, p.slug, p.content, p.seo_title, p.seo_description, p.status]
        );
      }
    }
  } catch (err) {
    console.warn('Could not auto-seed CMS pages:', err.message);
  }
}

/**
 * GET /api/cms/:slug
 * Public endpoint to fetch published CMS page by slug
 */
export async function getCmsPage(req, res) {
  const pool = getPool();
  const slug = req.params.slug;

  const aliases = {
    'shipping-and-returns': 'shipping-returns',
    'shipping': 'shipping-policy',
    'shipping-policy': 'shipping-returns',
    'terms-and-conditions': 'terms-conditions',
    'terms': 'terms-conditions',
  };
  const alternateSlug = aliases[slug] || slug;

  try {
    await ensureDefaultCmsPages(pool);
    const [rows] = await pool.query(
      'SELECT id, title, slug, content, seo_title, seo_description, updated_at FROM cms_pages WHERE (slug = ? OR slug = ?) AND status = "published" ORDER BY id ASC LIMIT 1',
      [slug, alternateSlug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    return res.json({ success: true, data: { page: rows[0] } });
  } catch (err) {
    console.error('Error fetching CMS page:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve page content' });
  }
}

/**
 * GET /api/cms/admin/all
 * Admin endpoint to list all CMS pages
 */
export async function getAllCmsPages(req, res) {
  const pool = getPool();
  try {
    await ensureDefaultCmsPages(pool);
    const [rows] = await pool.query(
      'SELECT id, title, slug, content, seo_title, seo_description, status, updated_at, created_at FROM cms_pages ORDER BY id ASC'
    );
    return res.json({ success: true, data: { pages: rows } });
  } catch (err) {
    console.error('Error fetching CMS pages for admin:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch CMS pages' });
  }
}

/**
 * PUT /api/cms/admin/:id
 * Admin endpoint to update or create CMS page
 */
export async function saveCmsPage(req, res) {
  const pool = getPool();
  const id = parseInt(req.params.id, 10);
  const { title, slug, content, seo_title, seo_description, status = 'published' } = req.body;

  if (!title?.trim() || !slug?.trim()) {
    return res.status(400).json({ success: false, message: 'Title and slug are required' });
  }

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let targetId = id;
      if (id) {
        await conn.query(
          `UPDATE cms_pages SET
            title = ?, slug = ?, content = ?,
            seo_title = ?, seo_description = ?, status = ?, updated_at = NOW()
           WHERE id = ?`,
          [title.trim(), slug.trim(), content || '', seo_title || null, seo_description || null, status, id]
        );
      } else {
        const [insertRes] = await conn.query(
          `INSERT INTO cms_pages (title, slug, content, seo_title, seo_description, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [title.trim(), slug.trim(), content || '', seo_title || null, seo_description || null, status]
        );
        targetId = insertRes.insertId;
      }

      await logAdminAction({
        adminId: req.user?.id || 1,
        action: id ? 'update_cms_page' : 'create_cms_page',
        targetType: 'cms_pages',
        targetId,
        afterData: { title, slug, status },
        ipAddress: req.ip,
        conn,
      });

      await conn.commit();
      return res.json({ success: true, message: 'CMS page saved successfully', data: { id: targetId } });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error saving CMS page:', err);
    return res.status(500).json({ success: false, message: 'Failed to save CMS page' });
  }
}
