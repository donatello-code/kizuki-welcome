import React, { useState } from 'react';
import useStore from './store';
import Checkout from './Checkout';
import theme, { sharedStyles } from './theme';

const PRODUCTS = [
  { id: 'p_1', name: 'Chessboard', price: 99, description: 'A canvas for the quiet storm within. This is not merely a board — it is a second skin woven from midnight threads and the ghosts of forgotten games. Each square remembers the clack of ivory, the geometry of sacrifice, the silence between moves. Play on it, and the board follows you into the world. The pieces are already in play.' },
  { id: 'p_2', name: 'Hoodie', price: 99, description: 'Oversized, loose-fit cut that drapes like a second skin. Crafted from premium extra-thick sheer black fabric — heavy enough to hold its shape, light enough to move with you. The darkness is the point: a void that absorbs light, a silhouette that commands without shouting.' },
];

const { colors, spacing, radius, font, transition } = theme;

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: font.family,
    margin: 0,
    padding: 0,
  },
  header: {
    backgroundColor: colors.card,
    padding: `${spacing.xl} ${spacing.xxxl}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${colors.border}`,
  },
  title: {
    fontSize: font.sizeXxl,
    fontWeight: font.weightBold,
    color: colors.text,
    margin: 0,
  },
  cartBadge: {
    backgroundColor: colors.danger,
    color: colors.text,
    borderRadius: radius.full,
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    minWidth: '24px',
    textAlign: 'center',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `${spacing.xxxl} ${spacing.xl}`,
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: spacing.xxl,
    marginBottom: spacing.xxxl,
  },
  productName: {
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    marginBottom: spacing.sm,
  },
  productPrice: {
    fontSize: font.sizeXxxl,
    fontWeight: font.weightBold,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  productDesc: {
    color: colors.textMuted,
    marginBottom: spacing.xl,
    lineHeight: '1.5',
  },
  cartItemName: {
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
  },
  cartItemDetails: {
    color: colors.textMuted,
    fontSize: font.sizeXs,
  },
  removeBtn: {
    backgroundColor: 'transparent',
    color: colors.danger,
    border: `1px solid ${colors.danger}`,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: radius.sm,
    cursor: 'pointer',
    fontSize: font.sizeXs,
  },
  emptyCart: {
    textAlign: 'center',
    color: colors.textDim,
    padding: spacing.xxxl,
    fontSize: font.sizeMd,
  },
  totalText: {
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    color: colors.accent,
    marginBottom: spacing.xl,
  },
};

function App() {
  const { cart, addToCart, removeFromCart, userPhone, setAuth } = useStore();
  const [showCheckout, setShowCheckout] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>KIZUKI</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <span style={{ color: colors.textMuted }}>Cart:</span>
          <span style={styles.cartBadge}>{cartCount}</span>
        </div>
      </header>

      <main style={styles.main}>
        {/* Products Grid */}
        <h2 style={sharedStyles.sectionTitle}>Products</h2>
        <div style={styles.productsGrid}>
          {PRODUCTS.map((product) => (
            <div key={product.id} style={sharedStyles.card}>
              <div style={styles.productName}>{product.name}</div>
              <div style={styles.productPrice}>${product.price}</div>
              <div style={styles.productDesc}>{product.description}</div>
              <button
                style={sharedStyles.button}
                onClick={() => addToCart(product)}
                onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.target.style.opacity = '1')}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>

        {/* Cart Section */}
        <h2 style={sharedStyles.sectionTitle}>Your Cart</h2>
        {cart.length === 0 ? (
          <div style={styles.emptyCart}>Your cart is empty</div>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item.id} style={sharedStyles.cardSm}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <div style={styles.cartItemName}>{item.name}</div>
                    <div style={styles.cartItemDetails}>
                      ${item.price} x {item.quantity} = ${item.price * item.quantity}
                    </div>
                  </div>
                  <button
                    style={styles.removeBtn}
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div style={styles.totalText}>Total: ${cartTotal}</div>
          </>
        )}

        {/* Checkout Section */}
        <div style={{ ...sharedStyles.card, marginTop: spacing.xxxl }}>
          <h2 style={{ ...sharedStyles.sectionTitle, marginTop: 0 }}>Checkout</h2>
          <input
            style={sharedStyles.input}
            type="tel"
            placeholder="Enter your phone number"
            value={userPhone}
            onChange={(e) => setAuth(e.target.value)}
          />
          {!showCheckout ? (
            <button
              style={{
                ...sharedStyles.button,
                backgroundColor: cart.length === 0 ? colors.disabled : colors.accent,
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                marginTop: spacing.lg,
              }}
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
            >
              Proceed to Payment
            </button>
          ) : (
            <Checkout />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
