'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value !== '');
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value !== '');
      props.onChange?.(e);
    };

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          className={clsx(
            'peer w-full bg-navy-800/50 border-2 rounded-xl px-4 text-white transition-all duration-200',
            'focus:border-blue-500 focus:outline-none',
            'placeholder-transparent',
            error ? 'border-red-500' : 'border-navy-700',
            label ? 'pt-6 pb-2' : 'py-3',
            className
          )}
          placeholder={label || props.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />

        {label && (
          <label
            className={clsx(
              'absolute left-4 transition-all duration-200 pointer-events-none',
              'text-navy-600',
              (isFocused || hasValue || props.value)
                ? 'top-2 text-xs text-blue-400'
                : 'top-4 text-base'
            )}
          >
            {label}
          </label>
        )}

        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
