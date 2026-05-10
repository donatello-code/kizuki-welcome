import React, { useState } from 'react';

const SIZES = [
  { label: 'XS', available: false },
  { label: 'S', available: true },
  { label: 'M', available: true },
  { label: 'L', available: true },
  { label: 'XL', available: true },
];

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
  maxWidth: '520px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  position: 'relative',
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

const SizeSelectorModal = ({ product, onClose, onConfirm }) => {
  const [selectedSize, setSelectedSize] = useState(null);

  const handleContinue = () => {
    if (!selectedSize) return;
    onConfirm({ ...product, selectedSize });
  };

  return (
    <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hide-scrollbar" style={modalContent}>
        <button style={closeBtn} onClick={onClose}>×</button>

        {/* Hero Image */}
        <div style={{
          height: '280px',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}>
          <img 
            src={product.image} 
            alt={product.name}
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
          {/* Product Name */}
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
            {product.name}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
            Oversized, loose-fit cut. Premium extra-thick sheer black fabric — heavy enough to hold its shape, light enough to move with you. The darkness is the point: a void that absorbs light, a silhouette that commands without shouting.
          </p>

          {/* Size Label */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Select Size
            </span>
            {selectedSize && (
              <span style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}>
                {selectedSize} selected
              </span>
            )}
          </div>

          {/* Size Grid — cinematic, smaller pills */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '6px',
            marginBottom: '32px',
          }}>
            {SIZES.map((size) => {
              const isSelected = selectedSize === size.label;
              const isDisabled = !size.available;

              return (
                <button
                  key={size.label}
                  disabled={isDisabled}
                  onClick={() => setSelectedSize(size.label)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    letterSpacing: '0.5px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    border: isSelected
                      ? '1.5px solid var(--accent)'
                      : isDisabled
                        ? '1px solid rgba(255,255,255,0.04)'
                        : '1px solid var(--surface-border)',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.1))'
                      : isDisabled
                        ? 'rgba(255,255,255,0.02)'
                        : 'var(--surface)',
                    color: isDisabled
                      ? 'rgba(255,255,255,0.15)'
                      : isSelected
                        ? 'var(--accent)'
                        : 'var(--text-primary)',
                    textDecoration: isDisabled ? 'line-through' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    opacity: isDisabled ? 0.4 : 1,
                  }}
                >
                  {size.label}
                </button>
              );
            })}
          </div>

          {/* Price + Continue */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            paddingTop: '20px',
            borderTop: '1px solid var(--surface-border)',
          }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '2px' }}>Price</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }} className="text-gradient">
                ${product.price}
              </div>
            </div>
            <button
              style={{
                padding: '14px 32px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                cursor: selectedSize ? 'pointer' : 'not-allowed',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: '1rem',
                background: selectedSize
                  ? 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'
                  : 'var(--surface)',
                color: selectedSize ? 'white' : 'var(--text-secondary)',
                opacity: selectedSize ? 1 : 0.5,
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              disabled={!selectedSize}
              onClick={handleContinue}
            >
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeSelectorModal;
