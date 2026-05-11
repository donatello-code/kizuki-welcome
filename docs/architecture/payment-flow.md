═══════════════════════════════════════════════════════════════
  KIZUKI STORE — PAYMENT FLOW MAP
═══════════════════════════════════════════════════════════════

APP ENTRY POINT: V2App (rendered by main.jsx)
  ├── V2Landing (landing page)
  └── V2Store (product showcase — 2 products)
       ├── Symbolic Chessboard (p_1, $99, no size needed)
       └── Chessboard in my Heart (p_2, $99, needs size)

═══════════════════════════════════════════════════════════════
  DYNAMIC 2-VARIABLE ROUTING
═══════════════════════════════════════════════════════════════

  The checkout flow is driven by TWO boolean state variables:

    shippingComplete  — set to true when identity + address validated
    paymentVerified   — set to true when payment successfully processed

  Instead of a rigid step counter, the flow dynamically routes
  based on what's already been completed:

    ┌─────────────────────────────────────────────────────────┐
    │  handleSelectPaymentMethod('card'):                     │
    │    if shippingComplete → go to step 3 (Review + Pay)    │
    │    else                → go to step 1 (Identity)        │
    └─────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────┐
    │  handleSkipToAltFlow():                                 │
    │    if shippingComplete → go to step 3 (Review + Pay)    │
    │    else                → go to step 1 (Identity)        │
    └─────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────┐
    │  handleNext(3) from step 2:                             │
    │    validates address fields                             │
    │    if valid → set shippingComplete = true               │
    │            → go to step 3 (Review + Pay)                │
    └─────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
  FLOW DIAGRAM
═══════════════════════════════════════════════════════════════

  [Landing] → [Store] → [Cart Modal] → [Checkout Modal]
                                              │
                                              ▼
  ┌─────────────────────────────────────────────────────────┐
  │  STEP 0: Payment Method Selection                       │
  │  ┌─────────────────────────────────────────────────┐    │
  │  │  ○ PayPal (→ step 4)                            │    │
  │  │  ○ Apple Pay (→ step 4)                         │    │
  │  │  ○ Credit Card (→ dynamic routing)              │    │
  │  │     ├── shippingComplete? → step 3 (Review)     │    │
  │  │     └── !shippingComplete → step 1 (Identity)   │    │
  │  │  ○ "Pay after shipping" (→ dynamic routing)     │    │
  │  │     ├── shippingComplete? → step 3 (Review)     │    │
  │  │     └── !shippingComplete → step 1 (Identity)   │    │
  │  └─────────────────────────────────────────────────┘    │
  └─────────────────────────────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │  STEP 1: Identity (Shipping Info)                       │
  │  ┌─────────────────────────────────────────────────┐    │
  │  │  Full Name, Email, Phone                        │    │
  │  │  Validates: required, format checks             │    │
  │  │  Back → step 0 (or close if alt flow)           │    │
  │  │  Next → step 2                                  │    │
  │  └─────────────────────────────────────────────────┘    │
  └─────────────────────────────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │  STEP 2: Shipping Address                              │
  │  ┌─────────────────────────────────────────────────┐    │
  │  │  Street, Apt (optional), City, State, ZIP       │    │
  │  │  Validates: required, format checks             │    │
  │  │  Back → step 1                                  │    │
  │  │  Next → step 3 (Review)                         │    │
  │  │  On success: shippingComplete = true            │    │
  │  └─────────────────────────────────────────────────┘    │
  └─────────────────────────────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │  STEP 3: Review + Credit Card Payment                  │
  │  ┌─────────────────────────────────────────────────┐    │
  │  │  EXPANDED ITEMS (individual line items):        │    │
  │  │  ┌─────────────────────────────────────────┐    │    │
  │  │  │  Symbolic Chessboard "The Dark Square"   │    │    │
  │  │  │  Symbolic Chessboard "Midnight Gambit"   │    │    │
  │  │  │  Chessboard in my Heart (Size: M)        │    │    │
  │  │  │  Chessboard in my Heart (Size: L)        │    │    │
  │  │  │  ...each with [Edit] button              │    │    │
  │  │  └─────────────────────────────────────────┘    │    │
  │  │  EDIT MODE:                                     │    │
  │  │  ┌─────────────────────────────────────────┐    │    │
  │  │  │  [−]  1  [+]  [Confirm]                 │    │    │
  │  │  │  − removes item from cart                │    │    │
  │  │  │  + adds another of same item             │    │    │
  │  │  │  Confirm exits edit mode                 │    │    │
  │  │  └─────────────────────────────────────────┘    │    │
  │  │  ───────────────────────────────────────────    │    │
  │  │  TOTAL: $XXX                                    │    │
  │  │  ───────────────────────────────────────────    │    │
  │  │  SHIPPING TO:                                   │    │
  │  │  Full Name                                      │    │
  │  │  Address, Apt                                   │    │
  │  │  City, State ZIP                                │    │
  │  │  ───────────────────────────────────────────    │    │
  │  │  CREDIT CARD FORM:                              │    │
  │  │  Cardholder Name, Card Number                   │    │
  │  │  Expiry (MM/YY), CVV                            │    │
  │  │  Validates: format, expiry date                 │    │
  │  │  [Back → step 2]  [Pay $XXX]                   │    │
  │  │  On success: paymentVerified = true             │    │
  │  └─────────────────────────────────────────────────┘    │
  └─────────────────────────────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │  STEP 4: PayPal / Apple Pay Direct                     │
  │  (Only reached from step 0 if PayPal/Apple Pay)        │
  │  ┌─────────────────────────────────────────────────┐    │
  │  │  Summary: cart items (grouped by quantity)      │    │
  │  │  PayPal Smart Buttons (or Apple Pay)            │    │
  │  │  Back → step 0                                  │    │
  │  └─────────────────────────────────────────────────┘    │
  └─────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
  STATE MANAGEMENT (Zustand store)
