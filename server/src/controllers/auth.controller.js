import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

/**
 * Hash token and persist in refresh_tokens table
 */
async function saveRefreshToken({ userId = null, adminId = null, refreshToken }) {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const pool = getPool();

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, admin_id, token_hash, expires_at, is_revoked, created_at)
     VALUES (?, ?, ?, ?, 0, NOW())`,
    [userId, adminId, tokenHash, expiresAt]
  );
  return tokenHash;
}

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

    const tokenPayload = {
      id: customer.id,
      email: customer.email,
      role: 'customer',
      isAdmin: false,
    };

    const token = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Persist in refresh_tokens table
    await saveRefreshToken({ userId: customer.id, refreshToken });

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
        refreshToken,
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

    const tokenPayload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      isAdmin: true,
    };

    const token = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Persist in refresh_tokens table
    await saveRefreshToken({ adminId: admin.id, refreshToken });

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
        refreshToken,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, message: 'Admin authentication service temporarily unavailable' });
  }
}

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
    const tokenPayload = {
      id: newUserId,
      email: email.toLowerCase().trim(),
      role: 'customer',
      isAdmin: false,
    };

    const token = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await saveRefreshToken({ userId: newUserId, refreshToken });

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
        refreshToken,
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

/**
 * POST /api/auth/refresh
 * Refresh access token using valid refresh_tokens entry
 */
export async function refreshTokenHandler(req, res) {
  const rawToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!rawToken) {
    return res.status(401).json({ success: false, message: 'Refresh token is required' });
  }

  const decoded = verifyRefreshToken(rawToken);
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Expired or invalid refresh token' });
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const pool = getPool();

  try {
    const [rows] = await pool.query(
      `SELECT * FROM refresh_tokens 
       WHERE token_hash = ? AND is_revoked = 0 AND expires_at > NOW()`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Refresh token revoked or expired' });
    }

    const tokenRecord = rows[0];

    // Revoke old token (rotation)
    await pool.query(`UPDATE refresh_tokens SET is_revoked = 1 WHERE id = ?`, [tokenRecord.id]);

    // Issue new pair
    const tokenPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      isAdmin: decoded.isAdmin,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    await saveRefreshToken({
      userId: tokenRecord.user_id,
      adminId: tokenRecord.admin_id,
      refreshToken: newRefreshToken,
    });

    return res.json({
      success: true,
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
}

/**
 * POST /api/auth/logout
 * Revoke refresh token
 */
export async function logout(req, res) {
  const rawToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (rawToken) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const pool = getPool();
    try {
      await pool.query(`UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?`, [tokenHash]);
    } catch (err) {
      console.warn('Non-critical: error revoking token:', err.message);
    }
  }
  return res.json({ success: true, message: 'Logged out successfully' });
}

/**
 * POST /api/auth/send-otp
 * Generates OTP and logs to otp_codes table
 */
export async function sendOtp(req, res) {
  const { phone, purpose = 'login' } = req.body;
  const cleanPhone = (phone || '').trim().replace(/\D/g, '').slice(-10);

  if (!cleanPhone || cleanPhone.length < 10) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number is required' });
  }

  const validPurposes = ['login', 'register', 'reset_password', 'verify_phone'];
  const safePurpose = validPurposes.includes(purpose) ? purpose : 'login';

  // Generate 6 digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const pool = getPool();

  try {
    await pool.query(
      `INSERT INTO otp_codes (phone, code, purpose, expires_at, verified, attempts, created_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0, 0, NOW())`,
      [cleanPhone, code, safePurpose]
    );

    return res.json({
      success: true,
      message: `OTP sent to +91 ${cleanPhone}. Valid for 10 minutes.`,
      // Return dev OTP for testing without needing SMS provider configured
      data: {
        phone: cleanPhone,
        purpose: safePurpose,
        devOtp: code,
      },
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate verification code' });
  }
}

/**
 * POST /api/auth/verify-otp
 * Verifies code from otp_codes table
 */
export async function verifyOtp(req, res) {
  const { phone, code, purpose = 'login' } = req.body;
  const cleanPhone = (phone || '').trim().replace(/\D/g, '').slice(-10);

  if (!cleanPhone || !code) {
    return res.status(400).json({ success: false, message: 'Mobile number and 6-digit OTP code are required' });
  }

  const pool = getPool();

  try {
    const [rows] = await pool.query(
      `SELECT * FROM otp_codes
       WHERE phone = ? AND code = ? AND purpose = ? AND verified = 0 AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [cleanPhone, code.trim(), purpose]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please request a new one.' });
    }

    const otpRecord = rows[0];

    // Mark as verified
    await pool.query(`UPDATE otp_codes SET verified = 1 WHERE id = ?`, [otpRecord.id]);

    // If purpose is login, authenticate user if registered
    if (purpose === 'login') {
      const [userRows] = await pool.query(
        `SELECT id, full_name, email, phone, status FROM users WHERE phone LIKE ?`,
        [`%${cleanPhone}`]
      );

      if (userRows.length > 0) {
        const customer = userRows[0];
        const tokenPayload = {
          id: customer.id,
          email: customer.email,
          role: 'customer',
          isAdmin: false,
        };

        const token = signAccessToken(tokenPayload);
        const refreshToken = signRefreshToken(tokenPayload);
        await saveRefreshToken({ userId: customer.id, refreshToken });

        return res.json({
          success: true,
          message: 'Phone verified and authenticated successfully',
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
            refreshToken,
          },
        });
      }
    }

    return res.json({
      success: true,
      message: 'Mobile number verified successfully',
      data: { phone: cleanPhone, verified: true },
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify code' });
  }
}
