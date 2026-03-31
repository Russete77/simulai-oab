/**
 * Loading Spinner Component
 *
 * Indicador de carregamento acessível e animado
 */

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Carregando',
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-b-blue-500 border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}...</span>
    </div>
  );
}

/**
 * Loading Spinner com texto
 */
export function LoadingWithText({
  text = 'Carregando',
  size = 'md',
}: {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className="flex items-center justify-center gap-3" role="status">
      <LoadingSpinner size={size} label={text} />
      <p className="text-white font-medium">{text}...</p>
    </div>
  );
}

/**
 * Loading Overlay (tela cheia)
 */
export function LoadingOverlay({ text = 'Carregando' }: { text?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="bg-navy-900/90 backdrop-blur-xl border border-navy-800 rounded-2xl p-8 shadow-2xl">
        <LoadingWithText text={text} size="lg" />
      </div>
    </div>
  );
}
