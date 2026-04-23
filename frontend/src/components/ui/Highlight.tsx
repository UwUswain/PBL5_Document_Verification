'use client';

import React from 'react';

interface HighlightProps {
  text: string;
  query: string;
}

export function Highlight({ text, query }: HighlightProps) {
  if (!query.trim() || !text) return <>{text}</>;

  // Split query into multiple keywords and escape special regex characters
  const keywords = query
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 1) // Only highlight meaningful words
    .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (keywords.length === 0) return <>{text}</>;

  // Create a combined regex for all keywords
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = keywords.some(k => new RegExp(`^${k}$`, 'i').test(part));
        return isMatch ? (
          <span 
            key={i} 
            style={{ 
              backgroundColor: '#e0e7ff', // Soft Indigo
              color: '#4338ca', // Deep Indigo
              padding: '0 2px',
              borderRadius: '2px',
              fontWeight: 600,
              display: 'inline-block',
              lineHeight: '1.2'
            }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}
