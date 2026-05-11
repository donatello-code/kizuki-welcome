# Component Tree

```
main.jsx
└── V2App
    ├── V2Landing (landing page)
    ├── V2Store (product showcase)
    │   ├── AnimationMiddleware
    │   ├── SizeSelectorModal (hoodie sizes)
    │   └── ExtraChessboardModal (upsell)
    ├── CartModal
    └── CheckoutModal
        ├── StepProgress
        ├── CreditCardForm
        ├── PayPalScriptProvider > PayPalButtons
        └── ApplePaySession (native, inline in Step 1)
```

## Legacy App (unused)

```
main.jsx → App (old entry, still present but not rendered)
├── Checkout (Stripe-based, legacy)
└── ...
```
