/**
 * TypeScript type definitions for AI-OT
 */

export interface Document {
  id: string;
  title: string;
  content: string;
  sourceUrl?: string;
  documentType: 'law' | 'regulation' | 'explanation' | 'standard' | 'other';
  authority?: string;
  effectiveDate?: string;
  createdAt: string;
  updatedAt: string;
  chunkCount: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: string[];
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  id: string;
  content: string;
  documentTitle: string;
  documentType: string;
  authority?: string;
  similarity: number;
  sourceUrl?: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  description: string;
  source: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}

export interface AppConfig {
  supabaseUrl: string;
  defaultProvider: string;
  enableWebSearch: boolean;
  maxChunksPerQuery: number;
  similarityThreshold: number;
}
