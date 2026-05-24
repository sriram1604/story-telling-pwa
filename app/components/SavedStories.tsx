'use client';

import type { Story } from '../types';
import { MOODS, LANGUAGES } from '../utils/constants';
import { formatDate, truncate } from '../utils/helpers';

interface SavedStoriesProps {
  stories: Story[];
  onLoad: (story: Story) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

/**
 * SavedStories – lists all locally-saved stories with load/delete controls.
 */
export default function SavedStories({
  stories,
  onLoad,
  onDelete,
  onClearAll,
}: SavedStoriesProps) {
  if (stories.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🗂️</div>
        <p style={{ color: 'var(--clr-muted)', fontSize: '14px' }}>
          No saved stories yet. Generate a story and save it!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--clr-muted)' }}>
          {stories.length} saved {stories.length === 1 ? 'story' : 'stories'}
        </span>
        <button
          type="button"
          onClick={onClearAll}
          style={{
            background: 'none',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            borderRadius: '9999px',
            padding: '4px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
          }}
          aria-label="Clear all saved stories"
        >
          Clear all
        </button>
      </div>

      {/* Story cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {stories.map(story => {
          const moodMeta = MOODS.find(m => m.id === story.mood) ?? MOODS[0];
          const langMeta = LANGUAGES.find(l => l.code === story.language) ?? LANGUAGES[0];

          return (
            <div
              key={story.id}
              className="saved-card"
              onClick={() => onLoad(story)}
              role="button"
              tabIndex={0}
              aria-label={`Load story: ${story.title}`}
              onKeyDown={e => e.key === 'Enter' && onLoad(story)}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: '14px',
                      color: 'var(--clr-text)',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {moodMeta.emoji} {truncate(story.title, 55)}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: `${moodMeta.color}22`,
                        color: moodMeta.color,
                        border: `1px solid ${moodMeta.color}44`,
                        fontWeight: 600,
                      }}
                    >
                      {moodMeta.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--clr-muted)' }}>
                      {langMeta.flag} {langMeta.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--clr-muted)' }}>
                      {formatDate(story.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(story.id);
                  }}
                  aria-label={`Delete story: ${story.title}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--clr-muted)',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--clr-error)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--clr-muted)')}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
