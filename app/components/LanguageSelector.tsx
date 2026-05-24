'use client';

import type { LanguageCode, Language } from '../types';
import { LANGUAGES } from '../utils/constants';

interface LanguageSelectorProps {
  value: LanguageCode;
  onChange: (lang: LanguageCode) => void;
  disabled?: boolean;
}

/**
 * LanguageSelector – pill-style toggle buttons for language selection.
 */
export default function LanguageSelector({
  value,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Select story language"
      style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
    >
      {LANGUAGES.map((lang: Language) => {
        const isActive = lang.code === value;
        return (
          <button
            key={lang.code}
            id={`lang-btn-${lang.code}`}
            type="button"
            disabled={disabled}
            onClick={() => onChange(lang.code)}
            aria-pressed={isActive}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '9999px',
              border: `1.5px solid ${isActive ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
              background: isActive
                ? 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(124,58,237,0.15) 100%)'
                : 'rgba(26,26,56,0.5)',
              color: isActive ? '#a78bfa' : 'var(--clr-muted)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '14px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              boxShadow: isActive ? '0 0 12px rgba(139,92,246,0.3)' : 'none',
            }}
          >
            <span style={{ fontSize: '16px' }}>{lang.flag}</span>
            <span>{lang.nativeLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
