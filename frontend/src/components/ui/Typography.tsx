import React from 'react';

type TypographyVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'body-sm' | 'caption';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: React.ElementType;
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({ variant = 'body', as, children, style, ...props }) => {
  const baseStyle: React.CSSProperties = {
    margin: 0,
    color: 'inherit',
  };

  const variants: Record<TypographyVariant, React.CSSProperties> = {
    display: {
      fontFamily: 'var(--font-wise-sans)',
      fontWeight: 900,
      fontSize: 'clamp(60px, 8vw, 105px)',
      lineHeight: 0.85,
      letterSpacing: '-0.03em',
      color: 'var(--color-obsidian)',
    },
    h1: {
      fontFamily: 'var(--font-wise-sans)',
      fontWeight: 900,
      fontSize: 'clamp(40px, 5vw, 61px)',
      lineHeight: 1.1,
      letterSpacing: '-0.015em',
      color: 'var(--color-obsidian)',
    },
    h2: {
      fontFamily: 'var(--font-inter)',
      fontWeight: 700,
      fontSize: '36px',
      lineHeight: 1.25,
      letterSpacing: '-0.011em',
    },
    h3: {
      fontFamily: 'var(--font-inter)',
      fontWeight: 700,
      fontSize: '25px',
      lineHeight: 1.3,
      letterSpacing: '-0.009em',
    },
    body: {
      fontFamily: 'var(--font-inter)',
      fontWeight: 400,
      fontSize: '18px',
      lineHeight: 1.5,
      color: 'var(--color-charcoal)',
    },
    'body-sm': {
      fontFamily: 'var(--font-inter)',
      fontWeight: 400,
      fontSize: '16px',
      lineHeight: 1.5,
      color: 'var(--color-slate)',
    },
    caption: {
      fontFamily: 'var(--font-inter)',
      fontWeight: 500,
      fontSize: '14px',
      lineHeight: 1.55,
      color: 'var(--color-pebble)',
    },
  };

  const Component = as || (
    variant === 'display' ? 'h1' : 
    variant === 'h1' ? 'h1' : 
    variant === 'h2' ? 'h2' : 
    variant === 'h3' ? 'h3' : 
    'p'
  );

  return (
    <Component style={{ ...baseStyle, ...variants[variant], ...style }} {...props}>
      {children}
    </Component>
  );
};
