// Глобальные типы

export interface Document {
  id: string
  title: string
  content: string
  source_url?: string
  document_type: 'law' | 'regulation' | 'explanation' | 'standard' | 'other'
  authority?: string
  effective_date?: string
  created_at: string
  updated_at: string
}

export interface DocumentChunk {
  id: string
  document_id: string
  content: string
  embedding: number[]
  metadata: Record<string, any>
  created_at: string
}

export interface ChatSession {
  id: string
  user_id?: string
  title?: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: Source[]
  created_at: string
}

export interface Source {
  id: string
  title: string
  content: string
  embedding: number[]
  metadata: Record<string, any>
  created_at: string
}

export interface SearchResult {
  id: string
  document_id: string
  content: string
  similarity: number
  metadata?: Record<string, any>
}

export interface AIResponse {
  content: string
  sources: Source[]
  model_used: string
}

export interface ModelConfig {
  name: string
  provider: 'groq' | 'openrouter' | 'deepseek' | 'openai'
  model: string
  apiKeyEnv: string
  baseURL?: string
  maxTokens?: number
  temperature?: number
}
