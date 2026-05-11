import React, { useState } from 'react';

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  padding: '20px',
};

const modalContent = {
  background: '#141416',
  border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '0',
  maxWidth: '480px',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
};

const closeBtn = {
  position: 'absolute',
  top: '16px',
  right: '16px',
  zIndex: 10,
  background: 'rgba(0,0,0,0.5)',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  fontSize: '1.5rem',
  fontFamily: 'inherit',
  lineHeight: 1,
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const ExtraChessboardModal = ({ onClose, onSkip, onAddBoard }) => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hide-scrollbar" style={modalContent}>
        <button style={closeBtn} onClick={onClose}>×</button>

        {/* Hero Image */}
        <div style={{
          height: '220px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <img 
            src="/cheeseboard-hoodie.png" 
            alt="Chessboard"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'linear-gradient(0deg, #141416 0%, transparent 100%)',
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: '0 32px 32px', marginTop: '-20px', position: 'relative', zIndex: 1 }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
            Add the <span className="text-gradient">Board</span>?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
            Complete the set. The Symbolic Chessboard — a canvas for the quiet storm within. Each square remembers the clack of ivory, the geometry of sacrifice, the silence between moves.
          </p>

          {/* Quantity Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: '24px',
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Quantity</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid var(--surface-border)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                −
              </button>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid var(--surface-border)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onSkip}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid var(--surface-border)',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
              }}
            >
              Skip
            </button>
            <button
              onClick={() => onAddBoard(quantity)}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                color: 'white',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Add — ${99 * quantity}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtraChessboardModal;
