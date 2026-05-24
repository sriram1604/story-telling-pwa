// ─── Language Types ──────────────────────────────────────────────────────────

export type LanguageCode = 'en-IN' | 'hi-IN' | 'ta-IN';

export interface Language {
  code: LanguageCode;
  label: string;         // Display name e.g. "English"
  nativeLabel: string;   // Native script e.g. "தமிழ்"
  flag: string;          // Emoji flag
}

// ─── Story Mood Types ─────────────────────────────────────────────────────────

export type MoodType = 'moral' | 'funny' | 'adventure' | 'magical' | 'scary';

export interface Mood {
  id: MoodType;
  label: string;
  emoji: string;
  color: string;         // CSS color for active badge
}

// ─── Voice Types ────────────────────────────────────────────────────────────────

export type VoiceType = 'female' | 'male' | 'robot';

// ─── Story Types ──────────────────────────────────────────────────────────────

export interface Story {
  id: string;            // uuid-style timestamp id
  title: string;         // First meaningful sentence used as title
  lines: string[];       // Story split into individual sentences/lines
  language: LanguageCode;
  mood: MoodType;
  createdAt: number;     // Unix timestamp ms
  prompt: string;        // Original user prompt
}

// ─── TTS State ────────────────────────────────────────────────────────────────

export type PlaybackState = 'idle' | 'playing' | 'paused';

export interface TTSControls {
  playbackState: PlaybackState;
  currentLine: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  skipTo: (index: number) => void;
}

// ─── Speech Recognition State ─────────────────────────────────────────────────

export interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface StoryApiResponse {
  story: string;
  title: string;
  error?: string;
}
