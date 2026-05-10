import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import useStore from './store';
import theme, { sharedStyles } from './theme';

// Replace with your actual Stripe publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

const { colors, spacing, radius, font } = theme;

const styles = {
  container: {
    padding: `${spacing.xl} 0`,
  },
  cardElementContainer: {
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
    fontSize: font.sizeXs,
  },
  success: {
    color: colors.accent,
    marginBottom: spacing.md,
    fontSize: font.sizeXs,
  },
  processing: {
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontSize: font.sizeXs,
  },
};

const cardElementOptions = {
  style: {
    base: {
      fontSize: font.sizeSm,
      color: colors.text,
      '::placeholder': {
        color: colors.textDim,
      },
    },
    invalid: {
      color: colors.danger,
    },
  },
};

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { cart, clearCart } = useStore();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      // Get backend URL from env or default
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      // Create payment intent on backend
      const response = await fetch(`${backendUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({ id: item.id })),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setProcessing(false);
        return;
      }

      // Confirm card payment
      const cardElement = elements.getElement(CardElement);
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (paymentError) {
        setError(paymentError.message);
        setProcessing(false);
      } else if (paymentIntent.status === 'succeeded') {
        setSuccess('Payment successful! Thank you for your order.');
        clearCart();
        setProcessing(false);
      }
    } catch (err) {
      setError('Failed to process payment. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.container}>
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}
      {processing && <div style={styles.processing}>Processing payment...</div>}

      <div style={styles.cardElementContainer}>
        <CardElement options={cardElementOptions} />
      </div>

      <button
        type="submit"
        style={sharedStyles.button}
        disabled={!stripe || processing}
        onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.target.style.opacity = '1')}
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

export default Checkout;
