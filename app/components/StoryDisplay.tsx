'use client';

import { useRef, useEffect } from 'react';
import type { MoodType } from '../types';
import { MOODS } from '../utils/constants';
import { truncate } from '../utils/helpers';

interface StoryDisplayProps {
  lines: string[];
  currentLine: number;     // -1 = none highlighted
  title: string;
  mood: MoodType;
  isLoading: boolean;
}

/**
 * StoryDisplay – renders the story sentence-by-sentence.
 * The active line (being spoken by TTS) is highlighted with a purple left border.
 * Auto-scrolls the active line into view.
 */
export default function StoryDisplay({
  lines,
  currentLine,
  title,
  mood,
  isLoading,
}: StoryDisplayProps) {
  const activeRef = useRef<HTMLParagraphElement | null>(null);

  // Scroll active line into view smoothly
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentLine]);

  const moodMeta = MOODS.find(m => m.id === mood) ?? MOODS[0];

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          {/* Spinner */}
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '3px solid rgba(139,92,246,0.2)',
              borderTopColor: 'var(--clr-primary)',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ color: 'var(--clr-muted)', fontSize: '14px', fontWeight: 500 }}>
            Weaving your story…
          </span>
        </div>

        {/* Shimmer placeholders */}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="shimmer"
            style={{
              marginBottom: '12px',
              width: `${75 + Math.sin(i) * 20}%`,
              opacity: 1 - i * 0.1,
            }}
          />
        ))}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (lines.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '48px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '56px', lineHeight: 1 }}>📖</div>
        <p style={{ color: 'var(--clr-muted)', fontSize: '15px', maxWidth: '320px' }}>
          Speak or type your story idea, choose a mood, and press{' '}
          <strong style={{ color: 'var(--clr-primary)' }}>Generate Story</strong> to begin.
        </p>
      </div>
    );
  }

  // ── Story view ─────────────────────────────────────────────────────────────

  return (
    <div className="glass-card fade-in-up" style={{ padding: '28px' }}>
      {/* Story header */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '22px' }}>{moodMeta.emoji}</span>
          <h2
            className="gradient-text"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 700 }}
          >
            {truncate(title, 80)}
          </h2>
        </div>
        <span
          className="badge"
          style={{
            background: `${moodMeta.color}22`,
            color: moodMeta.color,
            border: `1px solid ${moodMeta.color}44`,
          }}
        >
          {moodMeta.emoji} {moodMeta.label}
        </span>
      </div>

      {/* Story lines */}
      <div
        role="region"
        aria-label="Story text"
        style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}
      >
        {lines.map((line, idx) => {
          const isActive = idx === currentLine;
          return (
            <p
              key={idx}
              ref={isActive ? activeRef : null}
              className={`story-line${isActive ? ' active' : ''}`}
              style={{ animationDelay: `${idx * 0.03}s` }}
              onClick={() => {/* handled in parent via skipTo */}}
              data-index={idx}
            >
              {/* Line-number dot */}
              {isActive && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--clr-primary)',
                    marginRight: '8px',
                    verticalAlign: 'middle',
                    boxShadow: '0 0 6px var(--clr-primary)',
                  }}
                />
              )}
              {line}
            </p>
          );
        })}
      </div>

      {/* Line progress */}
      {currentLine >= 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--clr-muted)' }}>
              Line {currentLine + 1} / {lines.length}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--clr-muted)' }}>
              {Math.round(((currentLine + 1) / lines.length) * 100)}%
            </span>
          </div>
          <div style={{ background: 'rgba(139,92,246,0.1)', borderRadius: '2px', height: '3px' }}>
            <div
              className="progress-bar"
              style={{ width: `${((currentLine + 1) / lines.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
