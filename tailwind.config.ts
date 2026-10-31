import type { Config } from 'tailwindcss'

/**
 * Clothing Store — Tailwind CSS Configuration
 *
 * Strategy: extend (never override) so @nuxt/ui's built-in utilities stay intact.
 *
 * Design token mapping:
 *   CSS variable          → Tailwind utility class
 *   --surface-bg          → bg-surface-bg
 *   --surface-card        → bg-surface-card
 *   --text-primary        → text-ink
 *   --border-subtle       → border-subtle
 *   --brand-900           → text-brand-900 / bg-brand-900
 *   --status-green        → text-status-green / bg-status-green-bg
 *
 * Spacing: use Tailwind default scale (1=4px, 2=8px, 4=16px, 6=24px, 8=32px).
 * Our 8px grid maps cleanly: p-2=8px, p-4=16px, p-6=24px, p-8=32px, gap-3.5=14px.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({
  // Dark mode: class-based (matches nuxt.config colorMode)
  darkMode: 'class',

  theme: {
    extend: {
      // ── Color System ──────────────────────────────────────────────────
      colors: {
        // Surfaces
        surface: {
          bg: '#F5F5F5',      // page canvas / gray wash
          card: '#FFFFFF',    // elevated cards, panels
          input: '#FAFAFA',   // form inputs
          hover: '#F0F0F0',   // hover state
          active: '#EAEAEA',  // pressed / active state
        },

        // Borders (neutral only — per AGENTS.md rule: no colorful borders)
        subtle: '#E8E8E8',    // `border-subtle`  very faint dividers
        border: {
          subtle: '#E8E8E8',
          default: '#D8D8D8',
          strong: '#BDBDBD',
        },

        // Text / Ink
        ink: {
          DEFAULT: '#111111',   // body text  (`text-ink`)
          secondary: '#5C5C5C', // labels, meta
          tertiary: '#9E9E9E',  // placeholders, hints
          inverse: '#FFFFFF',   // white text on dark bg
        },

        // Brand palette — charcoal/navy, no rainbow
        brand: {
          50:  '#F9FAFB',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',  // main brand accent  (`bg-brand-900`, `text-brand-900`)
        },

        // Status — muted, matches --status-* vars
        status: {
          green:    '#1A7F37',
          'green-bg': '#DCFCE7',
          amber:    '#92400E',
          'amber-bg': '#FEF3C7',
          red:      '#9B1C1C',
          'red-bg': '#FEE2E2',
          blue:     '#1D4ED8',
          'blue-bg': '#DBEAFE',
        },
      },

      // ── Typography ────────────────────────────────────────────────────
      fontFamily: {
        body: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Inter Tight', 'ui-monospace', 'Cascadia Code', 'monospace'],
      },

      // ── Border Radius ─────────────────────────────────────────────────
      borderRadius: {
        sm: '4px',   // `rounded-sm`
        md: '8px',   // `rounded-md`  (also Tailwind default)
        lg: '12px',  // `rounded-lg`
        xl: '16px',  // `rounded-xl`
        full: '9999px',
      },

      // ── Box Shadow ────────────────────────────────────────────────────
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        modal: '0 20px 25px -5px rgba(0,0,0,0.20)',
        header: '0 1px 4px rgba(0,0,0,0.06)',
        focus: '0 0 0 3px rgba(15,23,42,0.07)',
      },

      // ── Width shortcuts ───────────────────────────────────────────────
      width: {
        'sidebar-icon': '56px',
        'cart-panel': '410px',
      },

      minWidth: {
        'cart-panel': '410px',
      },

      // ── Height shortcuts ──────────────────────────────────────────────
      height: {
        'header': '60px',
        'checkout-btn': '48px',
      },

      minHeight: {
        'header': '60px',
      },
    },
  },

  // POS-specific safelist: classes generated dynamically (v-bind, template literals)
  safelist: [
    'bg-status-green-bg',
    'bg-status-amber-bg',
    'bg-status-red-bg',
    'bg-status-blue-bg',
    'text-status-green',
    'text-status-amber',
    'text-status-red',
    'text-status-blue',
  ],
} as unknown as Config)
