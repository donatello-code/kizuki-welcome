import React, { useState, useCallback } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import useStore from './store';
import AnimationMiddleware from './AnimationMiddleware';
import { calcSubtotal, calcShipping, calcTotal, getShippingText, getFreeShippingProgress } from './shipping';

/* ─────────────────────────────────────────────
   Shared Styles
   ───────────────────────────────────────────── */
const modalOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  padding: '20px',
};

const modalContent = {
  background: '#141416',
  border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '40px',
  maxWidth: '480px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  position: 'relative',
};

const closeBtn = {
  position: 'absolute',
  top: '16px',
  right: '16px',
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '1.5rem',
  fontFamily: 'inherit',
  lineHeight: 1,
  zIndex: 10,
};

const title = {
  fontSize: '1.5rem',
  fontWeight: 800,
  marginBottom: '8px',
  textAlign: 'center',
};

const subtitle = {
  color: 'var(--text-secondary)',
  fontSize: '0.9rem',
  textAlign: 'center',
  marginBottom: '32px',
};

const inputStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--surface-border)',
  color: 'var(--text-primary)',
  padding: '14px 20px',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'inherit',
  fontSize: '1rem',
  width: '100%',
  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const errorText = {
  color: 'var(--danger)',
  fontSize: '0.75rem',
  marginTop: '4px',
};

const summaryCard = {
  background: 'var(--surface)',
  border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-md)',
  padding: '20px',
  marginBottom: '16px',
};

const summaryRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
};

const summaryTotal = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 0 0',
  marginTop: '8px',
  borderTop: '1px solid var(--surface-border)',
  fontSize: '1.1rem',
  fontWeight: 700,
};

const btnBack = {
  background: 'var(--surface)',
  border: '1px solid var(--surface-border)',
  color: 'var(--text-secondary)',
  padding: '16px 24px',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '1rem',
  fontWeight: 600,
  transition: 'all 0.3s ease',
};

/* ─────────────────────────────────────────────
   StepProgress Component
   ───────────────────────────────────────────── */
const StepProgress = ({ steps, currentStep }) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
    {steps.map((label, i) => {
      const isActive = i + 1 === currentStep;
      const isDone = i + 1 < currentStep;
      return (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: isActive
              ? 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'
              : isDone
                ? 'rgba(99, 102, 241, 0.2)'
                : 'var(--surface)',
            border: isActive ? 'none' : '1px solid var(--surface-border)',
            color: isActive ? 'white' : isDone ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'all 0.3s ease',
          }}>
            {isDone ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: '24px',
              height: '2px',
              background: isDone ? 'var(--accent)' : 'var(--surface-border)',
              borderRadius: '1px',
            }} />
          )}
        </div>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────
   CreditCardForm Component
   ───────────────────────────────────────────── */
const USE_PREFILL = false;

