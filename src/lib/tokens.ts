/**
 * BAOMS Centralized Design Tokens
 * Babawatoto Organization Management System
 * 
 * Defines standard visual properties, color references, spacing grids,
 * typography scales, and accessible enterprise interaction dimensions.
 */

export const TOKENS = {
  colors: {
    // Primary Brand Ochre/Gold & Amber
    brand: {
      DEFAULT: '#D68904',
      hover: '#B86E03',
      light: '#FDF9F0',
      border: '#F7DEAF',
      text: '#75410C',
    },
    amberGold: {
      DEFAULT: '#F2A507',
      hover: '#D68904',
      light: '#FEFBF3',
    },
    // Surface & Backgrounds (Warm off-white, clean white surfaces)
    surface: {
      bg: '#F9FAFB',      // Main Page Background
      card: '#FFFFFF',    // Content Surface
      muted: '#F3F4F6',   // Muted Containers / Headers
      border: '#E5E7EB',  // Subtle Neutral Border
      hover: '#F9FAFB',   // Table / Item Hover
    },
    // Typography Charcoal
    charcoal: {
      default: '#1F2937', // Primary Text
      muted: '#4B5563',   // Secondary Labels & Descriptions
      light: '#6B7280',   // Placeholders & Inactive States
    },
    // Restrained Semantic Status Tokens (Accessible contrast with border & icon)
    status: {
      success: {
        bg: '#ECFDF5',
        text: '#065F46',
        border: '#A7F3D0',
        dot: '#10B981',
      },
      warning: {
        bg: '#FFFBEB',
        text: '#92400E',
        border: '#FDE68A',
        dot: '#F59E0B',
      },
      danger: {
        bg: '#FEF2F2',
        text: '#991B1B',
        border: '#FECACA',
        dot: '#EF4444',
      },
      info: {
        bg: '#F8FAFC',
        text: '#334155',
        border: '#E2E8F0',
        dot: '#64748B',
      },
    },
  },

  // 4px-based Spacing Reference
  spacing: {
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },

  // Typography Scale
  typography: {
    xs: { fontSize: '0.75rem', lineHeight: '1rem' },
    sm: { fontSize: '0.875rem', lineHeight: '1.25rem' },
    base: { fontSize: '1rem', lineHeight: '1.5rem' },
    lg: { fontSize: '1.125rem', lineHeight: '1.75rem' },
    xl: { fontSize: '1.25rem', lineHeight: '1.75rem' },
    '2xl': { fontSize: '1.5rem', lineHeight: '2rem' },
    '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' },
  },

  // Consistent Enterprise Heights
  heights: {
    header: '64px',
    sidebarItem: '40px',
    inputSm: '32px',
    inputMd: '40px',
    inputLg: '48px',
    buttonSm: '32px',
    buttonMd: '40px',
    buttonLg: '48px',
    tableRowCompact: '36px',
    tableRowDefault: '48px',
  },

  // Standard Border Radii
  radii: {
    sm: '0.25rem',  // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem',   // 8px
    xl: '0.75rem',  // 12px
    full: '9999px',
  },

  // Restrained Shadows (Never oversized)
  shadows: {
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    dropdown: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    modal: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
  },

  // Focus Ring
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D68904] focus-visible:ring-offset-1',

  // Layout Widths
  contentWidths: {
    max: 'max-w-7xl',
    compact: 'max-w-5xl',
    modal: 'max-w-lg',
  },
} as const;

export type DesignTokens = typeof TOKENS;
