import React from 'react';
import { Typography } from './Typography';

interface GridItemProps {
  iconUrl?: string;
  fallbackInitial?: string;
  title: string;
  onClick?: () => void;
}

export const GridItem: React.FC<GridItemProps> = ({ iconUrl, fallbackInitial, title, onClick }) => {
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default',
        padding: '16px',
      }}
    >
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: 'var(--radius-imagemasks)',
        backgroundColor: 'var(--color-fog)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: '1px solid var(--color-pebble)'
      }}>
        {iconUrl ? (
          <img src={iconUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-forest-ink)' }}>
            {fallbackInitial}
          </span>
        )}
      </div>
      <Typography 
        variant="body-sm" 
        style={{ 
          color: 'var(--color-forest-ink)', 
          fontWeight: 500,
          textDecoration: onClick ? 'none' : 'none' 
        }}
      >
        {title}
      </Typography>
    </div>
  );
};
