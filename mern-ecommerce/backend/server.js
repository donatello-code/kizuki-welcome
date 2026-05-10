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

// ─── Static product catalog ───────────────────────────────
const PRODUCTS = {
  p_1: { id: 'p_1', name: 'Symbolic Chessboard', price: 9900 },
  p_2: { id: 'p_2', name: 'Chessboard in my Heart', price: 9900 },
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

// ─── Start server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 KIZUKI backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Orders: POST http://localhost:${PORT}/api/orders`);
  console.log(`   Admin:  GET  http://localhost:${PORT}/api/admin/orders`);
});
