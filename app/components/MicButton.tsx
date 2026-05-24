'use client';

interface MicButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

/**
 * MicButton – glowing pulsing button to start/stop speech recognition.
 * Shows animated ripple rings while recording.
 */
export default function MicButton({
  isListening,
  isSupported,
  onStart,
  onStop,
  disabled = false,
}: MicButtonProps) {
  const handleClick = () => {
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  const isDisabled = !isSupported || disabled;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      {/* Mic button with ripple rings */}
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        {/* Ripple rings – shown only while recording */}
        {isListening && (
          <>
            <span className="mic-ring" style={{ animationDelay: '0s' }} />
            <span className="mic-ring" style={{ animationDelay: '0.5s' }} />
          </>
        )}

        <button
          id="mic-button"
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          aria-label={isListening ? 'Stop recording' : 'Start recording'}
          aria-pressed={isListening}
          className={`mic-btn${isListening ? ' recording' : ''}`}
        >
          {isListening ? '⏹' : '🎤'}
        </button>
      </div>

      {/* Status text */}
      <span
        style={{
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: isListening ? 'var(--clr-secondary)' : 'var(--clr-muted)',
          transition: 'color 0.3s',
        }}
      >
        {!isSupported
          ? 'Not supported'
          : isListening
          ? 'Listening…'
          : 'Tap to speak'}
      </span>
    </div>
  );
}
