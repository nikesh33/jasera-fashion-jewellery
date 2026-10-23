import { getPool } from '../config/db.js';
import { logAdminAction } from '../utils/auditLogger.js';

/**
 * Recalculate average rating and count on products table
 */
async function syncProductReviewMetrics(conn, productId) {
  try {
    const [stats] = await conn.query(
      `SELECT 
        COUNT(*) as total,
        AVG(rating) as avg_rating
       FROM reviews 
       WHERE product_id = ? AND status = 'approved'`,
      [productId]
    );

    const count = stats[0]?.total || 0;
    const avg = stats[0]?.avg_rating ? Math.round(Number(stats[0].avg_rating) * 10) / 10 : 0.0;

    await conn.query(
      'UPDATE products SET avg_rating = ?, review_count = ? WHERE id = ?',
      [avg, count, productId]
    );
  } catch (err) {
    console.warn('Could not sync product review metrics:', err.message);
  }
}

/**
 * GET /api/reviews/product/:productId
 * Public: Get approved reviews and rating metrics for a product
 */
export async function getProductReviews(req, res) {
  const productId = parseInt(req.params.productId, 10);
  if (!productId) {
    return res.status(400).json({ success: false, message: 'Invalid product ID' });
  }

  const pool = getPool();
  try {
    const [reviews] = await pool.query(
      `SELECT 
        r.id, r.rating, r.title, r.body, r.admin_reply, r.admin_replied_at, r.created_at,
        u.full_name as author_name,
        (SELECT COUNT(*) FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.user_id = r.user_id AND oi.product_id = r.product_id AND o.payment_status != 'failed') as is_verified_buyer
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.status = 'approved'
       ORDER BY r.created_at DESC`,
      [productId]
    );

    // Fetch review photos for these reviews
    const reviewIds = reviews.map((r) => r.id);
    let photosMap = {};
    if (reviewIds.length > 0) {
      const [photos] = await pool.query(
        `SELECT review_id, url FROM review_photos WHERE review_id IN (?)`,
        [reviewIds]
      );
      photos.forEach((p) => {
        if (!photosMap[p.review_id]) photosMap[p.review_id] = [];
        photosMap[p.review_id].push(p.url);
      });
    }

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      author: r.author_name,
      verifiedBuyer: Boolean(r.is_verified_buyer > 0),
      adminReply: r.admin_reply,
      adminRepliedAt: r.admin_replied_at,
      photos: photosMap[r.id] || [],
      createdAt: r.created_at,
    }));

    // Calculate rating breakdown
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    formattedReviews.forEach((r) => {
      if (breakdown[r.rating] !== undefined) breakdown[r.rating]++;
      sum += r.rating;
    });

    const averageRating = formattedReviews.length > 0
      ? Math.round((sum / formattedReviews.length) * 10) / 10
      : 0;

    return res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        reviewCount: formattedReviews.length,
        averageRating,
        breakdown,
      },
    });
  } catch (err) {
    console.error('Error fetching product reviews:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reviews' });
  }
}

/**
 * POST /api/reviews
 * Authenticated customer submits product review
 */
export async function createReview(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { productId, rating, title, body, photoUrls = [] } = req.body;
  const numRating = parseInt(rating, 10);

  if (!productId || !numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ success: false, message: 'Valid rating between 1 and 5 is required' });
  }

  const pool = getPool();
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Check if user has already reviewed this product
      const [existing] = await conn.query(
        'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
        [productId, userId]
      );

      let reviewId;
      if (existing.length > 0) {
        reviewId = existing[0].id;
        await conn.query(
          `UPDATE reviews SET
            rating = ?, title = ?, body = ?, status = 'approved', updated_at = NOW()
           WHERE id = ?`,
          [numRating, title || null, body || null, reviewId]
        );
        // Clear old photos
        await conn.query('DELETE FROM review_photos WHERE review_id = ?', [reviewId]);
      } else {
        const [insertRes] = await conn.query(
          `INSERT INTO reviews (product_id, user_id, rating, title, body, status, created_at)
           VALUES (?, ?, ?, ?, ?, 'approved', NOW())`,
          [productId, userId, numRating, title || null, body || null]
        );
        reviewId = insertRes.insertId;
      }

      // Insert photos if any
      if (Array.isArray(photoUrls) && photoUrls.length > 0) {
        for (const url of photoUrls) {
          if (!url?.trim()) continue;
          await conn.query(
            'INSERT INTO review_photos (review_id, url, created_at) VALUES (?, ?, NOW())',
            [reviewId, url.trim()]
          );
        }
      }

      // Sync product metrics
      await syncProductReviewMetrics(conn, productId);

      await conn.commit();
      return res.status(201).json({
        success: true,
        message: 'Thank you! Your verified review has been posted.',
        data: { reviewId },
      });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error creating review:', err);
    return res.status(500).json({ success: false, message: 'Failed to post review' });
  }
}

/**
 * GET /api/reviews/admin/all
 * Admin lists all reviews across products for moderation
 */
export async function getAllReviewsAdmin(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.*,
        p.name as product_name,
        p.slug as product_slug,
        u.full_name as author_name,
        u.email as author_email
      FROM reviews r
      JOIN products p ON p.id = r.product_id
      JOIN users u ON u.id = r.user_id
      ORDER BY r.id DESC
    `);

    return res.json({ success: true, data: { reviews: rows, count: rows.length } });
  } catch (err) {
    console.error('Admin fetching reviews error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
}

/**
 * PATCH /api/reviews/admin/:id/status
 * Admin moderates review status & submits reply
 */
export async function moderateReview(req, res) {
  const reviewId = parseInt(req.params.id, 10);
  const { status, adminReply } = req.body;

  const validStatuses = ['approved', 'rejected', 'pending', 'flagged'];
  const pool = getPool();

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT product_id FROM reviews WHERE id = ?', [reviewId]);
      if (existing.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'Review not found' });
      }

      await conn.query(
        `UPDATE reviews SET
          status = COALESCE(?, status),
          admin_reply = COALESCE(?, admin_reply),
          admin_replied_at = CASE WHEN ? IS NOT NULL THEN NOW() ELSE admin_replied_at END,
          updated_at = NOW()
         WHERE id = ?`,
        [status || null, adminReply || null, adminReply || null, reviewId]
      );

      await syncProductReviewMetrics(conn, existing[0].product_id);

      await logAdminAction({
        adminId: req.user?.id || 1,
        action: 'moderate_review',
        targetType: 'reviews',
        targetId: reviewId,
        afterData: { status, adminReply },
        ipAddress: req.ip,
        conn,
      });

      await conn.commit();
      return res.json({ success: true, message: 'Review updated successfully' });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error moderating review:', err);
    return res.status(500).json({ success: false, message: 'Failed to update review' });
  }
}
