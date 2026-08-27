/**
 * Constantes de cores para charts (Recharts, Chart.js, etc.)
 *
 * Usar estas constantes ao invés de hex hardcoded nos componentes de gráfico.
 * Valores alinhados com o design system (tailwind.config.ts + globals.css).
 *
 * v2.0 (jul/2026): background/card/grid/text agora usam var(--...) direto —
 * SVG (Recharts) resolve CSS custom properties normalmente, então os charts
 * acompanham o tema light/dark automaticamente sem precisar de duas cópias
 * hardcoded. As cores de série (primary/secondary/success/...) continuam
 * hex fixo de propósito — cor de série não deve mudar com o tema.
 *
 * @see DESIGN_SYSTEM.md seção 4.1
 */

export const CHART_COLORS = {
  // Backgrounds — seguem o tema via CSS var (antes eram hex fixo do navy antigo)
  background: 'var(--bg)',
  card: 'var(--surface)',
  grid: 'var(--border)',
  gridStroke: 'var(--border-strong)',

  // Text — idem
  text: 'var(--text-2)',      // muted
  textLight: 'var(--text-1)', // principal

  // Accent colors — paleta v2.0 (azul Simulai #004AC6), fixos entre temas
  primary: '#004ac6',       // accent (light) / equivalente à marca
  secondary: '#7c3aed',     // violet-600, mantido do v1
  success: '#059669',       // success-legal
  error: '#ba1a1a',         // error
  warning: '#d97706',       // warning-caution
  cyan: '#06b6d4',          // cyan-500, mantido
  pink: '#ec4899',          // pink-500, mantido
  indigo: '#6366f1',        // indigo-500, mantido

  // Subject colors (matérias OAB) — array rotativo para gráficos
  subjects: [
    '#004ac6',  // primary (era blue-500)
    '#7c3aed',  // violet-600
    '#06b6d4',  // cyan-500
    '#059669',  // success-legal (era green-500)
    '#d97706',  // warning-caution (era amber-500)
    '#ec4899',  // pink-500
    '#6366f1',  // indigo-500
    '#f97316',  // orange-500
    '#14b8a6',  // teal-500
    '#a855f7',  // violet-500
    '#ba1a1a',  // error (era red-500)
    '#84cc16',  // lime-500
    '#0ea5e9',  // sky-500
    '#d946ef',  // fuchsia-500
    '#eab308',  // yellow-500
    '#f43f5e',  // rose-500
    '#2dd4bf',  // teal-400
  ] as const,
} as const;

/**
 * Retorna cor de matéria por índice (com wrap-around)
 */
export function getSubjectColor(index: number): string {
  return CHART_COLORS.subjects[index % CHART_COLORS.subjects.length];
}

/**
 * Constantes de status para badges e indicadores.
 * v2.0: hex alinhado com --success/--warning/--danger/--accent de globals.css
 * (usando arbitrary values do Tailwind já que essas vars não expõem canais
 * rgb separados para o modificador de opacidade nativo).
 */
export const STATUS_COLORS = {
  success: {
    bg: 'bg-[#059669]/10',
    border: 'border-[#059669]/20',
    text: 'text-[#059669]',
    icon: 'text-[#059669]',
    full: 'bg-[#059669]/10 border-[#059669]/20 text-[#059669]',
  },
  error: {
    bg: 'bg-[#ba1a1a]/10',
    border: 'border-[#ba1a1a]/20',
    text: 'text-[#ba1a1a]',
    icon: 'text-[#ba1a1a]',
    full: 'bg-[#ba1a1a]/10 border-[#ba1a1a]/20 text-[#ba1a1a]',
  },
  warning: {
    bg: 'bg-[#d97706]/10',
    border: 'border-[#d97706]/20',
    text: 'text-[#d97706]',
    icon: 'text-[#d97706]',
    full: 'bg-[#d97706]/10 border-[#d97706]/20 text-[#d97706]',
  },
  info: {
    bg: 'bg-[#004ac6]/10',
    border: 'border-[#004ac6]/20',
    text: 'text-[#004ac6]',
    icon: 'text-[#004ac6]',
    full: 'bg-[#004ac6]/10 border-[#004ac6]/20 text-[#004ac6]',
  },
  premium: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-500',
    icon: 'text-purple-500',
    full: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
  },
} as const;
