import React, { useState, useCallback } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import useStore from './store';
import AnimationMiddleware from './AnimationMiddleware';

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

const inputFocus = {
  borderColor: 'var(--accent)',
  boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
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
   PaymentOption Component
   ───────────────────────────────────────────── */
const PaymentOption = ({ icon, name, description, onClick, isSelected }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 20px',
      borderRadius: 'var(--radius-md)',
      background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface)',
      border: isSelected
        ? '1px solid var(--accent)'
        : '1px solid var(--surface-border)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginBottom: '12px',
    }}
  >
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface)',
      border: '1px solid var(--surface-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.2rem',
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>{name}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{description}</div>
    </div>
    {isSelected && (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    )}
  </div>
);

/* ─────────────────────────────────────────────
   FlashyButton Component
   ───────────────────────────────────────────── */
const FlashyButton = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '16px',
      borderRadius: 'var(--radius-sm)',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: 'none',
      fontFamily: 'inherit',
      fontSize: '1rem',
      background: disabled
        ? 'var(--surface)'
        : 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
      color: 'white',
      transition: 'all 0.3s ease',
      opacity: disabled ? 0.5 : 1,
      marginTop: '16px',
    }}
  >
    {children}
  </button>
);

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
          <span style={{
            fontSize: '0.75rem',
            fontWeight: isActive ? 700 : 500,
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            display: 'none',
          }}>
            {label}
          </span>
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
// Set to false to disable test prefill in production
const USE_PREFILL = true;

const CreditCardForm = ({ onSubmit, onBack, cartTotal, processing }) => {
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
          {processing ? 'Processing...' : `Pay $${cartTotal}`}
        </button>
      </div>
    </form>
  );
};

/* ─────────────────────────────────────────────
   Main CheckoutModal Component
   ───────────────────────────────────────────── */
