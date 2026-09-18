'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ToolbarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  active?: boolean;
};

export function ToolbarButton({
  label,
  children,
  active = false,
  className = '',
  ...props
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--foreground)]'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
