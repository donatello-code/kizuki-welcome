// ─── Shipping Constants ───────────────────────────────────
export const SHIPPING_FEE = 14; // $14 flat rate
export const FREE_SHIPPING_THRESHOLD = 149; // Free shipping at $149+

// ─── Calculate subtotal (sum of item prices) ──────────────
export function calcSubtotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ─── Calculate shipping fee (free at $149+) ───────────────
export function calcShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

// ─── Calculate total (subtotal + shipping) ────────────────
export function calcTotal(cart) {
  const subtotal = calcSubtotal(cart);
  const shipping = calcShipping(subtotal);
  return subtotal + shipping;
}

// ─── Get shipping line text ───────────────────────────────
export function getShippingText(subtotal) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 'FREE';
  return `$${SHIPPING_FEE}.00`;
}

// ─── Get free shipping progress message ───────────────────
export function getFreeShippingProgress(subtotal) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return null;
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  return `Add $${remaining.toFixed(0)} more for free shipping`;
}
