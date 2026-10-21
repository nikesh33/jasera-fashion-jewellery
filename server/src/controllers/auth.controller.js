import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';

// Customer-only Login (authenticates strictly from users table)
export async function customerLogin(req, res) {
  const { email, password, phone } = req.body;
  const identifier = (email || phone || '').toLowerCase().trim();

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Email or phone and password are required' });
  }

  const pool = getPool();

  try {
    const [userRows] = await pool.query(
      `SELECT id, full_name, email, phone, password_hash, status FROM users WHERE LOWER(email) = ? OR phone = ?`,
      [identifier, identifier]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email/phone or password' });
    }

    const customer = userRows[0];
    if (customer.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your customer account is currently inactive' });
    }

    const isValid = await bcrypt.compare(password, customer.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email/phone or password' });
    }

    const token = signAccessToken({
      id: customer.id,
      email: customer.email,
      role: 'customer',
      isAdmin: false,
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: customer.id,
          name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
          role: 'customer',
          isAdmin: false,
        },
        token,
      },
    });
  } catch (err) {
    console.error('Customer login error:', err);
    return res.status(500).json({ success: false, message: 'Authentication service temporarily unavailable' });
  }
}

// Store Administrator Login (authenticates strictly from admin_users table)
export async function adminLogin(req, res) {
  const { email, password } = req.body;
  const cleanEmail = (email || '').toLowerCase().trim();

  if (!cleanEmail || !password) {
    return res.status(400).json({ success: false, message: 'Admin email and password are required' });
  }

  const pool = getPool();

  try {
    const [adminRows] = await pool.query(
      `SELECT id, full_name, email, password_hash, role, is_active FROM admin_users WHERE LOWER(email) = ?`,
      [cleanEmail]
    );

    if (adminRows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid administrator credentials' });
    }

    const admin = adminRows[0];
    if (!admin.is_active) {
      return res.status(403).json({ success: false, message: 'This administrator account is deactivated' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid administrator credentials' });
    }

    // Update last_login_at
    await pool.query(`UPDATE admin_users SET last_login_at = NOW() WHERE id = ?`, [admin.id]);

    const token = signAccessToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      isAdmin: true,
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: admin.id,
          name: admin.full_name,
          email: admin.email,
          role: admin.role,
          isAdmin: true,
        },
        token,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, message: 'Admin authentication service temporarily unavailable' });
  }
}

// Backward compatible alias
export const login = customerLogin;

export async function register(req, res) {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ success: false, message: 'All registration fields (name, email, phone, password) are mandatory' });
  }

  const pool = getPool();

  try {
    // Check existing email or phone
    const [existing] = await pool.query(
      `SELECT id, email, phone FROM users WHERE LOWER(email) = ? OR phone = ?`,
      [email.toLowerCase().trim(), phone.trim()]
    );

    if (existing.length > 0) {
      const match = existing[0];
      if (match.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists' });
      }
      return res.status(409).json({ success: false, message: 'An account with this mobile number already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, email_verified, phone_verified, status)
       VALUES (?, ?, ?, ?, 1, 1, 'active')`,
      [name.trim(), email.toLowerCase().trim(), phone.trim(), passwordHash]
    );

    const newUserId = result.insertId;
    const token = signAccessToken({
      id: newUserId,
      email: email.toLowerCase().trim(),
      role: 'customer',
      isAdmin: false,
    });

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUserId,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          role: 'customer',
          isAdmin: false,
        },
        token,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create patron account in database' });
  }
}

export async function getProfile(req, res) {
  const pool = getPool();
  try {
    if (req.user.isAdmin) {
      const [rows] = await pool.query(
        `SELECT id, full_name, email, role, is_active FROM admin_users WHERE id = ?`,
        [req.user.id]
      );
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Admin not found' });
      const admin = rows[0];
      return res.json({
        success: true,
        data: {
          user: {
            id: admin.id,
            name: admin.full_name,
            email: admin.email,
            role: admin.role,
            isAdmin: true,
          },
        },
      });
    }

    const [rows] = await pool.query(
      `SELECT id, full_name, email, phone, status, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    const user = rows[0];

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: 'customer',
          isAdmin: false,
        },
      },
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving profile' });
  }
}