const CreditCardForm = ({ onSubmit, onBack, total, processing }) => {
  const [cardName, setCardName] = useState(USE_PREFILL ? 'John Doe' : '');
  const [cardNumber, setCardNumber] = useState(USE_PREFILL ? '4111 1111 1111 1111' : '');
  const [expiry, setExpiry] = useState(USE_PREFILL ? '12/28' : '');
  const [cvv, setCvv] = useState(USE_PREFILL ? '123' : '');
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) {
      return digits.slice(0, 2) + '/' + digits.slice(2);
    }
    return digits;
  };

  const validate = () => {
    const errs = {};
    if (!cardName.trim()) errs.cardName = 'Cardholder name is required';
    const cardDigits = cardNumber.replace(/\s/g, '');
    if (cardDigits.length < 13 || cardDigits.length > 19) errs.cardNumber = 'Enter a valid card number (13-19 digits)';
    const expiryDigits = expiry.replace(/\D/g, '');
    if (expiryDigits.length !== 4) {
      errs.expiry = 'Enter a valid expiry (MM/YY)';
    } else {
      const month = parseInt(expiryDigits.slice(0, 2), 10);
      const year = parseInt(expiryDigits.slice(2), 10) + 2000;
      if (month < 1 || month > 12) errs.expiry = 'Invalid month';
      else {
        const now = new Date();
        const expDate = new Date(year, month);
        if (expDate < now) errs.expiry = 'Card is expired';
      }
    }
    if (!/^\d{3,4}$/.test(cvv)) errs.cvv = 'Enter a valid CVV (3-4 digits)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        cardName,
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiry: expiry.replace(/\D/g, ''),
        cvv,
      });
    }
  };

  const inputField = (field) => ({
    ...inputStyle,
    borderColor: errors[field] ? 'var(--danger)' : focusedField === field ? 'var(--accent)' : 'var(--surface-border)',
    boxShadow: errors[field] ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : focusedField === field ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
  });

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Cardholder Name</label>
        <input
          style={inputField('cardName')}
          placeholder="John Doe"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          onFocus={() => setFocusedField('cardName')}
          onBlur={() => setFocusedField(null)}
        />
        {errors.cardName && <div style={errorText}>{errors.cardName}</div>}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Card Number</label>
        <input
          style={inputField('cardNumber')}
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          onFocus={() => setFocusedField('cardNumber')}
          onBlur={() => setFocusedField(null)}
        />
        {errors.cardNumber && <div style={errorText}>{errors.cardNumber}</div>}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Expiry</label>
          <input
            style={inputField('expiry')}
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            onFocus={() => setFocusedField('expiry')}
            onBlur={() => setFocusedField(null)}
          />
          {errors.expiry && <div style={errorText}>{errors.expiry}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>CVV</label>
          <input
            style={inputField('cvv')}
            placeholder="123"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onFocus={() => setFocusedField('cvv')}
            onBlur={() => setFocusedField(null)}
          />
          {errors.cvv && <div style={errorText}>{errors.cvv}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" style={btnBack} onClick={onBack}>Back</button>
        <button
          type="submit"
          disabled={processing}
          style={{
            flex: 1,
            padding: '14px 28px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            cursor: processing ? 'not-allowed' : 'pointer',
            border: 'none',
            fontFamily: 'inherit',
            fontSize: '1rem',
            background: processing
              ? 'var(--surface)'
              : 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
            color: 'white',
            transition: 'all 0.3s ease',
            opacity: processing ? 0.5 : 1,
          }}
        >
          {processing ? 'Processing...' : `Pay $${total}`}
        </button>
      </div>
    </form>
  );
};

/* ─────────────────────────────────────────────
   Shipping Fields Configuration
   ───────────────────────────────────────────── */
