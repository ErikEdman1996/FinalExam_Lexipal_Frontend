import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const variantClassName =
    variant === 'outline'
      ? 'bg-surface text-text border border-border hover:bg-surface-alt'
      : 'bg-brand text-text-on-brand border border-transparent hover:bg-brand-hover';

  return (
    <button
      className={`h-11 px-4 rounded-[14px] font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand ${variantClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
