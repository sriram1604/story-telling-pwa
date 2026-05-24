'use client';

import { useState, useCallback } from 'react';
import type { Story } from '../types';
import { SAVED_STORIES_KEY, MAX_SAVED_STORIES } from '../utils/constants';
import { generateId } from '../utils/helpers';

/**
 * useSavedStories – persist and retrieve stories from localStorage.
 */
export function useSavedStories() {
  // Lazy-initialize from localStorage
  const [savedStories, setSavedStories] = useState<Story[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SAVED_STORIES_KEY);
      return raw ? (JSON.parse(raw) as Story[]) : [];
    } catch {
      return [];
    }
  });

  // ── Persist helper ──────────────────────────────────────────────────────────

  const persist = useCallback((stories: Story[]) => {
    setSavedStories(stories);
    try {
      localStorage.setItem(SAVED_STORIES_KEY, JSON.stringify(stories));
    } catch {
      // Ignore quota errors gracefully
    }
  }, []);

  // ── Save a new story ────────────────────────────────────────────────────────

  const saveStory = useCallback(
    (
      lines: string[],
      language: Story['language'],
      mood: Story['mood'],
      prompt: string
    ) => {
      const story: Story = {
        id: generateId(),
        title: lines[0] ?? 'Untitled Story',
        lines,
        language,
        mood,
        createdAt: Date.now(),
        prompt,
      };

      // Newest first; trim to max
      const updated = [story, ...savedStories].slice(0, MAX_SAVED_STORIES);
      persist(updated);
      return story.id;
    },
    [savedStories, persist]
  );

  // ── Delete a story by id ────────────────────────────────────────────────────

  const deleteStory = useCallback(
    (id: string) => {
      persist(savedStories.filter(s => s.id !== id));
    },
    [savedStories, persist]
  );

  // ── Clear all stories ───────────────────────────────────────────────────────

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  return { savedStories, saveStory, deleteStory, clearAll };
}
