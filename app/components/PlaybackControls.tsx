'use client';

import type { PlaybackState } from '../types';

interface PlaybackControlsProps {
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
  /** Called when user wants to re-listen from the start */
  onRestart?: () => void;
}

/**
 * PlaybackControls – play / pause / stop / restart TTS controls.
 * Adapts button states based on current playback.
 */
export default function PlaybackControls({
  playbackState,
  onPlay,
  onPause,
  onResume,
  onStop,
  onRestart,
  disabled = false,
}: PlaybackControlsProps) {
  const isIdle    = playbackState === 'idle';
  const isPlaying = playbackState === 'playing';
  const isPaused  = playbackState === 'paused';

  return (
    <div
      role="group"
      aria-label="Story playback controls"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}
    >
      {/* ── Restart (rewind) ─────────────────────────────────────────────── */}
      <button
        id="playback-restart"
        type="button"
        className="btn-icon"
        title="Restart from beginning"
        disabled={disabled || (isIdle && !onRestart)}
        onClick={onRestart}
        aria-label="Restart story"
      >
        ⏮
      </button>

      {/* ── Play / Pause ─────────────────────────────────────────────────── */}
      {isPlaying ? (
        <button
          id="playback-pause"
          type="button"
          disabled={disabled}
          onClick={onPause}
          aria-label="Pause narration"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 28px',
            borderRadius: '9999px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--clr-secondary) 0%, #be185d 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(236,72,153,0.4)',
            transition: 'all 0.3s ease',
          }}
        >
          ⏸ Pause
        </button>
      ) : isPaused ? (
        <button
          id="playback-resume"
          type="button"
          className="btn-primary"
          disabled={disabled}
          onClick={onResume}
          aria-label="Resume narration"
        >
          ▶ Resume
        </button>
      ) : (
        <button
          id="playback-play"
          type="button"
          className="btn-primary"
          disabled={disabled}
          onClick={onPlay}
          aria-label="Play story narration"
        >
          ▶ Listen
        </button>
      )}

      {/* ── Stop ─────────────────────────────────────────────────────────── */}
      <button
        id="playback-stop"
        type="button"
        className="btn-icon"
        title="Stop narration"
        disabled={disabled || isIdle}
        onClick={onStop}
        aria-label="Stop narration"
      >
        ⏹
      </button>
    </div>
  );
}
