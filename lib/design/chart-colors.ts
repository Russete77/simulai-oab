/**
 * Constantes de cores para charts (Recharts, Chart.js, etc.)
 *
 * Usar estas constantes ao invés de hex hardcoded nos componentes de gráfico.
 * Valores alinhados com o design system (tailwind.config.ts + globals.css).
 *
 * @see DESIGN_SYSTEM.md seção 4.1
 */

export const CHART_COLORS = {
  // Backgrounds
  background: '#0f172a',    // navy-950
  card: '#1e293b',          // navy-900
  grid: '#334155',          // navy-800
  gridStroke: '#475569',    // navy-700

  // Text
  text: '#94a3b8',          // gray-400 (muted)
  textLight: '#cbd5e1',     // gray-300 (secondary)

  // Accent colors
  primary: '#3b82f6',       // blue-500
  secondary: '#8b5cf6',     // purple-500
  success: '#22c55e',       // green-500
  error: '#ef4444',         // red-500
  warning: '#f59e0b',       // amber-500
  cyan: '#06b6d4',          // cyan-500
  pink: '#ec4899',          // pink-500
  indigo: '#6366f1',        // indigo-500

  // Subject colors (matérias OAB) — array rotativo para gráficos
  subjects: [
    '#3b82f6',  // blue-500
    '#8b5cf6',  // purple-500
    '#06b6d4',  // cyan-500
    '#22c55e',  // green-500
    '#f59e0b',  // amber-500
    '#ec4899',  // pink-500
    '#6366f1',  // indigo-500
    '#f97316',  // orange-500
    '#14b8a6',  // teal-500
    '#a855f7',  // violet-500
    '#ef4444',  // red-500
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
 * Constantes de status para badges e indicadores
 */
export const STATUS_COLORS = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-500',
    icon: 'text-green-500',
    full: 'bg-green-500/10 border-green-500/20 text-green-500',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-500',
    icon: 'text-red-500',
    full: 'bg-red-500/10 border-red-500/20 text-red-500',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-500',
    icon: 'text-amber-500',
    full: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-500',
    icon: 'text-blue-500',
    full: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
  },
  premium: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-500',
    icon: 'text-purple-500',
    full: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
  },
} as const;