═══════════════════════════════════════════════════════════════

  Store: useStore (persisted to localStorage 'ecommerce-storage')
  ┌─────────────────────────────────────────────────────────┐
  │  State:                                                 │
  │  ├── cart: [{ id, name, price, quantity, selectedSize }]│
  │  ├── userPhone: string                                  │
  │  └── checkoutData: {                                    │
  │        fullName, email, phone,                          │
  │        address, apt, city, state, zip                   │
  │      }                                                  │
  │                                                         │
  │  Actions:                                               │
  │  ├── addToCart(product) — adds or increments quantity   │
  │  ├── removeFromCart(id) — decrements or removes         │
  │  ├── setAuth(phone)                                     │
  │  ├── setCheckoutData(data)                              │
  │  └── clearCart()                                        │
  └─────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
  VALIDATION RULES
═══════════════════════════════════════════════════════════════

  Step 1 (Identity):
  ├── fullName: required, min 2 chars
  ├── email: required, regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  └── phone: required, min 10 digits (strips non-digits)

  Step 2 (Shipping):
  ├── address: required, min 5 chars
  ├── city: required
  ├── state: required, min 2 chars
  └── zip: required, min 5 digits (strips non-digits)

  Step 3 (Credit Card):
  ├── cardName: required
  ├── cardNumber: 13-19 digits (formatted as XXXX XXXX XXXX XXXX)
  ├── expiry: 4 digits MM/YY, valid month, not expired
  └── cvv: 3-4 digits

═══════════════════════════════════════════════════════════════
  PAYMENT PROCESSING
═══════════════════════════════════════════════════════════════

  Credit Card (step 3):
  ├── Creates PayPal order via REST API (server-side token needed)
  ├── Captures order via PayPal REST API
  ├── On COMPLETED: logs order, clears cart, closes modal
  └── On failure: shows alert

  PayPal (step 4):
  ├── Uses @paypal/react-paypal-js SDK
  ├── createOrder → onApprove → capture
  ├── On success: logs order, clears cart, closes modal
  └── On error/cancel: logs to console

  Apple Pay (step 4):
  └── Handled via PayPal SDK (enable-funding: "applepay")

═══════════════════════════════════════════════════════════════
  COMPONENT TREE
═══════════════════════════════════════════════════════════════

  V2App
  ├── V2Landing
  ├── V2Store
  │   ├── AnimationMiddleware
  │   ├── SizeSelectorModal (for p_2 hoodie sizes)
  │   └── ExtraChessboardModal (upsell after hoodie add)
  ├── CartModal
  └── CheckoutModal
      ├── StepProgress
      ├── FlashyButton
      ├── PaymentOption
      ├── CreditCardForm
      └── PayPalScriptProvider > PayPalButtons

═══════════════════════════════════════════════════════════════
  ENVIRONMENT VARIABLES (from .env or import.meta.env)
═══════════════════════════════════════════════════════════════

  VITE_PAYPAL_CLIENT_ID — PayPal client ID for SDK
  VITE_PAYPAL_ACCESS_TOKEN — PayPal REST API token (for card processing)
