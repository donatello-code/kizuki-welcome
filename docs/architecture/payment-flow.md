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
  │  STEP 1: Payment Method Selection + Pay                 │
  │  ┌─────────────────────────────────────────────────┐    │
  │  │  Order Summary (cart items, subtotal, shipping,  │    │
  │  │  free shipping progress)                         │    │
  │  │                                                   │    │
  │  │  ○ Apple Pay (native ApplePaySession, one tap)   │    │
  │  │     ├── Supported → Apple Pay sheet opens        │    │
  │  │     └── Unsupported → error modal shown          │    │
  │  │                                                   │    │
  │  │  ○ PayPal (inline PayPal Smart Buttons)          │    │
  │  │     ├── createOrder → onApprove → capture        │    │
  │  │     └── On success: clearCart, close modal       │    │
  │  │                                                   │    │
  │  │  ○ Credit Card (inline form, expands on click)   │    │
  │  │     ├── Cardholder Name, Card Number             │    │
  │  │     ├── Expiry (MM/YY), CVV                      │    │
  │  │     ├── Validates: format, expiry date           │    │
  │  │     └── [Pay $XXX] → POST /api/orders            │    │
  │  │                                                   │    │
  │  │  Shipping info screen is next (info banner)      │    │
  │  └─────────────────────────────────────────────────┘    │
  └─────────────────────────────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │  STEP 2: Shipping (one field at a time)                │
  │  ┌─────────────────────────────────────────────────┐    │
  │  │  Shipping Label Preview (maroon card, white text)│    │
  │  │  Field progress: "3 of 8"                       │    │
  │  │  Fields (one at a time, auto-advance):          │    │
  │  │  ├── Full Name, Email, Phone                    │    │
  │  │  ├── Street Address, Apt (optional)             │    │
  │  │  ├── City, State, ZIP Code                      │    │
  │  │  Validates: required, format checks             │    │
  │  │  Back → step 1                                  │    │
  │  │  On last field submit → alert + clearCart + close│    │
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

  Step 1 — Credit Card Form:
  ├── cardName: required
  ├── cardNumber: 13-19 digits (formatted as XXXX XXXX XXXX XXXX)
  ├── expiry: 4 digits MM/YY, valid month, not expired
  └── cvv: 3-4 digits

  Step 2 — Shipping Fields (one at a time):
  ├── fullName: required, min 2 chars
  ├── email: required, regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  ├── phone: required, min 10 digits (strips non-digits)
  ├── address: required, min 5 chars
  ├── city: required
  ├── state: required, min 2 chars
  └── zip: required, min 5 digits (strips non-digits)

═══════════════════════════════════════════════════════════════
  PAYMENT PROCESSING
═══════════════════════════════════════════════════════════════

  Apple Pay (Step 1 — native ApplePaySession):
  ├── Checks ApplePaySession.canMakePayments()
  ├── If unsupported → shows error modal (use PayPal or CC)
  ├── Creates ApplePaySession(6, paymentRequest)
  ├── onvalidatemerchant → POST /api/apple-pay/validate-merchant
  ├── onpaymentauthorized → POST /api/orders with applePayToken
  ├── On success: ApplePaySession.STATUS_SUCCESS, clearCart, close
  └── On failure: ApplePaySession.STATUS_FAILURE, error modal

  PayPal (Step 1 — inline PayPal Smart Buttons):
  ├── Uses @paypal/react-paypal-js SDK
  ├── createOrder → onApprove → capture
  ├── On success: logs order, clears cart, closes modal
  └── On error/cancel: logs to console

  Credit Card (Step 1 — inline form):
  ├── Collects cardName, cardNumber, expiry, cvv
  ├── Validates: required fields, format, expiry date
  ├── POST /api/orders with card details
  ├── On success: paymentVerified = true, clearCart, close
  └── On failure: alert with error message

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
      ├── CreditCardForm
      ├── PayPalScriptProvider > PayPalButtons
      └── ApplePaySession (native, inline in Step 1)

═══════════════════════════════════════════════════════════════
  ENVIRONMENT VARIABLES (from .env or import.meta.env)
═══════════════════════════════════════════════════════════════

  VITE_PAYPAL_CLIENT_ID — PayPal client ID for SDK
  VITE_BACKEND_URL — Backend API URL (for order submission)
  VITE_STRIPE_PUBLISHABLE_KEY — Stripe key (legacy, unused)
