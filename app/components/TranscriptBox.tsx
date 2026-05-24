'use client';

import { useRef, useEffect } from 'react';

interface TranscriptBoxProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  onClear: () => void;
  /** Called whenever the user edits the transcript textarea */
  onChange: (val: string) => void;
}

/**
 * TranscriptBox – editable text area showing speech recognition output.
 * Shows a live waveform animation and interim (in-progress) text while recording.
 */
export default function TranscriptBox({
  transcript,
  interimTranscript,
  isListening,
  onClear,
  onChange,
}: TranscriptBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(ta.scrollHeight, 64)}px`;
  }, [transcript]);

  const hasContent = transcript.trim().length > 0;

  return (
    <div className="glass-card-sm" style={{ padding: '16px', width: '100%' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Animated waveform while recording */}
          {isListening && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '20px' }}>
              {[12, 20, 14, 18, 10].map((h, i) => (
                <div
                  key={i}
                  className="wave-bar"
                  style={{ height: `${h}px`, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          )}
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-muted)' }}>
            {isListening ? 'Listening…' : 'Your idea'}
          </span>
        </div>

        {hasContent && !isListening && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear transcript"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--clr-muted)',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
              padding: '2px 6px',
              borderRadius: '6px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--clr-error)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--clr-muted)')}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Editable transcript ──────────────────────────────────────────── */}
      <textarea
        ref={textareaRef}
        id="transcript-textarea"
        value={transcript}
        onChange={e => onChange(e.target.value)}
        placeholder="Speak or type your story idea here…"
        rows={2}
        style={{
          width: '100%',
          minHeight: '56px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--clr-text)',
          fontSize: '15px',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.7,
          resize: 'none',
          overflowY: 'hidden',
        }}
      />

      {/* ── Interim / live text ──────────────────────────────────────────── */}
      {interimTranscript && (
        <p
          style={{
            fontSize: '14px',
            color: 'var(--clr-muted)',
            fontStyle: 'italic',
            marginTop: '4px',
            lineHeight: 1.5,
          }}
        >
          {interimTranscript}
          <span
            style={{
              display: 'inline-block',
              width: '2px',
              height: '14px',
              background: 'var(--clr-primary)',
              marginLeft: '3px',
              verticalAlign: 'middle',
              borderRadius: '1px',
              animation: 'blink 1s step-start infinite',
            }}
          />
        </p>
      )}

      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
