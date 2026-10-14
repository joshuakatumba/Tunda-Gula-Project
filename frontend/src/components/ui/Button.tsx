import React from 'react';

type ButtonVariant = 'primary' | 'outline' | 'text';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  block?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', block = false, children, style, ...props }) => {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-inter)',
    fontWeight: 500,
    fontSize: '16px',
    cursor: 'pointer',
    display: block ? 'flex' : 'inline-flex',
    width: block ? '100%' : 'auto',
    minHeight: '44px',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-obsidian)',
      color: 'var(--color-paper)',
      borderRadius: 'var(--radius-buttons)',
      padding: '11px 24px',
      border: 'none',
    },
    outline: {
      backgroundColor: 'var(--color-paper)',
      color: 'var(--color-obsidian)',
      borderRadius: 'var(--radius-buttons)',
      padding: '11px 24px',
      border: '1px solid var(--color-charcoal)',
    },
    text: {
      backgroundColor: 'transparent',
      color: 'var(--color-obsidian)',
      padding: '8px 12px',
      border: 'none',
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
