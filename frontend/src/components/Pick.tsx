import React from "react";
import { Typography } from "./ui/Typography";

export const Pick = ({ on, ic, t, d, onClick }: { on: boolean, ic: React.ReactNode, t: string, d: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    style={{
      textAlign: 'left',
      padding: '16px',
      borderRadius: 'var(--radius-cards)',
      border: '1px solid',
      borderColor: on ? 'var(--color-forest-ink)' : 'var(--color-pebble)',
      backgroundColor: on ? 'var(--color-linen-mist)' : 'var(--color-paper)',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
      width: '100%',
      transition: 'all 0.2s ease',
      boxShadow: on ? 'var(--shadow-lg)' : 'var(--shadow-subtle)',
    }}
  >
    <span style={{ fontSize: '24px', color: 'var(--color-forest-ink)', lineHeight: 1 }}>{ic}</span>
    <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <Typography variant="body" style={{ fontWeight: 700, color: 'var(--color-forest-ink)' }}>{t}</Typography>
      <Typography variant="body-sm" style={{ color: 'var(--color-slate)' }}>{d}</Typography>
    </span>
  </button>
);
