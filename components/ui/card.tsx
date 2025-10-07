import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'premium' | 'solid';
  children: React.ReactNode;
}

export function Card({ variant = 'glass', className, children, ...props }: CardProps) {
  const variants = {
    glass: 'bg-navy-900/80 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-blue-500/20',
    premium: 'relative p-[2px] bg-gradient-to-r from-blue-500 to-purple-500',
    solid: 'bg-navy-900 border border-navy-800',
  };

  if (variant === 'premium') {
    return (
      <div className={clsx(variants.premium, 'rounded-2xl', className)} {...props}>
        <div className="bg-navy-900 rounded-2xl p-6 h-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-2xl p-6 transition-all duration-300',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx('text-2xl font-bold font-heading text-white', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={clsx('text-navy-600 mt-2', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('', className)} {...props}>
      {children}
    </div>
  );
}
