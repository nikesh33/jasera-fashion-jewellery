import { getPool } from '../config/db.js';

/**
 * POST /api/contact
 * Public endpoint to submit contact form
 */
export async function submitContactForm(req, res) {
  const { name, email, phone, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required fields',
    });
  }

  const pool = getPool();
  try {
    const [result] = await pool.query(
      `INSERT INTO contact_submissions (name, email, phone, subject, message, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        phone ? phone.trim() : null,
        subject ? subject.trim() : 'Customer Inquiry',
        message.trim(),
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Our jewellery care team will get back to you within 24 hours.',
      data: { id: result.insertId },
    });
  } catch (err) {
    console.error('Contact submission error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit inquiry' });
  }
}

/**
 * GET /api/contact/admin
 * Admin endpoint to list all customer inquiries
 */
export async function getContactSubmissions(req, res) {
  const pool = getPool();
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, subject, message, created_at FROM contact_submissions ORDER BY id DESC'
    );
    return res.json({
      success: true,
      data: {
        submissions: rows,
        count: rows.length,
      },
    });
  } catch (err) {
    console.error('Error fetching contact submissions:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve inquiries' });
  }
}
