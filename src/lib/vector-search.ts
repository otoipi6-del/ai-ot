/**
 * Vector Search with Supabase pgvector
 * Semantic search over document chunks
 */

import { supabase } from './supabase';
import { generateEmbedding } from './embedding';
import type { SearchResult } from './supabase';

/**
 * Search for relevant document chunks using vector similarity
 */
export async function vectorSearch(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    documentTypes?: string[];
    authorities?: string[];
  } = {}
): Promise<SearchResult[]> {
  const {
    limit = 5,
    threshold = 0.7,
    documentTypes,
    authorities,
  } = options;

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Build the RPC call
  let rpcQuery = supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  // Apply filters if provided
  if (documentTypes && documentTypes.length > 0) {
    rpcQuery = rpcQuery.in('document_type', documentTypes);
  }

  if (authorities && authorities.length > 0) {
    rpcQuery = rpcQuery.in('authority', authorities);
  }

  const { data, error } = await rpcQuery;

  if (error) {
    console.error('Vector search error:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    content: row.content,
    document_title: row.document_title,
    document_type: row.document_type,
    authority: row.authority,
    similarity: row.similarity,
    source_url: row.source_url,
  }));
}

/**
 * Hybrid search: vector + keyword
 */
export async function hybridSearch(
  query: string,
  options: {
    limit?: number;
    vectorWeight?: number;
    keywordWeight?: number;
  } = {}
): Promise<SearchResult[]> {
  const { limit = 5, vectorWeight = 0.7, keywordWeight = 0.3 } = options;

  // Get vector search results
  const vectorResults = await vectorSearch(query, { limit: limit * 2 });

  // Get keyword search results
  const { data: keywordData, error: keywordError } = await supabase
    .from('document_chunks')
    .select(`
      id,
      content,
      documents!inner(title, document_type, authority, source_url)
    `)
    .textSearch('content', query, { type: 'websearch' })
    .limit(limit * 2);

  if (keywordError) {
    console.error('Keyword search error:', keywordError);
  }

  // Combine and rank results
  const combined = new Map<string, SearchResult & { score: number }>();

  // Add vector results
  vectorResults.forEach((result, index) => {
    const existing = combined.get(result.id);
    const vectorScore = vectorWeight * (1 - index / vectorResults.length);
    if (existing) {
      existing.score += vectorScore;
    } else {
      combined.set(result.id, { ...result, score: vectorScore });
    }
  });

  // Add keyword results
  (keywordData || []).forEach((row: any, index: number) => {
    const id = row.id;
    const existing = combined.get(id);
    const keywordScore = keywordWeight * (1 - index / (keywordData?.length || 1));

    const result: SearchResult = {
      id,
      content: row.content,
      document_title: row.documents.title,
      document_type: row.documents.document_type,
      authority: row.documents.authority,
      similarity: 0,
      source_url: row.documents.source_url,
    };

    if (existing) {
      existing.score += keywordScore;
    } else {
      combined.set(id, { ...result, score: keywordScore });
    }
  });

  // Sort by combined score and return top results
  return Array.from(combined.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...result }) => result);
}

/**
 * Get document by ID with all chunks
 */
export async function getDocumentWithChunks(documentId: string) {
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (docError) throw docError;

  const { data: chunks, error: chunkError } = await supabase
    .from('document_chunks')
    .select('*')
    .eq('document_id', documentId)
    .order('metadata->chunk_index', { ascending: true });

  if (chunkError) throw chunkError;

  return { document, chunks };
}
