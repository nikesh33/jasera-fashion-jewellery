import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function runSeeds() {
  console.log('🌱 Seeding Instagram Jewellery Boutique data for Suvarna...');

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'suvarna',
  });

  try {
    // 1. Single Admin User (for the friend to manage everything)
    console.log('Seeding Single Admin Account...');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);

    await pool.query(
      `INSERT INTO admin_users (full_name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         password_hash = VALUES(password_hash),
         is_active = 1`,
      ['Suvarna Store Admin', 'admin@suvarna.com', adminPasswordHash]
    );

    // 2. Sample Customer User
    console.log('Seeding Sample Customer...');
    const patronPasswordHash = await bcrypt.hash('customer123', 10);
    await pool.query(
      `INSERT INTO users (full_name, email, email_verified, phone, phone_verified, password_hash, status)
       VALUES (?, ?, 1, ?, 1, ?, 'active')
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash)`,
      ['Simran Sharma', 'customer@suvarna.com', '9820012345', patronPasswordHash]
    );

    // 3. Clear existing product_images, product_variants, products, categories for a clean boutique setup
    console.log('Cleaning old products & categories...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE product_images');
    await pool.query('TRUNCATE TABLE product_variants');
    await pool.query('TRUNCATE TABLE products');
    await pool.query('TRUNCATE TABLE categories');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // 4. Seed Dynamic Boutique Categories
    console.log('Seeding Boutique Categories...');
    const categories = [
      [
        'Oxidised Jhumkas',
        'jhumkas',
        'Handcrafted silver oxidised jhumkas, ghungroo bells, and vintage tribal earrings.',
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
        1,
        'active',
      ],
      [
        'Statement Earrings',
        'earrings',
        'Glamorous party chandbalis, trendy hoops, and lightweight festive drops.',
        'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80',
        2,
        'active',
      ],
      [
        'Chokers & Neckpieces',
        'necklaces',
        'Boho mirror chokers, layered anti-tarnish chains, and oxidised collar sets.',
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
        3,
        'active',
      ],
      [
        'Bangles & Kadas',
        'bangles-kadas',
        'Ghungroo kadas, oxidised silver bracelets, and statement openable cuffs.',
        'https://images.unsplash.com/photo-1611591475883-9b84b5c77e23?w=600&q=80',
        4,
        'active',
      ],
      [
        'Statement Rings',
        'rings',
        'Adjustable mirror work rings, dual-tone floral bands, and bohemian cocktail rings.',
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80',
        5,
        'active',
      ],
      [
        'Hair & Body Jewels',
        'accessories',
        'Hathphool, mathapatti, hair accessories, and clip-on nose pins.',
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80',
        6,
        'active',
      ],
    ];

    for (const [name, slug, desc, img, order, status] of categories) {
      await pool.query(
        `INSERT INTO categories (name, slug, description, image_url, display_order, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, slug, desc, img, order, status]
      );
    }

    // Category ID mapping
    const [catRows] = await pool.query('SELECT id, slug FROM categories');
    const catMap = {};
    for (const c of catRows) catMap[c.slug] = c.id;

    // 5. Seed Instagram Boutique Products (Trendy, affordable, aesthetic)
    console.log('Seeding Boutique Products...');
    const boutiqueProducts = [
      {
        name: 'Silver Oxidised Peacock Dome Jhumkas',
        slug: 'silver-oxidised-peacock-dome-jhumkas',
        short_desc: 'Intricate peacock motif German silver oxidised jhumkas with delicate ghungroo droplets. Lightweight and skin-friendly.',
        long_desc: 'Our bestselling Instagram favorite! Handcrafted with premium German silver brass, these peacock jhumkas feature delicate chime bells that make a subtle sound. Perfect for ethnic wear, college fests, and festive pujas.',
        category_slug: 'jhumkas',
        material: 'Oxidised German Silver',
        occasion: 'Festive & College Wear',
        gemstone: 'Silver Ghungroos',
        selling_price: 499,
        mrp: 999,
        cost_price: 180,
        weight_grams: 26,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
          'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80',
        ],
        variants: [
          { sku: 'SUV-JHM-01', size: 'Standard (Length 6cm)', price_override: 499, stock: 25 },
        ],
      },
      {
        name: 'Pastel Pink Hand-Painted Meenakari Jhumkas',
        slug: 'pastel-pink-meenakari-jhumkas',
        short_desc: 'Sweet pastel pink and gold meenakari bell earrings with white faux pearl tassels.',
        long_desc: 'Crafted with fine enamel meenakari art and hanging pearl beads. Very light on the ears and pairs beautifully with floral kurtis, lehengas, and pastel sarees.',
        category_slug: 'jhumkas',
        material: 'Gold Plated Brass & Enamel',
        occasion: 'Haldi & Sangeet',
        gemstone: 'Faux Pearls',
        selling_price: 599,
        mrp: 1199,
        cost_price: 210,
        weight_grams: 22,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80',
          'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
        ],
        variants: [
          { sku: 'SUV-JHM-02', size: 'Standard (Length 5.5cm)', price_override: 599, stock: 18 },
        ],
      },
      {
        name: 'Anti-Tarnish Waterproof Gold Clover Necklace',
        slug: 'anti-tarnish-gold-clover-necklace',
        short_desc: 'Minimalist 18K PVD gold plated stainless steel clover pendant on dainty chain. Sweat-proof & perfume-friendly.',
        long_desc: 'Wear it in the shower or during your workout! Made from medical-grade 316L stainless steel with vacuum 18K gold PVD plating. Will not fade, tarnish, or turn green on sensitive skin.',
        category_slug: 'necklaces',
        material: 'Anti-Tarnish 18K PVD Steel',
        occasion: 'Daily Chic & Office Wear',
        gemstone: 'Black Onyx Finish',
        selling_price: 799,
        mrp: 1499,
        cost_price: 260,
        weight_grams: 8,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
        ],
        variants: [
          { sku: 'SUV-NC-01', size: '16 + 2 Inch Extender', price_override: 799, stock: 30 },
        ],
      },
      {
        name: 'Boho Afghan Mirror Work Tribal Choker',
        slug: 'boho-afghan-mirror-tribal-choker',
        short_desc: 'Vintage Afghan-inspired oxidised choker with reflective mirrors and coin hangings. Comes with matching stud earrings.',
        long_desc: 'The ultimate statement piece for Navratri, concerts, and indie styling. Hand-embossed with tribal floral motifs, genuine mirror cuts, and an adjustable back dori for a snug neck fit.',
        category_slug: 'necklaces',
        material: 'Antique Oxidised Alloy',
        occasion: 'Festive & Boho Styling',
        gemstone: 'Glass Mirrors',
        selling_price: 899,
        mrp: 1699,
        cost_price: 320,
        weight_grams: 75,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?w=800&q=80',
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
        ],
        variants: [
          { sku: 'SUV-NC-02', size: 'Choker with Earrings', price_override: 899, stock: 15 },
        ],
      },
      {
        name: 'Kundan & Pearl Crescent Chandbalis',
        slug: 'kundan-pearl-crescent-chandbalis',
        short_desc: 'Royal Jadau Kundan crescent earrings with mint green beads and lustrous freshwater-style faux pearls.',
        long_desc: 'Elegant bridal party chandbalis designed with micro-kundan stones and delicate bead drop clusters. Adds instant regal charm to any suit, anarkali, or saree.',
        category_slug: 'earrings',
        material: 'Micro-Kundan & Brass',
        occasion: 'Wedding & Sangeet',
        gemstone: 'Faux Kundan & Mint Beads',
        selling_price: 699,
        mrp: 1299,
        cost_price: 240,
        weight_grams: 32,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80',
        ],
        variants: [
          { sku: 'SUV-ER-01', size: 'Standard Push-Back', price_override: 699, stock: 20 },
        ],
      },
      {
        name: 'Silver Ghungroo Openable Kada (Set of 2)',
        slug: 'silver-ghungroo-openable-kada',
        short_desc: 'Pair of handcrafted oxidised silver finish bangles with sweet ringing ghungroo clusters.',
        long_desc: 'Statement openable kadas with a spring screw hinge that fits all wrist sizes comfortably. Stack them together or wear one on each wrist for a dreamy boho look.',
        category_slug: 'bangles-kadas',
        material: 'Oxidised Brass Alloy',
        occasion: 'Ethnic & Festive Daily',
        gemstone: 'Silver Beads',
        selling_price: 749,
        mrp: 1399,
        cost_price: 270,
        weight_grams: 58,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1611591475883-9b84b5c77e23?w=800&q=80',
        ],
        variants: [
          { sku: 'SUV-BG-01-M', size: 'Size 2.4 - 2.6 (Adjustable)', price_override: 749, stock: 16 },
        ],
      },
      {
        name: 'Vintage Dual-Tone Adjustable Statement Ring',
        slug: 'vintage-dual-tone-statement-ring',
        short_desc: 'Handcrafted floral brass and silver dual-tone statement ring. Free size adjustable band.',
        long_desc: 'Bold, artistic, and eye-catching. The dual tone gold and silver finish makes it pair with any outfit or jewellery metal. Easily adjusts to fit any finger.',
        category_slug: 'rings',
        material: 'Dual-Tone Brass',
        occasion: 'Everyday Styling',
        gemstone: 'Ruby Red Glass Center',
        selling_price: 349,
        mrp: 699,
        cost_price: 110,
        weight_grams: 14,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
        ],
        variants: [
          { sku: 'SUV-RG-01', size: 'Free Size (Adjustable)', price_override: 349, stock: 35 },
        ],
      },
      {
        name: 'Traditional Pearl & Kundan Hathphool',
        slug: 'traditional-pearl-kundan-hathphool',
        short_desc: 'Delicate pearl chain hand harness with an adjustable kundan ring and wrist bracelet.',
        long_desc: 'Give your hands a fairytale bridal touch! Dainty pearl strands connect an adjustable floral kundan ring to an ornate wrist chain. Perfect for brides, bridesmaids, and festive selfies.',
        category_slug: 'accessories',
        material: 'Gold Finish Alloy & Pearls',
        occasion: 'Mehendi & Festive',
        gemstone: 'Faux Pearls & Kundan',
        selling_price: 549,
        mrp: 999,
        cost_price: 190,
        weight_grams: 28,
        status: 'active',
        images: [
          'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&q=80',
        ],
        variants: [
          { sku: 'SUV-HP-01', size: 'Free Size Adjustable', price_override: 549, stock: 22 },
        ],
      },
    ];

    for (const p of boutiqueProducts) {
      const catId = catMap[p.category_slug] || 1;
      const [pRes] = await pool.query(
        `INSERT INTO products (
          name, slug, short_description, long_description, category_id,
          material, occasion, gemstone, selling_price, mrp, cost_price,
          weight_grams, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.name, p.slug, p.short_desc, p.long_desc, catId,
          p.material, p.occasion, p.gemstone, p.selling_price, p.mrp, p.cost_price,
          p.weight_grams, p.status,
        ]
      );

      const productId = pRes.insertId;

      for (let idx = 0; idx < p.images.length; idx++) {
        await pool.query(
          `INSERT INTO product_images (product_id, url, type, display_order)
           VALUES (?, ?, ?, ?)`,
          [productId, p.images[idx], idx === 0 ? 'front' : 'side', idx]
        );
      }

      for (const v of p.variants) {
        await pool.query(
          `INSERT INTO product_variants (product_id, sku, size, price_override, stock)
           VALUES (?, ?, ?, ?, ?)`,
          [productId, v.sku, v.size, v.price_override, v.stock]
        );
      }
    }

    // 6. Seed Boutique Coupons
    console.log('Seeding Boutique Coupons...');
    await pool.query(
      `INSERT INTO coupons (code, description, type, value, min_order_amount, max_discount, status)
       VALUES
       ('FIRST10', '10% discount on your first boutique order', 'percentage', 10.0, 499, 500, 'active'),
       ('JHUMKA50', 'Flat ₹50 off on all jhumkas', 'flat', 50.0, 499, 50, 'active'),
       ('FREESHIP', 'Free shipping coupon for orders above ₹799', 'flat', 60.0, 799, 60, 'active')
       ON DUPLICATE KEY UPDATE value = VALUES(value)`
    );

    console.log('✅ Instagram Jewellery Boutique seeded successfully with realistic products, categories & 1 Admin!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await pool.end();
  }
}

runSeeds();
