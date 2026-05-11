# Deploy Workflow: KIZUKI E-Commerce to Render.com

**Objective:** Deploy the KIZUKI MERN e-commerce app to Render.com — backend as a Web Service (Node/Express + SQLite), frontend as a Static Site (Vite/React). Orders with CC info are saved to SQLite and emailed to the store owner.

**Prerequisites:**
- Render.com account (free tier works)
- Git repo pushed to GitHub/GitLab
- EmailJS account (free: emailjs.com) for email notifications

---

## Phase 1: Backend Changes — Add SQLite + Order Capture

**Files to modify:** `mern-ecommerce/backend/server.js`
**New dependencies:** `better-sqlite3`, `emailjs-com` (or use `nodemailer` + SMTP)

### 1.1 Install backend dependencies

```bash
cd mern-ecommerce/backend
npm install better-sqlite3 nodemailer
```

### 1.2 Update `backend/server.js`

Add SQLite database initialization and a new `POST /api/orders` endpoint that:
- Receives order data (customer info, cart items, CC details)
- Saves to SQLite `orders` table
- Sends email notification to store owner
- Returns success response

### 1.3 Create `.env` for backend

```env
PORT=5000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_TO=your-email@gmail.com
```

---

## Phase 2: Frontend Changes — Replace Stripe with Order Submission

**Files to modify:** `mern-ecommerce/frontend/src/Checkout.jsx`, `mern-ecommerce/frontend/src/CheckoutModal.jsx`

### 2.1 Update Checkout component

Replace Stripe Elements with a simple order form that:
- Collects: fullName, email, phone, address, city, state, zip, cardNumber, cardExpiry, cardCvv, cardName
- On submit: POSTs to `{backendUrl}/api/orders`
- Shows success/error messages
- Clears cart on success

### 2.2 Update V2App.jsx

Ensure the CheckoutModal passes the backend URL or uses a default.

---

## Phase 3: Deploy Backend to Render (Web Service)

### 3.1 Prepare backend for Render

Create `mern-ecommerce/backend/render.yaml`:

```yaml
services:
  - type: web
    name: kizuki-backend
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: PORT
        value: 5000
      - key: EMAIL_HOST
        sync: false
      - key: EMAIL_PORT
        sync: false
      - key: EMAIL_USER
        sync: false
      - key: EMAIL_PASS
        sync: false
      - key: EMAIL_TO
        sync: false
```

### 3.2 Deploy via Render Dashboard

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Set:
   - **Name:** `kizuki-backend`
   - **Root Directory:** `mern-ecommerce/backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
5. Add environment variables (EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_TO)
6. Click **Create Web Service**
7. Wait for deploy — note the URL (e.g., `https://kizuki-backend.onrender.com`)

---

## Phase 4: Deploy Frontend to Render (Static Site)

### 4.1 Prepare frontend for Render

Create `mern-ecommerce/frontend/render.yaml`:

```yaml
services:
  - type: static
    name: kizuki-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_BACKEND_URL
        value: https://kizuki-backend.onrender.com
```

### 4.2 Deploy via Render Dashboard

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Static Site**
3. Connect your GitHub repo
4. Set:
   - **Name:** `kizuki-frontend`
   - **Root Directory:** `mern-ecommerce/frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. Add environment variable:
   - `VITE_BACKEND_URL` = `https://kizuki-backend.onrender.com`
6. Click **Create Static Site**
7. Wait for deploy — note the URL (e.g., `https://kizuki-frontend.onrender.com`)

---

## Phase 5: Verify Deployment

### 5.1 Test backend health

```bash
curl https://kizuki-backend.onrender.com/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 5.2 Test order endpoint

```bash
curl -X POST https://kizuki-backend.onrender.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "555-1234",
    "address": "123 Main St",
    "city": "NYC",
    "state": "NY",
    "zip": "10001",
    "cardNumber": "4111111111111111",
    "cardExpiry": "12/28",
    "cardCvv": "123",
    "cardName": "Test User",
    "items": [{"id":"p_1","name":"Symbolic Chessboard","price":99,"quantity":1}],
    "total": 99
  }'
# Expected: {"success":true,"orderId":"..."}
```

### 5.3 Test frontend

Open the frontend URL in a browser. Complete a purchase flow and verify:
- Cart works
- Checkout form submits
- Order appears in SQLite (check via backend logs)
- Email is received

---

## Phase 6: Monitor & Maintain

### 6.1 View backend logs

In Render dashboard → kizuki-backend → **Logs** tab

### 6.2 View SQLite data

SSH into Render or add a simple admin endpoint:

```bash
curl https://kizuki-backend.onrender.com/api/admin/orders
```

### 6.3 Redeploy on changes

Push to GitHub — Render auto-deploys on push to the connected branch.

---

## Architecture Summary

```
User's Browser
      │
      ▼
┌─────────────────────┐     POST /api/orders      ┌──────────────────────┐
│  KIZUKI Frontend    │ ──────────────────────►   │  KIZUKI Backend      │
│  (Vite + React)     │                           │  (Express + SQLite)  │
│  Render Static Site │ ◄──── JSON response ────  │  Render Web Service  │
└─────────────────────┘                           └──────────┬───────────┘
                                                              │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │  SQLite Database  │
                                                     │  (orders table)   │
                                                     └──────────────────┘
                                                              │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │  Email (Nodemailer│
                                                     │  → Store Owner)   │
                                                     └──────────────────┘
```
