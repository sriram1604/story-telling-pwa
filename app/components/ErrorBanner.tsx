'use client';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

/**
 * ErrorBanner – dismissible red alert strip for API and mic errors.
 */
export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="error-banner fade-in-up"
      style={{ position: 'relative' }}
    >
      <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
      <span style={{ flex: 1, fontSize: '14px' }}>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        style={{
          background: 'none',
          border: 'none',
          color: '#fca5a5',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '2px 6px',
          borderRadius: '4px',
          transition: 'opacity 0.2s',
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
