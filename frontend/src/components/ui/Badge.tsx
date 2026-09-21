import React from 'react';

type BadgeVariant = 'default' | 'inverted' | 'accent';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, style, ...props }) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-inter)',
    fontWeight: 500,
    fontSize: '12px',
    borderRadius: 'var(--radius-tags)',
    padding: '4px 12px',
    whiteSpace: 'nowrap',
  };

  const variants: Record<BadgeVariant, React.CSSProperties> = {
    default: {
      backgroundColor: 'var(--color-fog)',
      color: 'var(--color-charcoal)',
    },
    inverted: {
      backgroundColor: 'var(--color-forest-ink)',
      color: 'var(--color-lime-voltage)',
    },
    accent: {
      backgroundColor: 'var(--color-linen-mist)',
      color: 'var(--color-forest-ink)',
    }
  };

  return (
    <span style={{ ...baseStyle, ...variants[variant], ...style }} {...props}>
      {children}
    </span>
  );
};
