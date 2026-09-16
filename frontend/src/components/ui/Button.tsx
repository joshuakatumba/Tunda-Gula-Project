import React from 'react';

type ButtonVariant = 'primary' | 'outline' | 'text';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, style, ...props }) => {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-inter)',
    fontWeight: 500,
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-lime-voltage)',
      color: 'var(--color-forest-ink)',
      borderRadius: 'var(--radius-buttons)',
      padding: '11px 24px',
      border: 'none',
    },
    outline: {
      backgroundColor: 'var(--color-paper)',
      color: 'var(--color-forest-ink)',
      borderRadius: 'var(--radius-buttons)',
      padding: '11px 24px',
      border: '1px solid var(--color-forest-ink)',
    },
    text: {
      backgroundColor: 'transparent',
      color: 'var(--color-forest-ink)',
      padding: '8px 12px',
      border: 'none',
      textDecoration: 'underline',
    },
  };

  return (
    <button
      style={{ ...baseStyle, ...variants[variant], ...style, opacity: props.disabled ? 0.5 : 1 }}
      {...props}
    >
      {children}
    </button>
  );
};
