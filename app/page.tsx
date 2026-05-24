'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTextToSpeech }      from './hooks/useTextToSpeech';
import { useSavedStories }      from './hooks/useSavedStories';

// ── Types & Utilities ─────────────────────────────────────────────────────────
import type { LanguageCode, MoodType, Story, VoiceType } from './types';
import { splitIntoLines }                     from './utils/helpers';
import { LANGUAGES }                          from './utils/constants';

// ── Components ────────────────────────────────────────────────────────────────
// StarField uses canvas — always render client-side only
const StarField = dynamic(() => import('./components/StarField'), { ssr: false });

import LanguageSelector  from './components/LanguageSelector';
import MoodSelector      from './components/MoodSelector';
import MicButton         from './components/MicButton';
import TranscriptBox     from './components/TranscriptBox';
import StoryDisplay      from './components/StoryDisplay';
import PlaybackControls  from './components/PlaybackControls';
import SavedStories      from './components/SavedStories';
import ErrorBanner       from './components/ErrorBanner';

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {

  // ── Settings ───────────────────────────────────────────────────────────────
  const [language, setLanguage]   = useState<LanguageCode>('en-IN');
  const [mood, setMood]           = useState<MoodType>('moral');
  const [voiceType, setVoiceType] = useState<VoiceType>('female');

  // ── Story content ──────────────────────────────────────────────────────────
  const [storyLines, setStoryLines]     = useState<string[]>([]);
  const [storyTitle, setStoryTitle]     = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError]         = useState<string | null>(null);

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [showSaved, setShowSaved]       = useState(false);
  const [savedFlash, setSavedFlash]     = useState(false);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const speech = useSpeechRecognition(language);
  const tts    = useTextToSpeech();
  const vault  = useSavedStories();

  // ── Generate story ─────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const prompt = speech.transcript.trim();
    if (!prompt) {
      setApiError('Please speak or type a story idea first.');
      return;
    }

    tts.stop();
    setApiError(null);
    setIsGenerating(true);
    setStoryLines([]);
    setStoryTitle('');

    try {
      const res = await fetch('/api/story', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt, language, mood }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      const lines = splitIntoLines(data.story as string);
      setStoryLines(lines);
      setStoryTitle((data.title as string) ?? lines[0] ?? 'Story');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Unknown error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [speech.transcript, language, mood, tts]);

  // ── Automatic Full Flow ────────────────────────────────────────────────────
  const wasListening = useRef(false);
  const prevGenerating = useRef(false);

  // Auto-generate when listening stops (due to silence or manual stop)
  useEffect(() => {
    if (wasListening.current && !speech.isListening && speech.transcript.trim() && !isGenerating) {
      handleGenerate();
    }
    wasListening.current = speech.isListening;
  }, [speech.isListening, speech.transcript, isGenerating, handleGenerate]);

  // Auto-play when generation finishes
  const handlePlay    = useCallback(() => tts.speak(storyLines, language, voiceType),       [tts, storyLines, language, voiceType]);
  const handleRestart = useCallback(() => tts.speak(storyLines, language, voiceType, 0),    [tts, storyLines, language, voiceType]);

  useEffect(() => {
    if (prevGenerating.current && !isGenerating && storyLines.length > 0) {
      handlePlay();
    }
    prevGenerating.current = isGenerating;
  }, [isGenerating, storyLines.length, handlePlay]);

  // ── Save / load ────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!storyLines.length) return;
    vault.saveStory(storyLines, language, mood, speech.transcript.trim());
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2800);
  }, [storyLines, language, mood, speech.transcript, vault]);

  const handleLoadSaved = useCallback((story: Story) => {
    tts.stop();
    setStoryLines(story.lines);
    setStoryTitle(story.title);
    setLanguage(story.language);
    setMood(story.mood);
    setShowSaved(false);
  }, [tts]);

  // ── Language change ────────────────────────────────────────────────────────
  const handleLanguageChange = useCallback((lang: LanguageCode) => {
    if (speech.isListening) speech.stopListening();
    setLanguage(lang);
  }, [speech]);

  // ── Convenience ───────────────────────────────────────────────────────────
  const hasStory          = storyLines.length > 0;
  const currentLangMeta   = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];
  const displayError      = apiError ?? speech.error;

  /* ═════════════════════════════════════════════════════════════════════════ */
  /* RENDER                                                                   */
  /* ═════════════════════════════════════════════════════════════════════════ */

  return (
    <main className="bg-app" style={{ minHeight: '100vh', position: 'relative' }}>

      {/* ── Starfield decorative background ─────────────────────────────── */}
      <StarField />

      {/* ── Page content (above canvas) ──────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(16px, 5vw, 48px) clamp(12px, 4vw, 24px)',
        }}
      >

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* HEADER                                                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <header style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 52px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <span style={{ fontSize: 'clamp(32px, 6vw, 52px)', lineHeight: 1 }}>📚</span>
            <h1
              className="gradient-text"
              style={{
                fontFamily:    'var(--font-display)',
                fontSize:      'clamp(30px, 7vw, 54px)',
                fontWeight:    800,
                letterSpacing: '-0.02em',
                lineHeight:    1,
              }}
            >
              KathaiKavi
            </h1>
            <span style={{ fontSize: 'clamp(32px, 6vw, 52px)', lineHeight: 1 }}>✨</span>
          </div>

          <p style={{ color: 'var(--clr-muted)', fontSize: 'clamp(13px, 2vw, 16px)', maxWidth: '480px', margin: '0 auto 18px' }}>
            Speak your idea · We detect silence · Hear your story come alive automatically!
          </p>

          {/* Feature pill badges */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-purple">🎤 Auto-Recording</span>
            <span className="badge badge-pink">🤖 Gemini Pro</span>
            <span className="badge badge-cyan">🔊 Auto TTS</span>
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ALERTS                                                          */}
        {/* ════════════════════════════════════════════════════════════════ */}

        {displayError && (
          <div style={{ marginBottom: '16px' }}>
            <ErrorBanner
              message={displayError}
              onDismiss={() => {
                setApiError(null);
                // Speech hook error auto-clears on next action; mirror here
              }}
            />
          </div>
        )}

        {savedFlash && (
          <div
            className="fade-in-up"
            style={{
              marginBottom:   '16px',
              background:     'rgba(16,185,129,0.12)',
              border:         '1px solid rgba(16,185,129,0.3)',
              borderRadius:   'var(--radius-md)',
              padding:        '12px 16px',
              color:          '#6ee7b7',
              fontSize:       '14px',
              display:        'flex',
              alignItems:     'center',
              gap:            '8px',
            }}
          >
            ✅ Story saved to your library!
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* INPUT CARD                                                      */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <section
          className="glass-card fade-in-up"
          style={{ padding: 'clamp(18px, 4vw, 32px)', marginBottom: '20px' }}
          aria-label="Story settings and voice input"
        >

          {/* ── Row 1: Settings ────────────────────────────────────────── */}
          <div
            style={{
              display:               'grid',
              gridTemplateColumns:   'repeat(auto-fit, minmax(180px, 1fr))',
              gap:                   '20px',
              marginBottom:          '26px',
            }}
          >
            <div>
              <p style={labelStyle}>Language</p>
              <LanguageSelector
                value={language}
                onChange={handleLanguageChange}
                disabled={isGenerating || speech.isListening}
              />
            </div>

            <div>
              <p style={labelStyle}>Story Mood</p>
              <MoodSelector
                value={mood}
                onChange={setMood}
                disabled={isGenerating}
              />
            </div>

            <div>
              <p style={labelStyle}>Voice Type</p>
              <select
                value={voiceType}
                onChange={(e) => setVoiceType(e.target.value as VoiceType)}
                disabled={isGenerating || tts.playbackState === 'playing'}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(26,26,56,0.6)',
                  border: '1px solid var(--clr-border)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="female">👩 Female Voice</option>
                <option value="male">👨 Male Voice</option>
                <option value="robot">🤖 Robot Voice</option>
              </select>
            </div>

          </div>

          {/* ── Row 2: Mic + Transcript ───────────────────────────────── */}
          <div
            style={{
              display:     'flex',
              gap:         'clamp(12px, 3vw, 24px)',
              alignItems:  'flex-start',
              flexWrap:    'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <MicButton
                isListening={speech.isListening}
                isSupported={speech.isSupported}
                onStart={speech.startListening}
                onStop={speech.stopListening}
                disabled={isGenerating}
              />
              
              {/* Animated Waveform Visualization */}
              {speech.isListening && (
                <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `rgba(236, 72, 153, ${Math.min(speech.volume / 100, 0.8)})`,
                    transform: `scale(${1 + speech.volume / 40})`,
                    transition: 'transform 0.1s, background 0.1s',
                    boxShadow: '0 0 15px rgba(236, 72, 153, 0.5)'
                  }}>
                    🎙️
                  </div>
                  <span style={{ fontSize: '12px', color: '#ec4899', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>
                    Listening...
                  </span>
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '180px' }}>
              <TranscriptBox
                transcript={speech.transcript}
                interimTranscript={speech.interimTranscript}
                isListening={speech.isListening}
                onClear={speech.clearTranscript}
                onChange={speech.setTranscript}
              />
            </div>
          </div>

          {/* ── Row 3: Action buttons (Optional now due to auto-flow) ─── */}
          <div
            style={{
              display:         'flex',
              justifyContent:  'center',
              gap:             '12px',
              marginTop:       '24px',
              flexWrap:        'wrap',
            }}
          >
            <button
              id="generate-story-btn"
              type="button"
              className="btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating || !speech.transcript.trim()}
              style={{ minWidth: '185px', fontSize: '16px', padding: '14px 32px' }}
            >
              {isGenerating ? (
                <>
                  <span style={spinnerStyle} />
                  Processing...
                </>
              ) : (
                '✨ Generate Story'
              )}
            </button>

            {hasStory && !isGenerating && (
              <button
                id="save-story-btn"
                type="button"
                className="btn-secondary"
                onClick={handleSave}
                style={{ minWidth: '135px' }}
              >
                🔖 Save Story
              </button>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STORY DISPLAY                                                   */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <section aria-label="Generated story" style={{ marginBottom: '20px' }}>
          <StoryDisplay
            lines={storyLines}
            currentLine={tts.currentLine}
            title={storyTitle}
            mood={mood}
            isLoading={isGenerating}
          />
        </section>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PLAYBACK CONTROLS                                               */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {hasStory && !isGenerating && (
          <section
            className="glass-card-sm fade-in-up"
            style={{ padding: '20px', marginBottom: '20px', textAlign: 'center' }}
            aria-label="Narration controls"
          >
            <p style={{ ...labelStyle, marginBottom: '14px', textAlign: 'center' }}>
              🔊 Narration · {currentLangMeta.flag} {currentLangMeta.label}
            </p>
            <PlaybackControls
              playbackState={tts.playbackState}
              onPlay={handlePlay}
              onPause={tts.pause}
              onResume={tts.resume}
              onStop={tts.stop}
              onRestart={handleRestart}
              disabled={!tts.isSupported}
            />
            
            {tts.isSupported && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 12px', background: 'rgba(26,26,56,0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)', maxWidth: '200px', width: '100%' }}>
                  <span style={{ fontSize: '14px' }}>🔉</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={tts.volume}
                    onChange={(e) => tts.setVolume(parseFloat(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: '#ec4899',
                      cursor: 'pointer'
                    }}
                    aria-label="Voice Volume"
                  />
                  <span style={{ fontSize: '14px' }}>🔊</span>
                </div>
              </div>
            )}
            {!tts.isSupported && (
              <p style={{ color: 'var(--clr-muted)', fontSize: '12px', marginTop: '10px' }}>
                Text-to-speech is not supported in this browser.
              </p>
            )}
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SAVED STORIES PANEL                                             */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <section aria-label="Saved stories library">
          <button
            id="toggle-saved-btn"
            type="button"
            onClick={() => setShowSaved(v => !v)}
            aria-expanded={showSaved}
            style={{
              width:          '100%',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              background:     'rgba(26,26,56,0.5)',
              border:         '1px solid var(--clr-border)',
              borderRadius:   'var(--radius-md)',
              padding:        '14px 18px',
              color:          'var(--clr-text)',
              fontSize:       '14px',
              fontWeight:     600,
              cursor:         'pointer',
              transition:     'all 0.2s',
              marginBottom:   showSaved ? '12px' : '0',
            }}
          >
            <span suppressHydrationWarning>📚 Saved Stories ({vault.savedStories.length})</span>
            <span
              style={{
                transition: 'transform 0.3s',
                transform:  showSaved ? 'rotate(180deg)' : 'none',
                fontSize:   '12px',
              }}
            >
              ▼
            </span>
          </button>

          {showSaved && (
            <div className="glass-card-sm fade-in-up" style={{ padding: '18px' }}>
              <SavedStories
                stories={vault.savedStories}
                onLoad={handleLoadSaved}
                onDelete={vault.deleteStory}
                onClearAll={vault.clearAll}
              />
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* FOOTER                                                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <footer
          style={{
            textAlign:   'center',
            marginTop:   '48px',
            paddingBottom: '24px',
            color:       'var(--clr-muted)',
            fontSize:    '13px',
          }}
        >
          <p>
            Powered by{' '}
            <span className="gradient-text" style={{ fontWeight: 700 }}>Google Gemini Pro</span>
            {' '}· Web Speech API · KathaiKavi ✨
          </p>
        </footer>
      </div>

      {/* ── Global animations ─────────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
      `}} />
    </main>
  );
}

/* ─── Shared inline style objects ────────────────────────────────────────── */

const labelStyle: React.CSSProperties = {
  fontSize:      '12px',
  fontWeight:    700,
  color:         'var(--clr-muted)',
  marginBottom:  '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

const spinnerStyle: React.CSSProperties = {
  display:      'inline-block',
  width:        '16px',
  height:       '16px',
  borderRadius: '50%',
  border:       '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#fff',
  animation:    'spin 0.7s linear infinite',
  flexShrink:   0,
};