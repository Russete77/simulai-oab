'use client';

import { clsx } from 'clsx';

export interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  description?: string;
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled,
  size = 'md',
  label,
  description,
  id,
}: ToggleProps) {
  const dimensions =
    size === 'sm'
      ? { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' }
      : { track: 'w-10 h-6', thumb: 'w-5 h-5', translate: 'translate-x-4' };

  const switchEl = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={clsx(
        'relative shrink-0 rounded-full transition-colors duration-200',
        dimensions.track,
        checked ? 'bg-accent' : 'bg-surface-2',
        'border',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer'
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 left-0.5 bg-surface rounded-full shadow-sm transition-transform duration-200',
          dimensions.thumb,
          checked && dimensions.translate
        )}
      />
    </button>
  );

  if (!label && !description) return switchEl;

  return (
    <label
      htmlFor={id}
      className={clsx(
        'flex items-start justify-between gap-3 py-1',
        !disabled && 'cursor-pointer'
      )}
    >
      <span className="min-w-0 flex-1">
        {label && <span className="block text-sm text-ink-1">{label}</span>}
        {description && (
          <span className="block text-xs text-ink-3 mt-0.5">{description}</span>
        )}
      </span>
      {switchEl}
    </label>
  );
}
