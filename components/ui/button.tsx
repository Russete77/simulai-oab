import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const baseClass =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover active:scale-[0.98] shadow-sm',
  secondary: 'bg-surface text-ink-1 border hover:bg-surface-2 active:scale-[0.98]',
  ghost: 'bg-transparent text-ink-1 hover:bg-surface-2 active:scale-[0.98]',
  danger: 'bg-danger text-white hover:opacity-90 active:scale-[0.98] shadow-sm',
  outline: 'bg-surface text-ink-1 border hover:bg-surface-2 active:scale-[0.98]',
  neon: 'bg-accent text-accent-fg hover:bg-accent-hover active:scale-[0.98] shadow-sm',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(
        baseClass,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
