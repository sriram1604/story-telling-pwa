'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { LanguageCode } from '../types';

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  setTranscript: (val: string) => void;
  clearTranscript: () => void;
  volume: number;
}

export function useSpeechRecognition(
  language: LanguageCode,
  onSilenceDetected?: () => void
): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscriptState] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  // We consider it supported if MediaRecorder is available
  const isSupported = typeof window !== 'undefined' && !!window.navigator?.mediaDevices?.getUserMedia;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Audio Context for Silence Detection
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  
  // Silence threshold config
  const SILENCE_THRESHOLD = 10; 
  const SILENCE_DURATION_MS = 2000; // 2 seconds of silence

  const cleanupAudio = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setVolume(0);
  }, []);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setInterimTranscript('Processing audio...');
    setError(null);
    
    try {
      const formData = new FormData();
      // Whisper supports multiple formats. We use the blob's actual type.
      formData.append('file', audioBlob, 'audio.webm'); 
      formData.append('language', language); 

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to process audio (${res.status})`);
      }

      const data = await res.json();
      if (data.text) {
        setTranscriptState(prev => (prev + ' ' + data.text).trim());
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to process audio');
    } finally {
      setIsProcessing(false);
      setInterimTranscript('');
      setIsListening(false);
      cleanupAudio();
    }
  };

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop(); // Triggers onstop event -> processes audio
    } else {
      setIsListening(false);
      cleanupAudio();
    }
  }, [cleanupAudio]);

  const startListening = useCallback(async () => {
    setError(null);
    setInterimTranscript('Listening...');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      // 1. Setup MediaRecorder
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'; // iOS Safari fallback
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Construct the blob from recorded chunks
        const type = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });
        processAudio(audioBlob);
      };

      mediaRecorder.start(100); // collect chunks every 100ms
      setIsListening(true);

      // 2. Setup Silence Detection
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      silenceStartRef.current = null;

      const checkSilence = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

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
            // Silence detected -> Stop recording
            stopListening();
            if (onSilenceDetected) onSilenceDetected();
            return; // Exit loop
          }
        } else {
          silenceStartRef.current = null;
        }

        animationRef.current = requestAnimationFrame(checkSilence);
      };

      checkSilence();

    } catch (err: any) {
      console.error('Audio initialization failed', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Please allow permissions.');
      } else {
        setError('Could not access microphone.');
      }
      setIsListening(false);
      setInterimTranscript('');
      cleanupAudio();
    }
  }, [stopListening, onSilenceDetected, cleanupAudio, language]);

  const setTranscript = useCallback((val: string) => {
    setTranscriptState(val);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscriptState('');
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    isListening,
    isProcessing,
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
