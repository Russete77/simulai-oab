import type { Config } from "tailwindcss";

/**
 * Tailwind config — consome CSS vars de globals.css.
 * Filosofia Notion/Reflect: tokens semânticos, sem cor hardcoded em componente.
 *
 * Uso:
 *   bg-surface, bg-surface-2, text-1, text-2, border-default, border-strong,
 *   text-accent, bg-accent, bg-accent-soft, ring-default, etc.
 *
 * Paleta legada (navy.*) mantida pra compat durante migração — remover gradualmente.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // === Tokens semânticos (preferir esses) ===
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          overlay: "var(--surface-overlay)",
        },
        ink: {
          1: "var(--text-1)",
          2: "var(--text-2)",
          3: "var(--text-3)",
          disabled: "var(--text-disabled)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
          fg: "var(--accent-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          soft: "var(--warning-soft)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
        },

        // === Paleta legada (compat durante migração) ===
        navy: {
          950: "#0F172A",
          900: "#1E293B",
          800: "#334155",
          700: "#475569",
          600: "#64748B",
          500: "#94A3B8",
          400: "#CBD5E1",
          300: "#E2E8F0",
        },
      },
      borderColor: {
        DEFAULT: "var(--border)",
        strong: "var(--border-strong)",
        divider: "var(--divider)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        popover: "var(--shadow-popover)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      ringColor: {
        DEFAULT: "var(--ring)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        heading: ["Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Scale Notion-like (15px base)
        xs: ["12px", { lineHeight: "16px", letterSpacing: "0" }],
        sm: ["13px", { lineHeight: "20px", letterSpacing: "0" }],
        base: ["15px", { lineHeight: "24px", letterSpacing: "0" }],
        md: ["16px", { lineHeight: "24px", letterSpacing: "-0.005em" }],
        lg: ["18px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        xl: ["20px", { lineHeight: "28px", letterSpacing: "-0.012em" }],
        "2xl": ["24px", { lineHeight: "32px", letterSpacing: "-0.014em" }],
        "3xl": ["30px", { lineHeight: "38px", letterSpacing: "-0.018em" }],
        "4xl": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
        "5xl": ["48px", { lineHeight: "56px", letterSpacing: "-0.022em" }],
        "6xl": ["60px", { lineHeight: "68px", letterSpacing: "-0.024em" }],
      },
      spacing: {
        // gera classes p-18, m-18 etc — útil pra padding generoso de seções
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
      animation: {
        "fade-up": "fadeUp 280ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 220ms ease-out both",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