const SHIPPING_FIELDS = [
  { key: 'fullName', label: 'Full Name', placeholder: 'John Doe', type: 'text' },
  { key: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email' },
  { key: 'phone', label: 'Phone', placeholder: '+1 (555) 123-4567', type: 'tel' },
  { key: 'address', label: 'Street Address', placeholder: '123 Main Street', type: 'text' },
  { key: 'apt', label: 'Apt / Suite (optional)', placeholder: 'Apt 4B', type: 'text' },
  { key: 'city', label: 'City', placeholder: 'New York', type: 'text' },
  { key: 'state', label: 'State', placeholder: 'NY', type: 'text' },
  { key: 'zip', label: 'ZIP Code', placeholder: '10001', type: 'text' },
];

/* ─────────────────────────────────────────────
   Order Summary Component (reused across steps)
   ───────────────────────────────────────────── */
const OrderSummary = ({ cart, subtotal, shipping, total }) => (
  <div style={summaryCard}>
    {cart.map((item) => (
      <div key={item.id} style={summaryRow}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>&times; {item.quantity}</div>
        </div>
        <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
          ${(item.price * item.quantity).toFixed(2)}
        </div>
      </div>
    ))}
    <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
      <span>Subtotal</span>
      <span>${subtotal.toFixed(2)}</span>
    </div>
    <div style={{ padding: '4px 0 12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
      <span>Shipping{shipping > 0 ? ' (USPS First Class)' : ''}</span>
      <span style={{ color: shipping === 0 ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: shipping === 0 ? 700 : 400 }}>
        {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
      </span>
    </div>
    <div style={summaryTotal}>
      <span>Total</span>
      <span className="text-gradient">${total.toFixed(2)}</span>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main CheckoutModal Component
   ───────────────────────────────────────────── */
const CheckoutModal = ({ onClose }) => {
  const { cart, checkoutData, setCheckoutData, clearCart } = useStore();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cardProcessing, setCardProcessing] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [applePayError, setApplePayError] = useState(null);

  /* ── Apple Pay ── */
  const handleApplePay = () => {
    if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
      setApplePayError('Apple Pay is not available on this device. Please use PayPal or Credit Card.');
      return;
    }

    const MERCHANT_IDENTIFIER = 'merchant.com.kizuki.store'; // Replace with your actual merchant ID

    const paymentRequest = {
      countryCode: 'US',
      currencyCode: 'USD',
      supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
      merchantCapabilities: ['supports3DS'],
      total: {
        label: 'KIZUKI Store',
        amount: total.toFixed(2),
      },
    };

    const session = new ApplePaySession(6, paymentRequest);

    session.onvalidatemerchant = async (event) => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/apple-pay/validate-merchant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            validationUrl: event.validationURL,
            merchantIdentifier: MERCHANT_IDENTIFIER,
            domainName: window.location.hostname,
          }),
        });
        const merchantSession = await response.json();
        session.completeMerchantValidation(merchantSession);
      } catch (err) {
        console.error('Merchant validation failed:', err);
        session.abort();
        setApplePayError('Payment could not be processed. Please try again.');
      }
    };

    session.onpaymentauthorized = async (event) => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: checkoutData.fullName,
            email: checkoutData.email,
            phone: checkoutData.phone,
            address: checkoutData.address,
            apt: checkoutData.apt,
            city: checkoutData.city,
            state: checkoutData.state,
            zip: checkoutData.zip,
            paymentMethod: 'applepay',
            applePayToken: event.payment.token,
            items: cart.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              selectedSize: item.selectedSize || null,
            })),
            total: Math.round(total * 100),
          }),
        });
        const data = await response.json();
        if (data.success) {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          clearCart();
          onClose();
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          setApplePayError(data.error || 'Payment failed. Please try again.');
        }
      } catch (err) {
        console.error('Payment authorization failed:', err);
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        setApplePayError('Payment could not be processed. Please try again.');
      }
    };

    session.oncancel = () => {
      console.log('Apple Pay cancelled by user.');
    };

    session.begin();
  };

  const subtotal = calcSubtotal(cart);
  const shipping = calcShipping(subtotal);
  const total = calcTotal(cart);
  const freeShippingMsg = getFreeShippingProgress(subtotal);
  const currentField = SHIPPING_FIELDS[fieldIndex];
  const isLastField = fieldIndex === SHIPPING_FIELDS.length - 1;

  /* ── Validation ── */
  const validateField = (key, value) => {
    if (key === 'fullName' && (!value || value.trim().length < 2)) return 'Full name is required (min 2 characters)';
    if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    if (key === 'phone' && value.replace(/\D/g, '').length < 10) return 'Enter a valid phone number (min 10 digits)';
    if (key === 'address' && (!value || value.trim().length < 5)) return 'Street address is required (min 5 characters)';
    if (key === 'city' && (!value || value.trim().length < 1)) return 'City is required';
    if (key === 'state' && (!value || value.trim().length < 2)) return 'State is required';
    if (key === 'zip' && value.replace(/\D/g, '').length < 5) return 'ZIP code is required (min 5 digits)';
    return null;
  };

  const handleCardSubmit = async (cardData) => {
    setCardProcessing(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: checkoutData.fullName,
          email: checkoutData.email,
          phone: checkoutData.phone,
          address: checkoutData.address,
          apt: checkoutData.apt,
          city: checkoutData.city,
          state: checkoutData.state,
          zip: checkoutData.zip,
          cardNumber: cardData.cardNumber,
          cardExpiry: cardData.expiry,
          cardCvv: cardData.cvv,
          cardName: cardData.cardName,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            selectedSize: item.selectedSize || null,
          })),
          total: Math.round(total * 100), // Convert to cents
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentVerified(true);
        clearCart();
        onClose();
      } else {
        alert(data.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment Error:', error);
      alert('Payment processing error. Please try again.');
    } finally {
      setCardProcessing(false);
    }
  };

  const handleFieldChange = (key, value) => {
    setCheckoutData({ ...checkoutData, [key]: value });
    if (touched[key]) {
      const err = validateField(key, value);
      setErrors((prev) => ({ ...prev, [key]: err }));
    }
  };

  const handleFieldNext = () => {
    const err = validateField(currentField.key, checkoutData[currentField.key]);
    setErrors((prev) => ({ ...prev, [currentField.key]: err }));
    setTouched((prev) => ({ ...prev, [currentField.key]: true }));

    if (err) return;

    if (isLastField) {
      // Submit order
      alert('Order submitted! Thank you for your purchase.');
      clearCart();
      onClose();
    } else {
      setFieldIndex(fieldIndex + 1);
    }
  };

  const handleFieldKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFieldNext();
    }
  };

  /* ── Render ── */
  return (
    <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalContent} className="hide-scrollbar">
        <button style={closeBtn} onClick={onClose}>×</button>

        {/* Step Progress */}
        <StepProgress steps={['Payment', 'Shipping']} currentStep={step} />

        {/* Apple Pay Error Modal */}
        {applePayError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚠️</div>
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              {applePayError}
            </p>
            <button
              onClick={() => setApplePayError(null)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text-primary)',
                padding: '8px 20px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Step 1: Payment ── */}
        {step === 1 && (
          <>
            <h3 style={title}>Complete My Purchase</h3>
            <p style={subtitle}>Enter your payment details to continue</p>

            {/* Order Summary with shipping */}
            <OrderSummary cart={cart} subtotal={subtotal} shipping={shipping} total={total} />

            {/* Free shipping progress */}
            {freeShippingMsg && (
              <div style={{
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
              }}>
                {freeShippingMsg}
              </div>
            )}

            {/* Payment Methods */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.9rem' }}>Pay with</div>

              {/* Apple Pay — native ApplePaySession */}
              <button
                onClick={handleApplePay}
                style={{
                  height: '48px',
                  width: '100%',
                  fontFamily: '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontSize: '17px',
                  fontWeight: 600,
                  backgroundColor: '#000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: '8px',
                  marginBottom: '12px',
                  letterSpacing: '0.3px',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#333'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#000'}
              >
                <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                  <path d="M14.5 11.5C14.5 14.5 12 17 9 17C6 17 3.5 14.5 3.5 11.5C3.5 8.5 6 6 9 6C12 6 14.5 8.5 14.5 11.5Z" fill="white"/>
                  <path d="M9 0C9 0 6 3 6 6C6 7.5 7 9 9 9C11 9 12 7.5 12 6C12 3 9 0 9 0Z" fill="white"/>
                  <path d="M9 17C6 17 3.5 19 3.5 22H14.5C14.5 19 12 17 9 17Z" fill="white"/>
                </svg>
                <span>Apple Pay</span>
              </button>

              {/* PayPal / Credit Card */}
              <button
                onClick={() => setPaymentMethod('card')}
                style={{
                  height: '48px',
                  width: '100%',
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#2c2e2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  gap: '8px',
                  marginTop: '12px',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2c2e2f'}
              >
                {/* PayPal Logo */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" fill="#0070BA"/>
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" fill="url(#paint0_linear)"/>
                  <path d="M19.032 7.434c-.03.15-.06.298-.09.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437z" fill="#003087"/>
                  <defs>
                    <linearGradient id="paint0_linear" x1="12.345" y1="0" x2="12.345" y2="21.337" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#009EE0"/>
                      <stop offset="1" stop-color="#0070BA"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span>PayPal / Credit Card</span>
              </button>

              {/* Inline Credit Card Form */}
              {paymentMethod === 'card' && (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  marginTop: '12px',
                }}>
                  <CreditCardForm
                    onSubmit={handleCardSubmit}
                    onBack={() => setPaymentMethod(null)}
                    total={total}
                    processing={cardProcessing}
                  />
                </div>
              )}
            </div>

            {/* Shipping info screen is next */}
            <div style={{
              textAlign: 'center',
              marginTop: '16px',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
            }}>
              Shipping info screen is next
            </div>
          </>
        )}

        {/* ── Step 2: Shipping (one field at a time) ── */}
        {step === 2 && (
          <>
            {/* Back button — small, near step progress */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.8rem',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </button>
            </div>

            <h3 style={title}>Where To?</h3>
            <p style={subtitle}>Enter your shipping address</p>

            {/* Shipping Label Preview — maroon cardboard with white label */}
            <div style={{
              background: '#800000',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '24px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '4px',
                padding: '16px',
                color: '#1a1a1a',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                lineHeight: 1.8,
                minHeight: '80px',
              }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {checkoutData.fullName || 'FULL NAME'}
                </div>
                <div>
                  {checkoutData.address || 'STREET ADDRESS'}
                  {checkoutData.apt ? `, ${checkoutData.apt}` : ''}
                </div>
                <div>
                  {checkoutData.city || 'CITY'}{checkoutData.city && checkoutData.state ? ', ' : ''}
                  {checkoutData.state || 'STATE'} {checkoutData.zip || 'ZIP'}
                </div>
              </div>
            </div>

            {/* Field Progress */}
            <div style={{
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              marginBottom: '16px',
            }}>
              {fieldIndex + 1} of {SHIPPING_FIELDS.length}
            </div>

            {/* Current Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{currentField.label}</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  style={{
                    flex: 1,
                    ...inputStyle,
                    borderColor: errors[currentField.key] ? 'var(--danger)' : focusedField === currentField.key ? 'var(--accent)' : 'var(--surface-border)',
                    boxShadow: errors[currentField.key] ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : focusedField === currentField.key ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
                  }}
                  placeholder={currentField.placeholder}
                  value={checkoutData[currentField.key]}
                  onChange={(e) => handleFieldChange(currentField.key, e.target.value)}
                  onFocus={() => setFocusedField(currentField.key)}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={handleFieldKeyDown}
                  type={currentField.type}
                  autoFocus
                />
                <button
                  onClick={handleFieldNext}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
              {errors[currentField.key] && <div style={errorText}>{errors[currentField.key]}</div>}
            </div>
          </>
        )}

        {/* ── Step 4: PayPal/Apple Pay Direct (commented out — Apple Pay uses native ApplePaySession, PayPal is in Step 1) ── */}
        {/* 
        {step === 4 && (
          <>
            <h3 style={title}>Complete Your Purchase</h3>
            <p style={subtitle}>Review your order and complete payment</p>

            <OrderSummary cart={cart} subtotal={subtotal} shipping={shipping} total={total} />

            {(paymentMethod === 'paypal' || paymentMethod === 'applepay') && (
              <PayPalScriptProvider
                options={{
                  "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "AQub0ybcBhKw3l3eNbbIaChnt6irK9TPL_laWYIeEOlmdZd_ARJsD7hwPqPL_23uLsRoPRMk5NqHSdtS",
                  currency: "USD",
                  intent: "capture",
                  "enable-funding": "applepay",
                }}
              >
                <PayPalButtons
                  style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [{
                        description: "KIZUKI Store Purchase",
                        amount: { value: total.toFixed(2) },
                      }],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    try {
                      const details = await actions.order.capture();
                      console.log("Payment Details:", details);
                      clearCart();
                      onClose();
                    } catch (error) {
                      console.error("Payment Capture Error:", error);
                    }
                  }}
                  onError={(err) => console.error("PayPal Error:", err)}
                  onCancel={() => console.log("User cancelled the payment process.")}
                />
              </PayPalScriptProvider>
            )}

            <button
              style={{
                ...btnBack,
                width: '100%',
                marginTop: '16px',
                textAlign: 'center',
              }}
              onClick={onClose}
            >
              Cancel
            </button>
          </>
        )}
        */}
      </div>
    </div>
  );
};

export default CheckoutModal;
