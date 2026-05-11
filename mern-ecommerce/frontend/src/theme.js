// Central monolithic theme config for KIZUKI e-commerce
// All core colors, spacing, typography, and shared styles live here.

const theme = {
  // Core palette
  colors: {
    bg: '#0a0a0a',           // Main background (matte black)
    card: '#141414',         // Card/section background
    border: '#2a2a2a',       // Border color
    text: '#ffffff',         // Primary text
    textMuted: '#a0a0a0',    // Secondary/muted text
    textDim: '#666',         // Dim text (empty states)
    accent: '#4ade80',       // Green accent (prices, buttons)
    danger: '#e63946',       // Red (remove, errors)
    disabled: '#555',        // Disabled button bg
  },

  // Spacing scale
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '40px',
  },

  // Border radius
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    full: '50%',
  },

  // Typography
  font: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sizeXs: '14px',
    sizeSm: '16px',
    sizeMd: '18px',
    sizeLg: '20px',
    sizeXl: '22px',
    sizeXxl: '24px',
    sizeXxxl: '28px',
    weightNormal: 'normal',
    weightBold: 'bold',
  },

  // Transitions
  transition: {
    fast: 'opacity 0.2s',
    normal: 'transform 0.2s, box-shadow 0.2s',
  },
};

// Shared composite styles built from theme tokens
export const sharedStyles = {
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xxl,
    border: `1px solid ${theme.colors.border}`,
  },
  cardSm: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
    border: `1px solid ${theme.colors.border}`,
  },
  button: {
    backgroundColor: theme.colors.accent,
    color: theme.colors.bg,
    border: 'none',
    padding: `${theme.spacing.md} ${theme.spacing.xxl}`,
    borderRadius: theme.radius.md,
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
    cursor: 'pointer',
    width: '100%',
    transition: theme.transition.fast,
  },
  input: {
    backgroundColor: theme.colors.bg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    color: theme.colors.text,
    fontSize: theme.font.sizeSm,
    width: '100%',
    outline: 'none',
  },
  sectionTitle: {
    fontSize: theme.font.sizeXl,
    fontWeight: theme.font.weightBold,
    marginBottom: theme.spacing.xl,
    color: theme.colors.text,
  },
};

export default theme;
