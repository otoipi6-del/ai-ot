'use client'

import { useState } from 'react'
import { Search, BookOpen, ExternalLink } from 'lucide-react'
import { semanticSearch } from '@/lib/vector-search'
import { getDocumentById } from '@/lib/supabase'

export default function SearchPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const searchResults = await semanticSearch(query, 0.5, 5)
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Search className="w-5 h-5" />
        Семантический поиск
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Введите запрос..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSearching ? 'Поиск...' : 'Найти'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Найдено результатов: {results.length}</p>
          {results.map((result, idx) => (
            <div key={idx} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-800 line-clamp-3">{result.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Сходство: {(result.similarity * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-400">ID: {result.document_id}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query && !isSearching && (
        <p className="text-sm text-gray-500 text-center py-4">Результаты не найдены</p>
      )}
    </div>
  )
}
