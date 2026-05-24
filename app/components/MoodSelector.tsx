'use client';

import type { MoodType, Mood } from '../types';
import { MOODS } from '../utils/constants';

interface MoodSelectorProps {
  value: MoodType;
  onChange: (mood: MoodType) => void;
  disabled?: boolean;
}

/**
 * MoodSelector – emoji pill buttons to select the story's emotional tone.
 */
export default function MoodSelector({ value, onChange, disabled = false }: MoodSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Select story mood"
      style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
    >
      {MOODS.map((mood: Mood) => {
        const isActive = mood.id === value;
        return (
          <button
            key={mood.id}
            id={`mood-btn-${mood.id}`}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mood.id)}
            aria-pressed={isActive}
            title={mood.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 15px',
              borderRadius: '9999px',
              border: `1.5px solid ${isActive ? mood.color : 'var(--clr-border)'}`,
              background: isActive
                ? `${mood.color}22`
                : 'rgba(26,26,56,0.5)',
              color: isActive ? mood.color : 'var(--clr-muted)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '13px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s ease',
              boxShadow: isActive ? `0 0 10px ${mood.color}44` : 'none',
            }}
          >
            <span style={{ fontSize: '15px' }}>{mood.emoji}</span>
            <span>{mood.label}</span>
          </button>
        );
      })}
    </div>
  );
}
