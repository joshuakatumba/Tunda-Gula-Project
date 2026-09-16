import React from 'react';
import { Typography } from './Typography';
import { LucideIcon } from 'lucide-react';

interface FeatureRowProps {
  features: {
    icon: LucideIcon;
    title: string;
    description: string;
  }[];
}

export const FeatureRow: React.FC<FeatureRowProps> = ({ features }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '32px',
      width: '100%',
    }}>
      {features.map((feature, idx) => {
        const Icon = feature.icon;
        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ color: 'var(--color-charcoal)' }}>
              <Icon size={24} strokeWidth={1.5} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Typography variant="body" style={{ fontWeight: 700, color: 'var(--color-obsidian)' }}>
                {feature.title}
              </Typography>
              <Typography variant="body-sm" style={{ color: 'var(--color-pebble)' }}>
                {feature.description}
              </Typography>
            </div>
          </div>
        );
      })}
    </div>
  );
};
