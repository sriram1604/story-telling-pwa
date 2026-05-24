'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { PlaybackState, LanguageCode, VoiceType } from '../types';
import { VOICE_LOCALE_MAP } from '../utils/constants';

export interface UseTextToSpeechReturn {
  playbackState: PlaybackState;
  currentLine: number;
  isSupported: boolean;
  speak: (lines: string[], language: LanguageCode, voiceType: VoiceType, startFrom?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skipTo: (index: number, lines: string[], language: LanguageCode, voiceType: VoiceType) => void;
  volume: number;
  setVolume: (val: number) => void;
}

/**
 * useTextToSpeech – wraps the browser SpeechSynthesis API.
 * Uses robust chunk-based (sentence-by-sentence) reading.
 * Replaces native .pause() with .cancel() & state tracking to avoid browser queue bugs.
 * Persists position in localStorage for seamless resume.
 */
export function useTextToSpeech(): UseTextToSpeechReturn {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentLine, setCurrentLine]     = useState(-1);
  const [isSupported, setIsSupported]     = useState(false);
  const [volume, setVolumeState]          = useState(1.0);

  // Refs to avoid stale closures during recursive speakLine calls
  const linesRef        = useRef<string[]>([]);
  const languageRef     = useRef<LanguageCode>('en-IN');
  const voiceTypeRef    = useRef<VoiceType>('female');
  const volumeRef       = useRef(1.0);
  const currentLineRef  = useRef(-1);
  const isStoppedRef    = useRef(false);
  const isPausedRef     = useRef(false);
  const currentUtterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  // ── Helper: Save position to local storage ────────────────────────────────
  const savePosition = useCallback((index: number) => {
    try {
      if (linesRef.current.length > 0) {
        localStorage.setItem('tts_last_state', JSON.stringify({
          linesKey: linesRef.current.join('|').slice(0, 1000), // fingerprint for current story
          currentLine: index
        }));
      }
    } catch (e) {
      console.error('Failed to save TTS position', e);
    }
  }, []);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    volumeRef.current = val;
    // If speaking, we can try to cancel and resume, but typically it takes effect on the next sentence.
    // For simplicity, we just let it take effect on the next spoken chunk.
  }, []);

  // ── Voice Picker ────────────────────────────────────────────────────────────
  const pickVoice = useCallback((language: LanguageCode, voiceType: VoiceType): SpeechSynthesisVoice | null => {
    const voices  = window.speechSynthesis.getVoices();
    const locales = VOICE_LOCALE_MAP[language] || [];

    // Filter by locale first
    let matchingVoices = voices.filter(v => locales.includes(v.lang));
    
    // Fallback: prefix match (e.g. 'en-US' -> 'en')
    if (matchingVoices.length === 0 && locales.length > 0) {
      const prefix = locales[locales.length - 1]?.split('-')[0] ?? 'en';
      matchingVoices = voices.filter(v => v.lang.startsWith(prefix));
    }

    if (matchingVoices.length === 0) return null;

    if (voiceType === 'male') {
      const maleVoice = matchingVoices.find(v => /male|david|mark|george|ravi/i.test(v.name));
      if (maleVoice) return maleVoice;
    } else if (voiceType === 'female') {
      const femaleVoice = matchingVoices.find(v => /female|zira|susan|hazel|heera|aditi/i.test(v.name));
      if (femaleVoice) return femaleVoice;
    }

    // Default to first match
    return matchingVoices[0] ?? null;
  }, []);

  // ── Core: Speak one sentence chunk, then recurse ─────────────────────────
  const speakLine = useCallback((index: number) => {
    if (isStoppedRef.current || isPausedRef.current) return;
    
    if (index >= linesRef.current.length) {
      // Finished all lines
      setPlaybackState('idle');
      setCurrentLine(-1);
      currentLineRef.current = -1;
      localStorage.removeItem('tts_last_state'); // Clear position on finish
      return;
    }

    const text = linesRef.current[index];
    if (!text?.trim()) {
      speakLine(index + 1); // Skip empty lines
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = languageRef.current;

    const voice = pickVoice(languageRef.current, voiceTypeRef.current);
    if (voice) utter.voice = voice;

    // Tuning based on voice type
    if (voiceTypeRef.current === 'robot') {
      utter.rate  = 0.75;
      utter.pitch = 1.8;
    } else {
      utter.rate  = 0.88;
      utter.pitch = 1.0;
    }
    utter.volume = volumeRef.current;

    utter.onstart = () => {
      // Ensure we haven't paused right as it was starting
      if (!isPausedRef.current && !isStoppedRef.current) {
        setCurrentLine(index);
        currentLineRef.current = index;
        savePosition(index); // Persist position so refresh resumes here
      }
    };

    utter.onend = () => {
      // If manually cancelled/paused, don't advance to next sentence
      if (isStoppedRef.current || isPausedRef.current) return;
      speakLine(index + 1);
    };

    utter.onerror = (e) => {
      if (isStoppedRef.current || isPausedRef.current) return;
      // "interrupted" or "canceled" are standard errors when we call window.speechSynthesis.cancel()
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      
      console.warn('TTS playback error, skipping to next line:', e);
      speakLine(index + 1);
    };

    currentUtterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [pickVoice, savePosition]);

  // ── Public Controls ────────────────────────────────────────────────────────
  const speak = useCallback((lines: string[], language: LanguageCode, voiceType: VoiceType, startFrom?: number) => {
    window.speechSynthesis.cancel();

    let finalStart = startFrom;

    // If startFrom is not explicitly provided (e.g. normal Play button click), try to restore from localStorage
    if (finalStart === undefined) {
      try {
        const saved = localStorage.getItem('tts_last_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          const linesKey = lines.join('|').slice(0, 1000);
          // Only restore if the text matches the currently loaded story
          if (parsed.linesKey === linesKey) {
            finalStart = parsed.currentLine;
          }
        }
      } catch (e) {
        console.error('Error reading TTS state', e);
      }
    }
    
    finalStart = finalStart || 0;

    linesRef.current     = lines;
    languageRef.current  = language;
    voiceTypeRef.current = voiceType;
    isStoppedRef.current = false;
    isPausedRef.current  = false;

    setPlaybackState('playing');
    setCurrentLine(finalStart);
    currentLineRef.current = finalStart;

    // Safari/Chrome async voice loading fix
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speakLine(finalStart);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speakLine(finalStart);
      };
    }
  }, [speakLine]);

  const pause = useCallback(() => {
    if (!window.speechSynthesis.speaking && playbackState !== 'playing') return;
    
    // Instead of using .pause() which is buggy across browsers, we use .cancel().
    // Since we track currentLine, resuming will just start the sentence again.
    isPausedRef.current = true;
    window.speechSynthesis.cancel(); 
    setPlaybackState('paused');
    savePosition(currentLineRef.current);
  }, [playbackState, savePosition]);

  const resume = useCallback(() => {
    if (isStoppedRef.current || linesRef.current.length === 0) return;
    
    isPausedRef.current = false;
    setPlaybackState('playing');
    // Re-speak the current line where it was cancelled
    speakLine(currentLineRef.current);
  }, [speakLine]);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    isPausedRef.current  = false;
    window.speechSynthesis.cancel();
    setPlaybackState('idle');
    setCurrentLine(-1);
    currentLineRef.current = -1;
    localStorage.removeItem('tts_last_state');
  }, []);

  const skipTo = useCallback((index: number, lines: string[], language: LanguageCode, voiceType: VoiceType) => {
    window.speechSynthesis.cancel();
    linesRef.current     = lines;
    languageRef.current  = language;
    voiceTypeRef.current = voiceType;
    isStoppedRef.current = false;
    isPausedRef.current  = false;

    setCurrentLine(index);
    currentLineRef.current = index;
    setPlaybackState('playing');
    speakLine(index);
  }, [speakLine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStoppedRef.current = true;
      window.speechSynthesis?.cancel();
    };
  }, []);

  return { playbackState, currentLine, isSupported, speak, pause, resume, stop, skipTo, volume, setVolume };
}