const CheckoutModal = ({ onClose }) => {
  const { cart, checkoutData, setCheckoutData, clearCart } = useStore();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showAltFlow, setShowAltFlow] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cardProcessing, setCardProcessing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [shippingComplete, setShippingComplete] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [reviewPaymentMethod, setReviewPaymentMethod] = useState('card');

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  /* ── Validation ── */
  const validateStep = (currentStep, data) => {
    const errs = {};
    if (currentStep === 1) {
      if (!data.fullName || data.fullName.trim().length < 2) errs.fullName = 'Full name is required (min 2 characters)';
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Enter a valid email address';
      if (!data.phone || data.phone.replace(/\D/g, '').length < 10) errs.phone = 'Enter a valid phone number (min 10 digits)';
    } else if (currentStep === 2) {
      if (!data.address || data.address.trim().length < 5) errs.address = 'Street address is required (min 5 characters)';
      if (!data.city || data.city.trim().length < 1) errs.city = 'City is required';
      if (!data.state || data.state.trim().length < 2) errs.state = 'State is required';
      if (!data.zip || data.zip.replace(/\D/g, '').length < 5) errs.zip = 'ZIP code is required (min 5 digits)';
    }
    return errs;
  };

  /* ── Navigation ── */
  const handleNext = useCallback((nextStep) => {
    const stepErrors = validateStep(step, checkoutData);
    setErrors((prev) => ({ ...prev, ...stepErrors }));
    const fields = step === 1 ? ['fullName', 'email', 'phone'] : ['address', 'city', 'state', 'zip'];
    const newTouched = {};
    fields.forEach((f) => { newTouched[f] = true; });
    setTouched((prev) => ({ ...prev, ...newTouched }));

    if (Object.keys(stepErrors).length === 0) {
      if (step === 2) {
        setShippingComplete(true);
      }
      setIsTransitioning(true);
      setTimeout(() => {
        setStep(nextStep);
        setIsTransitioning(false);
      }, 200);
    }
  }, [step, checkoutData]);

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method);
    if (method === 'paypal' || method === 'applepay') {
      setStep(4);
    } else if (method === 'card') {
      if (shippingComplete) {
        setStep(3);
      } else {
        setStep(1);
      }
    }
  };

  const handleSkipToAltFlow = () => {
    setShowAltFlow(true);
    setPaymentMethod('card');
    if (shippingComplete) {
      setStep(3);
    } else {
      setStep(1);
    }
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
          total: cartTotal * 100, // Convert to cents
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

  const handleFieldChange = (field, value) => {
    setCheckoutData({ ...checkoutData, [field]: value });
    if (touched[field]) {
      const stepErrors = validateStep(step, { ...checkoutData, [field]: value });
      setErrors((prev) => ({ ...prev, [field]: stepErrors[field] }));
    }
  };

  /* ── Render ── */
  return (
    <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalContent} className="hide-scrollbar">
        <button style={closeBtn} onClick={onClose}>×</button>

        {/* ── Step 1: Identity ── */}
        {step === 1 && (
          <>
            <h3 style={title}>Who Are You?</h3>
            <p style={subtitle}>We need to know where to send your order</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Full Name</label>
              <input
                style={{
                  ...inputStyle,
                  borderColor: errors.fullName ? 'var(--danger)' : focusedField === 'fullName' ? 'var(--accent)' : 'var(--surface-border)',
                  boxShadow: errors.fullName ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : focusedField === 'fullName' ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
                }}
                placeholder="John Doe"
                value={checkoutData.fullName}
                onChange={(e) => handleFieldChange('fullName', e.target.value)}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.fullName && <div style={errorText}>{errors.fullName}</div>}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Email</label>
              <input
                style={{
                  ...inputStyle,
                  borderColor: errors.email ? 'var(--danger)' : focusedField === 'email' ? 'var(--accent)' : 'var(--surface-border)',
                  boxShadow: errors.email ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : focusedField === 'email' ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
                }}
                placeholder="john@example.com"
                value={checkoutData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.email && <div style={errorText}>{errors.email}</div>}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Phone</label>
              <input
                style={{
                  ...inputStyle,
                  borderColor: errors.phone ? 'var(--danger)' : focusedField === 'phone' ? 'var(--accent)' : 'var(--surface-border)',
                  boxShadow: errors.phone ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : focusedField === 'phone' ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
                }}
                placeholder="+1 (555) 123-4567"
                value={checkoutData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.phone && <div style={errorText}>{errors.phone}</div>}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={btnBack}
                onClick={onClose}
              >
                Back
              </button>
              <FlashyButton onClick={() => handleNext(2)} disabled={isTransitioning}>
                Continue to Shipping
              </FlashyButton>
            </div>
          </>
        )}

        {/* ── Step 2: Shipping Address ── */}
        {step === 2 && (
          <>
            <h3 style={title}>Where To?</h3>
            <p style={subtitle}>Enter your shipping address</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Street Address</label>
              <input
                style={{
                  ...inputStyle,
                  borderColor: errors.address ? 'var(--danger)' : focusedField === 'address' ? 'var(--accent)' : 'var(--surface-border)',
                  boxShadow: errors.address ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : focusedField === 'address' ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
                }}
                placeholder="123 Main Street"
                value={checkoutData.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                onFocus={() => setFocusedField('address')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.address && <div style={errorText}>{errors.address}</div>}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Apt / Suite (optional)</label>
              <input
                style={inputStyle}
                placeholder="Apt 4B"
                value={checkoutData.apt}
                onChange={(e) => handleFieldChange('apt', e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>City</label>
                <input
                  style={{
                    ...inputStyle,
                    borderColor: errors.city ? 'var(--danger)' : focusedField === 'city' ? 'var(--accent)' : 'var(--surface-border)',
                    boxShadow: errors.city ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : focusedField === 'city' ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
                  }}
                  placeholder="New York"
                  value={checkoutData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  onFocus={() => setFocusedField('city')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.city && <div style={errorText}>{errors.city}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>State</label>
                <input
                  style={{
                    ...inputStyle,
                    borderColor: errors.state ? 'var(--danger)' : focusedField === 'state' ? 'var(--accent)' : 'var(--surface-border)',
                    boxShadow: errors.state ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : focusedField === 'state' ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
                  }}
                  placeholder="NY"
                  value={checkoutData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  onFocus={() => setFocusedField('state')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.state && <div style={errorText}>{errors.state}</div>}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>ZIP Code</label>
              <input
                style={{
                  ...inputStyle,
                  borderColor: errors.zip ? 'var(--danger)' : focusedField === 'zip' ? 'var(--accent)' : 'var(--surface-border)',
                  boxShadow: errors.zip ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : focusedField === 'zip' ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
                }}
                placeholder="10001"
                value={checkoutData.zip}
                onChange={(e) => handleFieldChange('zip', e.target.value.replace(/\D/g, '').slice(0, 10))}
                onFocus={() => setFocusedField('zip')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.zip && <div style={errorText}>{errors.zip}</div>}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={btnBack} onClick={() => setStep(1)}>Back</button>
              <FlashyButton onClick={() => handleNext(3)} disabled={isTransitioning}>
                Continue to Review
              </FlashyButton>
            </div>
          </>
        )}

        {/* ── Step 3: Review + Payment ── */}
        {step === 3 && (
          <>
            <h3 style={title}>The Final Gambit</h3>
            <p style={subtitle}>Review your move before committing</p>

            {/* Expanded Items */}
            <div style={summaryCard}>
              {cart.flatMap((item) => {
                const items = [];
                for (let i = 0; i < item.quantity; i++) {
                  const lineId = `${item.id}-${i}`;
                  const isEditing = editMode && editingItemId === lineId;

                  let nickname = null;
                  if (item.id === 'p_1') {
                    const nicknames = [
                      'The Dark Square', 'Midnight Gambit', 'Silent Pawn', 'Rook\'s Shadow',
                      'Queen\'s Void', 'Knight\'s Whisper', 'Bishop\'s Haze', 'Endgame',
                      'Checkmate', 'The En Passant', 'Castled King', 'Forked Path',
                      'Sacrifice', 'The Zwischenzug', 'Blitz Spirit', 'Stalemate',
                      'The Sicilian', 'Queen\'s Gambit', 'King\'s Indian', 'The Berlin',
                      'Nimzo-Indian', 'Grünfeld', 'Caro-Kann', 'The Dragon',
                      'The Najdorf', 'The Marshall', 'The Botvinnik', 'The Tal',
                      'The Petrosian', 'The Karpov', 'The Kasparov', 'The Fischer',
                      'The Morphy', 'The Capablanca', 'The Alekhine', 'The Lasker',
                      'The Steinitz', 'The Philidor', 'The Reti', 'The Larsen',
                      'The Pirc', 'The Modern', 'The Dutch', 'The Benoni',
                      'The Trompowsky', 'The London', 'The Colle', 'The Torre',
                      'The Stonewall', 'The Hypermodern',
                    ];
                    nickname = nicknames[Math.floor(Math.random() * nicknames.length)];
                  }

                  return (
                    <div key={lineId} style={{
                      ...summaryRow,
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      borderBottom: i < item.quantity - 1 ? '1px solid var(--surface-border)' : 'none',
                      padding: '10px 0',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                          {nickname && (
                            <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '2px' }}>
                              &ldquo;{nickname}&rdquo;
                            </div>
                          )}
                          {item.selectedSize && (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                              Size: {item.selectedSize}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
                            ${item.price}
                          </div>
                          {!editMode && (
                            <button
                              onClick={() => { setEditMode(true); setEditingItemId(lineId); }}
                              style={{
                                background: 'none',
                                border: '1px solid var(--surface-border)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '0.75rem',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {isEditing && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => {
                                  const { addToCart, removeFromCart } = useStore.getState();
                                  removeFromCart(item.id);
                                  setEditingItemId(null);
                                  setEditMode(false);
                                }}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  border: '1px solid var(--surface-border)',
                                  background: 'transparent',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '1rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                &minus;
                              </button>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '16px', textAlign: 'center' }}>1</span>
                              <button
                                onClick={() => {
                                  const { addToCart } = useStore.getState();
                                  addToCart(item);
                                  setEditingItemId(null);
                                  setEditMode(false);
                                }}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  border: '1px solid var(--surface-border)',
                                  background: 'transparent',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '1rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                +
                              </button>
                              <button
                                onClick={() => { setEditingItemId(null); setEditMode(false); }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--accent)',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '4px 6px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Confirm
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                return items;
              })}
              <div style={summaryTotal}>
                <span>Total</span>
                <span className="text-gradient">${cartTotal}</span>
              </div>
            </div>

            <div style={summaryCard}>
              <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem' }}>Shipping To</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                {checkoutData.fullName}<br />
                {checkoutData.address}{checkoutData.apt ? `, ${checkoutData.apt}` : ''}<br />
                {checkoutData.city}, {checkoutData.state} {checkoutData.zip}
              </div>
            </div>

            {/* Payment Options — styled like Apple Pay card */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.9rem' }}>Payment Method</div>

              {/* Credit Card Option */}
              <PaymentOption
                icon={<span style={{ color: 'var(--accent)' }}>💳</span>}
                name="Credit Card"
                description="Pay with any major credit or debit card"
                onClick={() => setReviewPaymentMethod('card')}
                isSelected={reviewPaymentMethod === 'card'}
              />

              {/* Inline Credit Card Form */}
              {reviewPaymentMethod === 'card' && (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-border)',
                  borderTop: 'none',
                  borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                  padding: '20px',
                  marginTop: '-4px',
                  marginBottom: '16px',
                }}>
                  <CreditCardForm
                    onSubmit={handleCardSubmit}
                    onBack={() => setStep(2)}
                    cartTotal={cartTotal}
                    processing={cardProcessing}
                  />
                </div>
              )}

              {/* PayPal Option */}
              <PaymentOption
                icon={<span style={{ color: '#0070BA' }}>🅿️</span>}
                name="PayPal"
                description="Pay with your PayPal account"
                onClick={() => setReviewPaymentMethod('paypal')}
                isSelected={reviewPaymentMethod === 'paypal'}
              />

              {/* PayPal Buttons */}
              {reviewPaymentMethod === 'paypal' && (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--surface-border)',
                  borderTop: 'none',
                  borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                  padding: '20px',
                  marginTop: '-4px',
                  marginBottom: '16px',
                }}>
                  <PayPalScriptProvider
                    options={{
                      "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "AQub0ybcBhKw3l3eNbbIaChnt6irK9TPL_laWYIeEOlmdZd_ARJsD7hwPqPL_23uLsRoPRMk5NqHSdtS",
                      currency: "USD",
                      intent: "capture",
                      "enable-funding": "applepay",
                    }}
                  >
                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        color: "gold",
                        shape: "rect",
                        label: "paypal",
                      }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          purchase_units: [
                            {
                              description: "KIZUKI Store Purchase",
                              amount: {
                                value: cartTotal.toFixed(2),
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        try {
                          const details = await actions.order.capture();
                          console.log("Payment Details:", details);
                          const orderData = {
                            ...checkoutData,
                            items: cart,
                            total: cartTotal,
                            paypalOrderId: data.orderID,
                            payer: details.payer,
                            paymentMethod: 'paypal',
                            timestamp: new Date().toISOString(),
                          };
                          console.log('Order submitted:', orderData);
                          clearCart();
                          onClose();
                        } catch (error) {
                          console.error("Payment Capture Error:", error);
                        }
                      }}
                      onError={(err) => {
                        console.error("PayPal Error:", err);
                      }}
                      onCancel={() => {
                        console.log("User cancelled the payment process.");
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Step 4: PayPal Direct ── */}
        {step === 4 && (
          <>
            <h3 style={title}>Complete Your Purchase</h3>
            <p style={subtitle}>Review your order and complete payment</p>

            <div style={summaryCard}>
              {cart.map((item) => (
                <div key={item.id} style={summaryRow}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>&times; {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    ${item.price * item.quantity}
                  </div>
                </div>
              ))}
              <div style={summaryTotal}>
                <span>Total</span>
                <span className="text-gradient">${cartTotal}</span>
              </div>
            </div>

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
                        amount: { value: cartTotal.toFixed(2) },
                      }],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    try {
                      const details = await actions.order.capture();
                      console.log("Payment Details:", details);
                      const orderData = {
                        ...checkoutData,
                        items: cart,
                        total: cartTotal,
                        paypalOrderId: data.orderID,
                        payer: details.payer,
                        paymentMethod: 'paypal',
                        timestamp: new Date().toISOString(),
                      };
                      console.log('Order submitted:', orderData);
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
      </div>
    </div>
  );
};

export default CheckoutModal;
