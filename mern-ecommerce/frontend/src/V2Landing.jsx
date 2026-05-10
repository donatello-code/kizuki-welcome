import React from 'react';
import AnimationMiddleware from './AnimationMiddleware';

const V2Landing = ({ onShopClick }) => {
  return (
    <div style={{ padding: '120px 20px 60px', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Hero Background Image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: 0.12,
        backgroundImage: 'url(/hoodie-hero.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(3px)',
      }} />
      
      <AnimationMiddleware className="text-center" animation="anim-fade-in-up" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
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
          marginBottom: '24px',
        }}>
          Two Silhouettes. One Legacy.
        </span>
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 800, marginBottom: '24px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          The Board <br/><span className="text-gradient">Never Forgets</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto 48px auto', lineHeight: 1.6 }}>
          Every move leaves a trace. Every game etches its story into the fabric of the universe. Lead with light in a game designed to promote darkness.
        </p>
      </AnimationMiddleware>
      
      <AnimationMiddleware delay="delay-200">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary hover-lift" onClick={onShopClick} style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Claim Your Piece
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button className="btn btn-secondary hover-lift" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Story
          </button>
        </div>
      </AnimationMiddleware>

      <div style={{ height: '40px' }} />

      <AnimationMiddleware delay="delay-400" style={{ marginTop: '100px', width: '100%', maxWidth: '900px', position: 'relative', zIndex: 1 }}>
        <div className="glass hover-glow" style={{ borderRadius: 'var(--radius-lg)', padding: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ background: 'var(--surface-border)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 600 }}>NFT Key</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9rem' }}>Unlocks exclusive access to the full album. Only 10,000 minted — each key is a one-of-a-kind gateway to the soundscape.</p>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ background: 'var(--surface-border)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 600 }}>Sacred Materials</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9rem' }}>Born from organic cotton and intention.</p>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ background: 'var(--surface-border)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 600 }}>Delivered in Silence</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9rem' }}>Your piece arrives 6/11. Discreet. Reverent.</p>
          </div>
        </div>
      </AnimationMiddleware>
    </div>
  );
};

export default V2Landing;
