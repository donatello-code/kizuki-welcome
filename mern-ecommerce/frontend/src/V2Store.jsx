import React, { useState } from 'react';
import useStore from './store';
import AnimationMiddleware from './AnimationMiddleware';
import SizeSelectorModal from './SizeSelectorModal';
import ExtraChessboardModal from './ExtraChessboardModal';

const PRODUCTS = [
  { 
    id: 'p_1', 
    name: 'Symbolic Chessboard', 
    price: 99, 
    description: 'A canvas for the quiet storm within. This is not merely a board — it is a second skin woven from midnight threads and the ghosts of forgotten games. Each square remembers the clack of ivory, the geometry of sacrifice, the silence between moves. Play on it, and the board follows you into the world. The pieces are already in play.', 
    image: '/cheeseboard-hoodie.png',
    remaining: 14,
    needsSize: false,
  },
  { 
    id: 'p_2', 
    name: 'Chessboard in my Heart', 
    price: 99, 
    description: 'Oversized, loose-fit cut that drapes like a second skin. Crafted from premium extra-thick sheer black fabric — heavy enough to hold its shape, light enough to move with you. The darkness is the point: a void that absorbs light, a silhouette that commands without shouting.', 
    image: '/hoodie-hero.png',
    remaining: 47,
    needsSize: true,
  },
];

const V2Store = ({ onAddToCart }) => {
  const { addToCart } = useStore();
  const [sizeModalProduct, setSizeModalProduct] = useState(null);
  const [showExtraBoard, setShowExtraBoard] = useState(false);

  const handleAddToCart = (product) => {
    addToCart(product);
    if (onAddToCart) onAddToCart();
  };

  const handleCustomizeClick = (product) => {
    setSizeModalProduct(product);
  };

  const handleSizeConfirm = (productWithSize) => {
    addToCart(productWithSize);
    setSizeModalProduct(null);
    // Show the extra chessboard prompt
    setShowExtraBoard(true);
  };

  const handleSkipExtraBoard = () => {
    setShowExtraBoard(false);
    if (onAddToCart) onAddToCart();
  };

  const handleAddExtraBoard = (quantity) => {
    const boardProduct = PRODUCTS[0]; // Symbolic Chessboard
    for (let i = 0; i < quantity; i++) {
      addToCart(boardProduct);
    }
    setShowExtraBoard(false);
    if (onAddToCart) onAddToCart();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 20px 60px' }}>
      <AnimationMiddleware animation="anim-fade-in-up">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            color: 'var(--accent)',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Limited Run Founders Edition
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2 }}>
            Choose Your <span className="text-gradient">Armor</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
            Two silhouettes. One legacy. Each piece is a statement — pick the one that speaks to the player within.
          </p>
        </div>
      </AnimationMiddleware>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '40px',
        alignItems: 'stretch',
      }}>
        {PRODUCTS.map((product, index) => (
          <AnimationMiddleware key={product.id} delay={`delay-${(index + 1) * 200}`} animation="anim-scale-up">
            <div className="glass hover-lift" style={{ 
              borderRadius: 'var(--radius-lg)', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%',
              position: 'relative',
            }}>
              {/* Stock remaining */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 2,
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                backdropFilter: 'blur(8px)',
              }}>
                {product.remaining} remaining
              </div>

              {/* Image */}
              <div style={{ 
                height: '380px', 
                overflow: 'hidden', 
                position: 'relative',
                background: 'linear-gradient(180deg, rgba(10,10,12,0) 0%, rgba(10,10,12,0.8) 100%)',
              }}>
                <img 
                  src={product.image} 
                  alt={product.name} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' 
                  }} 
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.08)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(0deg, rgba(10,10,12,0.9) 0%, transparent 100%)',
                }} />
              </div>

              {/* Content */}
              <div style={{ 
                padding: '32px', 
                display: 'flex', 
                flexDirection: 'column', 
                flex: 1,
                position: 'relative',
                zIndex: 1,
              }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  marginBottom: '12px',
                  lineHeight: 1.3,
                }}>
                  {product.name}
                </h3>
                
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.95rem', 
                  lineHeight: 1.7, 
                  marginBottom: '24px', 
                  flex: 1 
                }}>
                  {product.description}
                </p>

                {/* Price + CTA */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--surface-border)',
                }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px' }}>Price</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }} className="text-gradient">
                      ${product.price}
                    </div>
                  </div>
                  {product.needsSize ? (
                    <button 
                      className="btn btn-primary" 
                      style={{ 
                        padding: '14px 28px',
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => handleCustomizeClick(product)}
                    >
                      Customize
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary" 
                      style={{ 
                        padding: '14px 28px',
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </AnimationMiddleware>
        ))}
      </div>

      {/* Bottom CTA */}
      <AnimationMiddleware delay="delay-400" animation="anim-fade-in-up">
        <div style={{
          textAlign: 'center',
          marginTop: '80px',
          padding: '48px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)',
          border: '1px solid var(--surface-border)',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '8px' }}>
            Both pieces are cut from the same cloth — but each tells a different story.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Free shipping on orders over $150. Delivery within 3–5 business days.
          </p>
        </div>
      </AnimationMiddleware>

      {/* Size Selector Modal */}
      {sizeModalProduct && (
        <SizeSelectorModal
          product={sizeModalProduct}
          onClose={() => setSizeModalProduct(null)}
          onConfirm={handleSizeConfirm}
        />
      )}

      {/* Extra Chessboard Modal */}
      {showExtraBoard && (
        <ExtraChessboardModal
          onClose={() => { setShowExtraBoard(false); if (onAddToCart) onAddToCart(); }}
          onSkip={handleSkipExtraBoard}
          onAddBoard={handleAddExtraBoard}
        />
      )}
    </div>
  );
};

export default V2Store;
