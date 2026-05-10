import React from 'react';
import useStore from './store';

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
};

const CartModal = ({ onClose, onCheckout }) => {
  const { cart, removeFromCart } = useStore();
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalContent}>
        <button style={closeBtn} onClick={onClose}>×</button>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', textAlign: 'center' }}>
          Your <span className="text-gradient">Cart</span>
        </h3>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, margin: '0 auto 16px' }}>
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {cart.map((item) => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--surface-border)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      ${item.price} × {item.quantity}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: 800, color: 'var(--accent)' }}>
                      ${item.price * item.quantity}
                    </div>
                    <button
                      style={{
                        padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 600,
                        cursor: 'pointer', border: 'none', fontSize: '0.85rem',
                        background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                        fontFamily: 'inherit'
                      }}
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid var(--surface-border)', paddingTop: '20px', marginBottom: '24px'
            }}>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Total</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800 }} className="text-gradient">${cartTotal}</span>
            </div>

            <button
              style={{
                width: '100%', padding: '16px', borderRadius: 'var(--radius-sm)', fontWeight: 600,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit', fontSize: '1rem',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                color: 'white', transition: 'all 0.3s ease'
              }}
              onClick={onCheckout}
            >
              Proceed to Checkout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;
