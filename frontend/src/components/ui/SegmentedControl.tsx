import React from 'react';

export interface Segment {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  activeId: string;
  onChange: (id: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ segments, activeId, onChange }) => {
  return (
    <div style={{
      display: 'inline-flex',
      backgroundColor: 'var(--color-fog)',
      borderRadius: 'var(--radius-navsegments)',
      padding: '4px',
    }}>
      {segments.map((segment) => {
        const isActive = activeId === segment.id;
        return (
          <button
            key={segment.id}
            onClick={() => onChange(segment.id)}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-navsegments)',
              fontFamily: 'var(--font-inter)',
              fontWeight: isActive ? 600 : 500,
              fontSize: '14px',
              backgroundColor: isActive ? 'var(--color-lime-voltage)' : 'transparent',
              color: isActive ? 'var(--color-forest-ink)' : 'var(--color-charcoal)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
};
