import React, { useState, useEffect } from 'react';
import V2Landing from './V2Landing';
import V2Store from './V2Store';
import AdminPage from './AdminPage';
import CartModal from './CartModal';
import CheckoutModal from './CheckoutModal';
import ChessGame from './chess/ChessGame';
import ChessLoadingScreen from './chess/ChessLoadingScreen';
import useStore from './store';
import './index.css';

// ─── Image preloader ──────────────────────────────────────
const STORE_IMAGES = ['/cheeseboard-hoodie.png', '/hoodie-hero.png'];

// ─── Main App ─────────────────────────────────────────────
const V2App = () => {
  const [currentView, setCurrentView] = useState('store'); // 'landing' | 'store' | 'admin'
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const { cart, shouldShowLoadingScreen, completeLoadingScreen } = useStore();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ─── Loading screen logic ──────────────────────────────
  useEffect(() => {
    // If the loading screen was completed within the last 12 hours, skip it
    if (!shouldShowLoadingScreen()) {
      setShowLoading(false);
    }
  }, [shouldShowLoadingScreen]);

  const handleLoadingComplete = () => {
    completeLoadingScreen();
    setShowLoading(false);
  };


  // ─── Subdomain + Hash-based routing ────────────────────
  // admin.kizuki.vip → always shows admin panel
  // localhost / kizuki.vip with #admin hash → shows admin panel
  useEffect(() => {
    const hostname = window.location.hostname;
    const isAdminSubdomain = hostname === 'admin.kizuki.vip' || hostname === 'admin.localhost';

    const handleHashChange = () => {
      // If on admin subdomain, always stay on admin
      if (isAdminSubdomain) {
        setCurrentView('admin');
        return;
      }
      const hash = window.location.hash.replace('#', '');
      if (hash === 'admin') {
        setCurrentView('admin');
      } else if (hash === 'chess') {
        setCurrentView('chess');
      } else if (hash === 'store') {
        setCurrentView('store');
      } else if (hash === 'landing') {
        setCurrentView('landing');
      }
    };

    // Check initial state
    if (isAdminSubdomain) {
      setCurrentView('admin');
    } else {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view) => {
    setCurrentView(view);
    window.location.hash = view;
  };

  const handleOpenCheckout = () => {
    setShowCartModal(false);
    setShowCheckoutModal(true);
  };

  // ─── Loading Screen ────────────────────────────────────
  if (showLoading) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <ChessLoadingScreen onComplete={handleLoadingComplete} />
      </div>
    );
  }


  // ─── Chess View (full page, no store nav/footer) ──────
  if (currentView === 'chess') {
    return (
      <ChessGame onBack={() => navigateTo('store')} />
    );
  }

  // ─── Admin View (no nav/footer) ────────────────────────
  if (currentView === 'admin') {
    return (
      <AdminPage onBackToStore={() => navigateTo('store')} />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
        background: 'rgba(10, 10, 12, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--surface-border)'
      }}>
        <div 
          style={{ fontSize: '1.5rem', fontWeight: 800, cursor: 'pointer', letterSpacing: '2px' }}
          onClick={() => navigateTo('store')}
        >
          KIZUKI<span className="text-gradient">.</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={() => navigateTo('chess')}
            style={{
              background: 'transparent',
              border: '1px solid var(--surface-border)',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
          >
            ♚ Chess
          </button>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'var(--surface)', 
              padding: '8px 16px', 
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--surface-border)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setShowCartModal(true)}
            className="hover-glow"
          >
            <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{cartCount}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {currentView === 'landing' ? (
          <V2Landing onShopClick={() => navigateTo('store')} />
        ) : (
          <V2Store onAddToCart={handleOpenCheckout} />
        )}
      </main>
      
      {/* Footer */}
      <footer style={{ padding: '40px', borderTop: '1px solid var(--surface-border)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>© {new Date().getFullYear()} KIZUKI. Designed with precision and modern aesthetics.</p>
      </footer>

      {/* Cart Modal */}
      {showCartModal && (
        <CartModal 
          onClose={() => setShowCartModal(false)} 
          onCheckout={handleOpenCheckout}
        />
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <CheckoutModal onClose={() => setShowCheckoutModal(false)} />
      )}
    </div>
  );
};

export default V2App;
