import type { Language, Mood, LanguageCode } from '../types';

// ─── Supported Languages ──────────────────────────────────────────────────────

export const LANGUAGES: Language[] = [
  {
    code: 'en-IN',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇮🇳',
  },
  {
    code: 'hi-IN',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    flag: '🇮🇳',
  },
  {
    code: 'ta-IN',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    flag: '🇮🇳',
  },
];

// ─── Story Moods ──────────────────────────────────────────────────────────────

export const MOODS: Mood[] = [
  { id: 'moral',     label: 'Moral',     emoji: '🌟', color: '#f59e0b' },
  { id: 'funny',     label: 'Funny',     emoji: '😄', color: '#06b6d4' },
  { id: 'adventure', label: 'Adventure', emoji: '⚔️', color: '#10b981' },
  { id: 'magical',   label: 'Magical',   emoji: '✨', color: '#8b5cf6' },
  { id: 'scary',     label: 'Scary',     emoji: '👻', color: '#ef4444' },
];

// ─── Language → Voice BCP-47 locale map ──────────────────────────────────────

export const VOICE_LOCALE_MAP: Record<LanguageCode, string[]> = {
  'en-IN': ['en-IN', 'en-GB', 'en-US'],
  'hi-IN': ['hi-IN', 'hi'],
  'ta-IN': ['ta-IN', 'ta'],
};

// ─── Language → Gemini instruction ───────────────────────────────────────────

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  'en-IN': 'English',
  'hi-IN': 'Hindi (हिन्दी)',
  'ta-IN': 'Tamil (தமிழ்)',
};

// ─── localStorage key ─────────────────────────────────────────────────────────

export const SAVED_STORIES_KEY = 'kathai_kavi_saved_stories';

// ─── Max stories to save ──────────────────────────────────────────────────────

export const MAX_SAVED_STORIES = 20;
