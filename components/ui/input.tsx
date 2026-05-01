'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leadingIcon, trailingIcon, className, id, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? inputId + '-error' : undefined;
  const hintId = hint ? inputId + '-hint' : undefined;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="block mb-1.5 text-sm font-medium text-ink-1">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {leadingIcon ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none">
            {leadingIcon}
          </div>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={clsx(
            'w-full h-10 bg-surface text-ink-1 placeholder:text-ink-3',
            'border rounded-md transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leadingIcon ? 'pl-10' : 'pl-3',
            trailingIcon ? 'pr-10' : 'pr-3',
            error ? 'border-danger focus:border-danger focus:ring-danger/20' : '',
            className
          )}
          {...props}
        />
        {trailingIcon ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none">
            {trailingIcon}
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
});
