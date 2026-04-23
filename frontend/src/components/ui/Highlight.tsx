'use client';

import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface HighlightProps {
  text: string;
  query: string;
}

export function Highlight({ text, query }: HighlightProps) {
  if (!query.trim()) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));

  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} style={{ backgroundColor: '#fffb8f', padding: '0 2px', borderRadius: 2, color: 'inherit' }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
