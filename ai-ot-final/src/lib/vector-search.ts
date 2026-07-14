import { generateEmbedding } from './embedding'
import { searchDocuments } from './supabase'

export interface SearchResult {
  id: string
  document_id: string
  content: string
  similarity: number
  metadata?: Record<string, any>
}

// Семантический поиск
export async function semanticSearch(
  query: string,
  threshold: number = 0.6,
  limit: number = 5
): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(query)
  const results = await searchDocuments(embedding, threshold, limit)

  return (results || []).map((r: any) => ({
    id: r.id,
    document_id: r.document_id,
    content: r.chunk_text || r.content,
    similarity: r.similarity,
    metadata: r.metadata,
  }))
}

// Гибридный поиск (семантический + ключевые слова)
export async function hybridSearch(
  query: string,
  threshold: number = 0.5,
  limit: number = 5
): Promise<SearchResult[]> {
  // Сначала семантический
  const semanticResults = await semanticSearch(query, threshold, limit)

  if (semanticResults.length >= 3) {
    return semanticResults
  }

  // Если мало результатов — добавляем ключевой поиск
  // (в реальном приложении — через Supabase full-text search)
  return semanticResults
}
