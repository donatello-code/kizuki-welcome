═══════════════════════════════════════════════════════════════
  KIZUKI STORE — FRONTEND LAUNCH PLAN
═══════════════════════════════════════════════════════════════

  STATUS: Pre-Launch (Frontend Only)
  TARGET: Deploy to production hosting (e.g., Vercel, Netlify, S3)

═══════════════════════════════════════════════════════════════
  PHASE 1: PRE-FLIGHT CHECKS
═══════════════════════════════════════════════════════════════

  [ ] 1.1 — Verify all files are committed to git
  [ ] 1.2 — Run `npm install` to ensure clean dependencies
  [ ] 1.3 — Run `npm run build` to verify production build succeeds
  [ ] 1.4 — Check for any TypeScript/ESLint warnings or errors
  [ ] 1.5 — Verify environment variables are documented

═══════════════════════════════════════════════════════════════
  PHASE 2: PAYMENT FLOW VALIDATION
═══════════════════════════════════════════════════════════════

  [ ] 2.1 — Test Credit Card flow end-to-end:
  │     ├── Select "Credit Card" → step 1 (Identity)
  │     ├── Fill identity → step 2 (Shipping)
  │     ├── Fill shipping → step 3 (Review)
  │     ├── Verify expanded items with nicknames/sizes
  │     ├── Test Edit mode (Edit → Confirm → −/+ buttons)
  │     ├── Verify shipping info displays correctly
  │     ├── Fill credit card form
  │     ├── Test validation errors
  │     └── Submit payment
  │
  [ ] 2.2 — Test PayPal flow end-to-end:
  │     ├── Select "PayPal" → step 4
  │     ├── Verify summary displays
  │     ├── Test PayPal buttons render
  │     └── Test Back button returns to step 0
  │
  [ ] 2.3 — Test Apple Pay flow:
  │     ├── Select "Apple Pay" → step 4
  │     └── Verify Apple Pay button renders (via PayPal SDK)
  │
  [ ] 2.4 — Test Alt Flow ("Pay after shipping"):
  │     ├── Click "Or pay after entering shipping details"
  │     ├── Verify step 0 skipped, goes to step 1
  │     ├── Fill identity → step 2
  │     ├── Fill shipping → step 3 (Review + Credit Card)
  │     └── Complete payment
  │
  [ ] 2.5 — Test edge cases:
  │     ├── Empty cart (should not reach checkout)
  │     ├── Single item in cart
  │     ├── Multiple quantities of same item
  │     ├── Mix of chessboards and hoodies
  │     ├── Edit mode: remove item (should update cart)
  │     ├── Edit mode: add item (should update cart)
  │     └── Edit mode: confirm without changes

═══════════════════════════════════════════════════════════════
  PHASE 3: UI/UX POLISH
═══════════════════════════════════════════════════════════════

  [ ] 3.1 — Verify responsive design on mobile (375px+)
  [ ] 3.2 — Verify responsive design on tablet (768px+)
  [ ] 3.3 — Verify responsive design on desktop (1024px+)
  [ ] 3.4 — Test all animations and transitions
  [ ] 3.5 — Verify modal scroll behavior (hide-scrollbar class)
  [ ] 3.6 — Test keyboard navigation (Tab, Enter, Escape)
  [ ] 3.7 — Verify close button behavior on each step
  [ ] 3.8 — Test loading/processing states (cardProcessing)

═══════════════════════════════════════════════════════════════
  PHASE 4: ENVIRONMENT & CONFIGURATION
═══════════════════════════════════════════════════════════════

  [ ] 4.1 — Set VITE_PAYPAL_CLIENT_ID in production env
  [ ] 4.2 — Set VITE_PAYPAL_ACCESS_TOKEN in production env
  │     ⚠ NOTE: Card processing uses PayPal REST API directly
  │     from the frontend. This exposes the access token.
  │     RECOMMENDATION: Move card processing to a backend
  │     endpoint to keep the token server-side.
  │
  [ ] 4.3 — Verify PayPal client ID is for production (not sandbox)
  [ ] 4.4 — Configure CORS if using custom domain
  [ ] 4.5 — Set up custom domain (if applicable)

═══════════════════════════════════════════════════════════════
  PHASE 5: BUILD & DEPLOY
═══════════════════════════════════════════════════════════════

  [ ] 5.1 — Choose deployment target:
  │     ├── Vercel (recommended for Vite/React)
  │     ├── Netlify
  │     └── AWS S3 + CloudFront
  │
  [ ] 5.2 — Configure build settings:
  │     ├── Build command: npm run build
  │     ├── Output directory: dist/
  │     └── Install command: npm install
  │
  [ ] 5.3 — Set environment variables in hosting dashboard
  [ ] 5.4 — Deploy to staging/preview URL
  [ ] 5.5 — Run full smoke test on staging
  [ ] 5.6 — Deploy to production
  [ ] 5.7 — Verify production URL loads correctly

═══════════════════════════════════════════════════════════════
  PHASE 6: POST-LAUNCH
═══════════════════════════════════════════════════════════════

  [ ] 6.1 — Monitor console for errors
  [ ] 6.2 — Verify PayPal transactions in PayPal dashboard
  [ ] 6.3 — Test actual purchase flow end-to-end
  [ ] 6.4 — Set up analytics (optional)
  [ ] 6.5 — Document known issues / future improvements

═══════════════════════════════════════════════════════════════
  KNOWN ISSUES / RISKS
═══════════════════════════════════════════════════════════════

  1. SECURITY: Card processing uses PayPal REST API token
     directly in frontend code. This is NOT production-safe.
     → RECOMMENDATION: Create a backend endpoint that proxies
       PayPal API calls so the token stays server-side.

  2. NICKNAMES: Chessboard nicknames are generated randomly
     on each render of the review screen. This means they
     change if the user navigates back and forth.
     → RECOMMENDATION: Generate nicknames once when entering
       step 3 and store them in state.

  3. EDIT MODE: The edit mode uses `removeFromCart` and
     `addToCart` from the Zustand store, which operate on
     product IDs. If multiple items share the same ID,
     removing one may decrement the wrong item.
     → This is acceptable for current usage since each
       expanded line item represents one unit.

  4. PAYPAL SANDBOX: Ensure VITE_PAYPAL_CLIENT_ID points to
     production credentials, not sandbox.

═══════════════════════════════════════════════════════════════
  BUILD COMMANDS
═══════════════════════════════════════════════════════════════

  # Install dependencies
  cd mern-ecommerce/frontend
  npm install

  # Development server
  npm run dev

  # Production build
  npm run build

  # Preview production build
  npm run preview

═══════════════════════════════════════════════════════════════
  FILE STRUCTURE (Frontend Only)
═══════════════════════════════════════════════════════════════

  mern-ecommerce/frontend/
  ├── public/
  │   ├── cheeseboard-hoodie.png
  │   └── hoodie-hero.png
  └── src/
      ├── main.jsx              ← Entry point (renders V2App)
      ├── V2App.jsx             ← App shell (nav, routing)
      ├── V2Landing.jsx         ← Landing page
      ├── V2Store.jsx           ← Product showcase (2 products)
      ├── CartModal.jsx         ← Cart modal
      ├── CheckoutModal.jsx     ← Full checkout flow (1124 lines)
      ├── SizeSelectorModal.jsx ← Size picker for hoodies
      ├── ExtraChessboardModal.jsx ← Upsell modal
      ├── AnimationMiddleware.jsx ← Animation wrapper
      ├── store.js              ← Zustand state management
      ├── index.css             ← Global styles
      └── theme.js              ← Theme constants (legacy)
