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
      ? 'bg-white text-[#2C3E50] border border-[rgba(0,0,0,0.12)] hover:bg-[#F8F9FA]'
      : 'bg-[#A8E6CF] text-[#2C3E50] border border-transparent hover:bg-[#96ddc1]';

  return (
    <button
      className={`h-11 px-4 rounded-[14px] font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] ${variantClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
