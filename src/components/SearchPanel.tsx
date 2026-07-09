'use client';

import { useState } from 'react';
import { Search, Loader2, FileText } from 'lucide-react';

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
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-primary-600" />
        Поиск по нормативной базе
      </h3>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по документам..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {results.map(result => (
          <div key={result.id} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary-600" />
              <span className="font-medium text-sm">{result.document_title}</span>
              <span className="text-xs text-gray-500 ml-auto">
                {Math.round(result.similarity * 100)}% совпадение
              </span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3">{result.content}</p>
            {result.authority && (
              <p className="text-xs text-gray-500 mt-1">{result.authority}</p>
            )}
          </div>
        ))}

        {results.length === 0 && !isLoading && query && (
          <p className="text-center text-gray-500 py-4">Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}
