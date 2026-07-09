'use client';

import { useState } from 'react';

interface SearchResult {
  id: string;
  content: string;
  document_title: string;
  document_type: string;
  authority?: string;
  similarity: number;
}

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, type: 'hybrid', limit: 10 }),
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1rem' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Поиск по нормативной базе</h3>

      <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по документам..."
            style={{ flex: 1, padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none' }}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#0284c7', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}
          >
            {isLoading ? '...' : 'Поиск'}
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {results.map(result => (
          <div key={result.id} style={{ padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{result.document_title}</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: 'auto' }}>
                {Math.round(result.similarity * 100)}% совпадение
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{result.content}</p>
            {result.authority && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{result.authority}</p>
            )}
          </div>
        ))}

        {results.length === 0 && !isLoading && query && (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}
