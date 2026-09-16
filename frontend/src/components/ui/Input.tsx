import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, style, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {label && (
        <label style={{ 
          fontFamily: 'var(--font-inter)', 
          fontWeight: 600, 
          fontSize: '12px', 
          color: 'var(--color-slate)' 
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '16px',
          fontWeight: 400,
          padding: '12px 16px',
          borderRadius: 'var(--radius-inputs)',
          border: '1px solid var(--color-pebble)',
          backgroundColor: 'var(--color-paper)',
          color: 'var(--color-charcoal)',
          transition: 'all 0.2s ease',
          ...style
        }}
        {...props}
      />
    </div>
  );
};
