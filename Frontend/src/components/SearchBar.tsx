// frontend/src/components/SearchBar.tsx
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Tìm kiếm bài hát, tác giả...',
}) => {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value); // search realtime
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(212,175,55,0.25)',
      borderRadius: 8, padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ color: '#5a5a6a', fontSize: 14 }}>🔍</span>
      <input
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          fontFamily: 'Georgia, serif', fontSize: 14,
          color: '#e0d5b0',
        }}
      />
      {query && (
        <button
          onClick={() => { setQuery(''); onSearch(''); }}
          style={{
            background: 'none', border: 'none',
            color: '#5a5a6a', cursor: 'pointer', fontSize: 16,
          }}
        >✕</button>
      )}
    </div>
  );
};