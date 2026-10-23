import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getPool } from '../config/db.js';
import config from '../config/index.js';
import { recordInventoryTransaction } from '../utils/inventoryLogger.js';
import { recordPaymentTransaction } from './payments.controller.js';

// Helper to get or create Razorpay instance
function getRazorpayInstance() {
  const keyId = config.razorpay?.keyId || process.env.RAZORPAY_KEY_ID;
  const keySecret = config.razorpay?.keySecret || process.env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret && !keyId.includes('placeholder')) {
    try {
      return new Razorpay({ key_id: keyId, key_secret: keySecret });
    } catch (e) {
      console.warn('Failed to initialize Razorpay SDK:', e.message);
    }
  }
  return null;
}

export async function createOrder(req, res) {
  const pool = getPool();
  const { items, paymentMethod, couponCode, idempotencyKey } = req.body;
  const rawAddr = req.body.address || req.body.shipping_address || {};

  const address = {
    fullName: rawAddr.fullName || rawAddr.full_name || rawAddr.name,
    phone: rawAddr.phone,
    email: rawAddr.email || req.body.email,
    pincode: rawAddr.pincode || rawAddr.postalCode || rawAddr.postal_code,
    addressLine1: rawAddr.addressLine1 || rawAddr.address_line_1 || rawAddr.address,
    addressLine2: rawAddr.addressLine2 || rawAddr.address_line_2 || '',
    city: rawAddr.city,
    state: rawAddr.state,
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your shopping cart is empty' });
  }

  if (!address.fullName || !address.phone || !address.pincode || !address.addressLine1 || !address.city || !address.state) {
    return res.status(400).json({ success: false, message: 'Complete delivery address and contact information are required' });
  }

  const validPaymentMethods = ['cod', 'razorpay', 'upi', 'card', 'netbanking', 'online'];
  const selectedPayment = (paymentMethod || 'upi').toLowerCase();
  if (!validPaymentMethods.includes(selectedPayment)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method selected' });
  }

  // Idempotency check to avoid duplicate orders on retry
  if (idempotencyKey) {
    const [existingOrders] = await pool.query(
      `SELECT id, order_number, total, payment_status, fulfilment_status FROM orders WHERE idempotency_key = ?`,
      [idempotencyKey]
    );
    if (existingOrders.length > 0) {
      const existing = existingOrders[0];
      return res.status(200).json({
        success: true,
        message: 'Order retrieved from existing submission',
        data: {
          orderNumber: existing.order_number,
          orderId: existing.id,
          total: Number(existing.total),
          status: existing.fulfilment_status,
          paymentStatus: existing.payment_status,
        },
      });
    }
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Fetch products & variants from database and verify stock & calculate server-side totals
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const productId = item.productId || item.product?.id || item.id;
      const variantId = item.variantId || item.variant?.id || null;
      const quantity = Math.max(1, parseInt(item.quantity || 1, 10));

      // Query product and variant directly from MySQL
      const [prodRows] = await conn.query(
        `SELECT
          p.id, p.name, p.slug, p.selling_price, p.status,
          pv.id as variant_id, pv.size, pv.price_override, pv.stock,
          (SELECT url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as primary_image
         FROM products p
         LEFT JOIN product_variants pv ON pv.product_id = p.id AND (pv.id = ? OR ? IS NULL)
         WHERE p.id = ? AND p.status = 'active'`,
        [variantId, variantId, productId]
      );

      if (prodRows.length === 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Product (ID: ${productId}) is no longer available in the catalogue.`,
        });
      }

      const pData = prodRows[0];
      const availableStock = pData.stock !== null ? pData.stock : 20;

      // Prevent customer from purchasing unavailable quantities
      if (availableStock < quantity) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${pData.name}". Only ${availableStock} piece(s) available.`,
        });
      }

      const unitPrice = Number(pData.price_override || pData.selling_price);
      const lineTotal = unitPrice * quantity;
      calculatedSubtotal += lineTotal;

      validatedItems.push({
        productId: pData.id,
        variantId: pData.variant_id || null,
        productName: pData.name,
        variantSize: pData.size || 'Standard Free Size',
        productImage: pData.primary_image || item.image || item.primary_image || null,
        quantity,
        unitPrice,
        lineTotal,
      });
    }

    // 2. Coupon Validation & Discount calculation
    let calculatedDiscount = 0;
    let appliedCouponId = null;
    let appliedCouponCode = null;

    if (couponCode && couponCode.trim()) {
      const [couponRows] = await conn.query(
        `SELECT * FROM coupons
         WHERE code = ? AND status = 'active'
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_to IS NULL OR valid_to >= NOW())`,
        [couponCode.trim().toUpperCase()]
      );

      if (couponRows.length > 0) {
        const coupon = couponRows[0];
        if (calculatedSubtotal >= Number(coupon.min_order_amount || 0)) {
          appliedCouponId = coupon.id;
          appliedCouponCode = coupon.code;
          if (coupon.type === 'percentage') {
            calculatedDiscount = (calculatedSubtotal * Number(coupon.value)) / 100;
            if (coupon.max_discount && calculatedDiscount > Number(coupon.max_discount)) {
              calculatedDiscount = Number(coupon.max_discount);
            }
          } else if (coupon.type === 'flat') {
            calculatedDiscount = Math.min(Number(coupon.value), calculatedSubtotal);
          }
        }
      }
    }

    // 3. Tax and Shipping fee calculation
    const taxableAmount = Math.max(0, calculatedSubtotal - calculatedDiscount);
    const tax = Math.round(taxableAmount * 0.03 * 100) / 100; // 3% GST on jewellery
    const shippingFee = taxableAmount >= 499 ? 0 : 50;
    const finalTotal = Math.round((taxableAmount + tax + shippingFee) * 100) / 100;

    // 4. Create Order Number & determine payment initial status
    const orderNumber = `SUV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const userId = req.user ? req.user.id : null;
    const guestEmail = (address.email || (req.user ? req.user.email : '') || '').toLowerCase().trim();
    const guestPhone = (address.phone || (req.user ? req.user.phone : '') || '').trim();

    // Non-COD payments start as 'pending' - never marked as paid without verification!
    const initialPaymentStatus = selectedPayment === 'cod' ? 'pending_cod' : 'pending';
    const initialFulfilmentStatus = 'placed';

    const [orderRes] = await conn.query(
      `INSERT INTO orders (
        order_number, user_id, guest_email, guest_phone,
        shipping_address, subtotal, discount, shipping_fee, tax, total,
        coupon_id, coupon_code, payment_method, payment_status, fulfilment_status,
        idempotency_key, carrier, tracking_number, placed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        orderNumber,
        userId,
        guestEmail,
        guestPhone,
        JSON.stringify(address),
        calculatedSubtotal,
        calculatedDiscount,
        shippingFee,
        tax,
        finalTotal,
        appliedCouponId,
        appliedCouponCode,
        selectedPayment,
        initialPaymentStatus,
        initialFulfilmentStatus,
        idempotencyKey || null,
        'BlueDart Express',
        `BD-${Math.floor(100000000 + Math.random() * 900000000)}`,
      ]
    );

    const insertedOrderId = orderRes.insertId;

    // 5. Insert order items & safely deduct inventory & log transactions
    for (const item of validatedItems) {
      await conn.query(
        `INSERT INTO order_items (
          order_id, product_id, variant_id, product_name,
          variant_info, product_image, quantity, unit_price, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          insertedOrderId,
          item.productId,
          item.variantId,
          item.productName,
          `Size: ${item.variantSize}`,
          item.productImage,
          item.quantity,
          item.unitPrice,
          item.lineTotal,
        ]
      );

      // Decrement inventory stock atomically
      let targetVariantId = item.variantId;
      if (item.variantId) {
        await conn.query(
          `UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?`,
          [item.quantity, item.variantId, item.quantity]
        );
      } else {
        await conn.query(
          `UPDATE product_variants SET stock = stock - ? WHERE product_id = ? AND stock >= ?`,
          [item.quantity, item.productId, item.quantity]
        );
        // Find default variant ID for ledger logging
        const [vRow] = await conn.query(
          `SELECT id FROM product_variants WHERE product_id = ? ORDER BY is_default DESC LIMIT 1`,
          [item.productId]
        );
        if (vRow.length > 0) targetVariantId = vRow[0].id;
      }

      // Record in inventory_transactions table
      if (targetVariantId) {
        await recordInventoryTransaction({
          variantId: targetVariantId,
          quantityChange: -item.quantity,
          reason: 'sale',
          referenceId: insertedOrderId,
          note: `Customer order ${orderNumber} placed`,
          actorId: userId,
          conn,
        });
      }
    }

    // 5b. Record coupon usage if applied
    if (appliedCouponId) {
      await conn.query(
        `INSERT INTO coupon_usage (coupon_id, user_id, order_id, used_at) VALUES (?, ?, ?, NOW())`,
        [appliedCouponId, userId, insertedOrderId]
      );
      await conn.query(
        `UPDATE coupons SET total_used = total_used + 1 WHERE id = ?`,
        [appliedCouponId]
      );
    }

    // 5c. Record manual/gateway payment ledger in payments table
    await recordPaymentTransaction({
      orderId: insertedOrderId,
      amount: finalTotal,
      method: selectedPayment,
      gateway: 'manual',
      status: selectedPayment === 'cod' ? 'authorized' : 'created',
      conn,
    });

    // 6. Record order status history
    await conn.query(
      `INSERT INTO order_status_history (order_id, status, note, actor_type, actor_id, created_at)
       VALUES (?, 'placed', 'Order placed by customer', 'customer', ?, NOW())`,
      [insertedOrderId, userId]
    );

    // 7. Check Razorpay payment integration
    let razorpayOrderData = null;
    const rzp = getRazorpayInstance();

    if (selectedPayment !== 'cod') {
      if (rzp) {
        // Real Razorpay server-side order creation
        try {
          const rzpOrder = await rzp.orders.create({
            amount: Math.round(finalTotal * 100), // in paise
            currency: 'INR',
            receipt: orderNumber,
            notes: { orderId: insertedOrderId.toString(), customerEmail: guestEmail },
          });
          razorpayOrderData = {
            id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId: config.razorpay?.keyId || process.env.RAZORPAY_KEY_ID,
            isTestMode: false,
          };
        } catch (rzpErr) {
          console.error('Razorpay order creation error:', rzpErr);
          // Fallback to test sandbox mode if API key is invalid
          razorpayOrderData = {
            id: `rzp_mock_${insertedOrderId}_${Date.now()}`,
            amount: Math.round(finalTotal * 100),
            currency: 'INR',
            keyId: 'rzp_test_placeholder',
            isTestMode: true,
          };
        }
      } else {
        // Test sandbox mode when live credentials are not yet connected
        razorpayOrderData = {
          id: `order_sandbox_${insertedOrderId}_${Date.now()}`,
          amount: Math.round(finalTotal * 100),
          currency: 'INR',
          keyId: 'rzp_test_placeholder',
          isTestMode: true,
        };
      }
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderNumber,
        orderId: insertedOrderId,
        subtotal: calculatedSubtotal,
        discount: calculatedDiscount,
        tax,
        shippingFee,
        total: finalTotal,
        paymentMethod: selectedPayment,
        paymentStatus: initialPaymentStatus,
        fulfilmentStatus: initialFulfilmentStatus,
        razorpay: razorpayOrderData,
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: 'Failed to process order. Please try again.' });
  } finally {
    conn.release();
  }
}

// Verify payment server-side
export async function verifyPayment(req, res) {
  const pool = getPool();
  const orderId = req.body.orderId || req.body.order_id;
  const orderNumber = req.body.orderNumber || req.body.order_number;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    isTestConfirmation,
  } = req.body;

  if (!orderNumber && !orderId) {
    return res.status(400).json({ success: false, message: 'Order reference is required' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [orders] = await conn.query(
      `SELECT id, order_number, total, payment_status, fulfilment_status FROM orders WHERE order_number = ? OR id = ?`,
      [orderNumber || null, orderId || null]
    );

    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];

    // Check if already paid (idempotent verification)
    if (order.payment_status === 'paid') {
      await conn.commit();
      return res.json({
        success: true,
        message: 'Order is already confirmed and paid',
        data: { orderNumber: order.order_number, paymentStatus: 'paid' },
      });
    }

    const keySecret = config.razorpay?.keySecret || process.env.RAZORPAY_KEY_SECRET;
    let paymentVerified = false;

    // 1. Signature Verification with real secret
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature && keySecret && !keySecret.includes('placeholder')) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      paymentVerified = generatedSignature === razorpay_signature;
    } else if (isTestConfirmation && (keySecret?.includes('placeholder') || process.env.NODE_ENV !== 'production')) {
      // Test sandbox verification when running in development mode
      paymentVerified = true;
    }

    if (!paymentVerified) {
      // Mark as failed in orders
      await conn.query(`UPDATE orders SET payment_status = 'failed' WHERE id = ?`, [order.id]);
      await conn.commit();
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. The transaction could not be validated.',
      });
    }

    // 2. Mark order as paid & confirmed
    await conn.query(
      `UPDATE orders
       SET payment_status = 'paid', fulfilment_status = 'confirmed', confirmed_at = NOW()
       WHERE id = ?`,
      [order.id]
    );

    // 3. Record in payments table
    await conn.query(
      `INSERT INTO payments (
        order_id, gateway, gateway_order_id, gateway_payment_id, gateway_signature,
        amount, status, method
      ) VALUES (?, 'razorpay', ?, ?, ?, ?, 'captured', 'online')`,
      [
        order.id,
        razorpay_order_id || 'test_order',
        razorpay_payment_id || 'test_payment',
        razorpay_signature || 'test_sig',
        order.total,
      ]
    );

    // 4. Record in status history
    await conn.query(
      `INSERT INTO order_status_history (order_id, status, note, actor_type)
       VALUES (?, 'confirmed', 'Payment verified and captured successfully', 'system')`,
      [order.id]
    );

    await conn.commit();

    res.json({
      success: true,
      message: 'Payment verified successfully. Order confirmed.',
      data: {
        orderNumber: order.order_number,
        paymentStatus: 'paid',
        fulfilmentStatus: 'confirmed',
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, message: 'Payment verification service error' });
  } finally {
    conn.release();
  }
}

// Secure Order Tracking (prevents customer enumeration)
export async function getOrderTracking(req, res) {
  const pool = getPool();
  const { id } = req.params;
  const verificationEmail = (req.query.email || '').toLowerCase().trim();
  const verificationPhone = (req.query.phone || '').trim();

  try {
    const [rows] = await pool.query(
      `SELECT
        o.*,
        u.full_name as customer_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.order_number = ? OR o.id = ?`,
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found. Please verify the order number.' });
    }

    const order = rows[0];

    // Privacy & Security Check:
    // Allow if:
    // 1) Logged-in admin
    // 2) Logged-in customer owning this order
    // 3) Guest providing matching email or phone number
    const isAuthedAdmin = req.user?.isAdmin === true || req.user?.role === 'super_admin';
    const isAuthedOwner = req.user && req.user.id === order.user_id;

    let addressObj = null;
    try {
      addressObj = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
    } catch {
      addressObj = {};
    }

    const matchesGuestEmail = verificationEmail && (
      (order.guest_email && order.guest_email.toLowerCase() === verificationEmail) ||
      (addressObj?.email && addressObj.email.toLowerCase() === verificationEmail)
    );

    const matchesGuestPhone = verificationPhone && (
      (order.guest_phone && order.guest_phone.replace(/\D/g, '') === verificationPhone.replace(/\D/g, '')) ||
      (addressObj?.phone && addressObj.phone.replace(/\D/g, '') === verificationPhone.replace(/\D/g, ''))
    );

    if (!isAuthedAdmin && !isAuthedOwner && !matchesGuestEmail && !matchesGuestPhone) {
      // Return basic milestone status without leaking customer PII (address, phone, email)
      return res.json({
        success: true,
        data: {
          order: {
            order_number: order.order_number,
            fulfilment_status: order.fulfilment_status,
            placed_at: order.placed_at,
            carrier: order.carrier,
            requiresVerification: true,
            verificationPrompt: 'Enter the email or phone number used during checkout to view full delivery address and item breakdown.',
          },
        },
      });
    }

    // Fetch items
    const [items] = await pool.query(
      `SELECT
        oi.*,
        (SELECT url FROM product_images WHERE product_id = oi.product_id ORDER BY display_order ASC LIMIT 1) as product_image
       FROM order_items oi
       WHERE oi.order_id = ?`,
      [order.id]
    );

    res.json({
      success: true,
      data: {
        order: {
          ...order,
          items,
          shipping_address: addressObj,
          requiresVerification: false,
        },
      },
    });
  } catch (err) {
    console.error('Track order error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve tracking details' });
  }
}

// Get customer's own orders (strictly isolated to req.user.id)
export async function getUserOrders(req, res) {
  const pool = getPool();
  try {
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY placed_at DESC`,
      [req.user.id]
    );

    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT
          oi.*,
          (SELECT url FROM product_images WHERE product_id = oi.product_id ORDER BY display_order ASC LIMIT 1) as product_image
         FROM order_items oi
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
      try {
        order.shipping_address = typeof order.shipping_address === 'string'
          ? JSON.parse(order.shipping_address)
          : order.shipping_address;
      } catch {
        // keep as is
      }
    }

    res.json({
      success: true,
      data: {
        orders,
      },
    });
  } catch (err) {
    console.error('User orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch customer orders' });
  }
}
