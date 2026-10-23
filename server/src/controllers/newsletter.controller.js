import { getPool } from '../config/db.js';

/**
 * POST /api/newsletter/subscribe
 * Public endpoint to subscribe an email to newsletter
 */
export async function subscribeNewsletter(req, res) {
  const { email } = req.body;
  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const pool = getPool();

  try {
    const [existing] = await pool.query(
      'SELECT id, unsubscribed_at FROM newsletter_subscribers WHERE email = ?',
      [cleanEmail]
    );

    if (existing.length > 0) {
      if (existing[0].unsubscribed_at) {
        // Re-subscribe
        await pool.query(
          'UPDATE newsletter_subscribers SET unsubscribed_at = NULL, subscribed_at = NOW() WHERE id = ?',
          [existing[0].id]
        );
        return res.json({ success: true, message: 'Welcome back! You have been re-subscribed to our newsletter.' });
      }
      return res.json({ success: true, message: 'You are already subscribed to the Jassera newsletter!' });
    }

    await pool.query(
      'INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES (?, NOW())',
      [cleanEmail]
    );

    return res.status(201).json({
      success: true,
      message: 'Thank you for subscribing! Check your inbox for exclusive drops & perks.',
    });
  } catch (err) {
    console.error('Newsletter subscription error:', err);
    return res.status(500).json({ success: false, message: 'Failed to subscribe to newsletter' });
  }
}

/**
 * GET /api/newsletter/admin
 * Admin endpoint to list all newsletter subscribers
 */
export async function getNewsletterSubscribers(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(
      'SELECT id, email, subscribed_at, unsubscribed_at FROM newsletter_subscribers ORDER BY id DESC'
    );
    return res.json({
      success: true,
      data: {
        subscribers: rows,
        count: rows.length,
      },
    });
  } catch (err) {
    console.error('Error fetching subscribers:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch newsletter subscribers' });
  }
}
