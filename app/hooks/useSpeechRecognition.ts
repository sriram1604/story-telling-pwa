'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { LanguageCode } from '../types';

// ─── Augment Window for Web Speech API ───────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: typeof useSpeechRecognition | undefined;
    webkitSpeechRecognition: typeof useSpeechRecognition | undefined;
  }
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  setTranscript: (val: string) => void;
  clearTranscript: () => void;
  volume: number; // useful for UI waveform
}

export function useSpeechRecognition(
  language: LanguageCode,
  onSilenceDetected?: () => void
): UseSpeechRecognitionReturn {
  const [isListening, setIsListening]             = useState(false);
  const [transcript, setTranscriptState]          = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError]                         = useState<string | null>(null);
  const [isSupported, setIsSupported]             = useState(false);
  const [volume, setVolume]                       = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const languageRef    = useRef<LanguageCode>(language);

  // Web Audio API refs for silence detection
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const sourceRef       = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef    = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);

  // Silence threshold config - increased to 15 to account for ambient noise floor
  const SILENCE_THRESHOLD = 15; 
  const SILENCE_DURATION_MS = 2000; // 2 seconds of silence

  useEffect(() => {
    languageRef.current = language;
    if (recognitionRef.current && isListening) {
      recognitionRef.current.lang = language;
    }
  }, [language, isListening]);

  useEffect(() => {
    const SpeechRecognitionImpl =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.maxAlternatives = 1;
    recognition.lang            = languageRef.current;

    recognition.onstart = () => { setIsListening(true); setError(null); };
    
    // When recognition ends natively, also update state
    recognition.onend   = () => { 
      setIsListening(false); 
      setInterimTranscript('');
      cleanupAudio();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      const msgs: Record<string, string> = {
        'not-allowed':         'Microphone access denied.',
        'service-not-allowed': 'Microphone access denied.',
        'no-speech':           'No speech detected.',
        'network':             'Network error.',
      };
      setError(msgs[event.error] ?? `Speech recognition error: ${event.error}`);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText   = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText   += r[0].transcript + ' ';
        else           interimText += r[0].transcript;
      }
      if (finalText) setTranscriptState(prev => (prev + ' ' + finalText).trim());
      setInterimTranscript(interimText);
    };

    recognitionRef.current = recognition;
    return () => { recognition.abort(); recognitionRef.current = null; };
  }, []);

  // Cleanup audio resources
  const cleanupAudio = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setVolume(0);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop(); // This triggers onend which calls cleanupAudio
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) return;
    setError(null);
    setInterimTranscript('');
    recognitionRef.current.lang = languageRef.current;

    try {
      // 1. Get audio stream for silence detection
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      silenceStartRef.current = null;

      const checkSilence = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avgVolume = sum / bufferLength;
        setVolume(avgVolume);

        if (avgVolume < SILENCE_THRESHOLD) {
          if (!silenceStartRef.current) {
            silenceStartRef.current = performance.now();
          } else if (performance.now() - silenceStartRef.current > SILENCE_DURATION_MS) {
            // Silence detected! Stop everything.
            stopListening();
            if (onSilenceDetected) onSilenceDetected();
            return; // Stop the loop
          }
        } else {
          // Reset silence timer if volume goes above threshold
          silenceStartRef.current = null;
        }

        animationRef.current = requestAnimationFrame(checkSilence);
      };

      checkSilence();

      // 2. Start Web Speech API
      recognitionRef.current.start();
    } catch (err) {
      console.error('Audio initialization failed', err);
      setError('Could not access microphone for silence detection.');
      // Fallback: just start recognition if getUserMedia fails
      try { recognitionRef.current.start(); } catch { /* already started */ }
    }
  }, [stopListening, onSilenceDetected]);

  const setTranscript = useCallback((val: string) => {
    setTranscriptState(val);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscriptState('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    setTranscript,
    clearTranscript,
    volume,
  };
}


