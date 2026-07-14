import { createClient } from '@supabase/supabase-js'

// Клиентский Supabase (anon key — безопасен для браузера)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cbsmjeaxrcgrxiplytll.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types
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
  sources?: any[]
  created_at: string
}

// Получить документы
export async function getDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }

  return data || []
}

// Получить документ по ID
export async function getDocumentById(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching document:', error)
    return null
  }

  return data
}

// Поиск документов по категории
export async function getDocumentsByCategory(category: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('document_type', category)
    .order('effective_date', { ascending: false })

  if (error) {
    console.error('Error fetching documents by category:', error)
    return []
  }

  return data || []
}

// Семантический поиск
export async function searchDocuments(
  queryEmbedding: number[],
  threshold: number = 0.7,
  limit: number = 5
): Promise<any[]> {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    console.error('Error searching documents:', error)
    return []
  }

  return data || []
}

// Получить чанки документа
export async function getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
  const { data, error } = await supabase
    .from('document_chunks')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching chunks:', error)
    return []
  }

  return data || []
}

// Создать сессию чата
export async function createChatSession(title?: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([{ title: title || 'Новый чат' }])
    .select()
    .single()

  if (error) {
    console.error('Error creating session:', error)
    return null
  }

  return data?.id || null
}

// Получить сообщения сессии
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data || []
}

// Сохранить сообщение
export async function saveChatMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  sources?: any[]
): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .insert([{
      session_id: sessionId,
      role,
      content,
      sources: sources || null,
    }])

  if (error) {
    console.error('Error saving message:', error)
  }
}

// Получить все сессии
export async function getChatSessions(): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching sessions:', error)
    return []
  }

  return data || []
}

// Логирование поиска
export async function logSearch(
  query: string,
  response: string,
  sources: any[],
  modelUsed: string,
  responseTimeMs: number
): Promise<void> {
  const { error } = await supabase
    .from('search_logs')
    .insert([{
      query,
      response,
      sources_used: sources,
      model_used: modelUsed,
      response_time_ms: responseTimeMs,
    }])

  if (error) {
    console.error('Error logging search:', error)
  }
}

// Получить статистику
export async function getKnowledgeBaseStats(): Promise<{
  totalDocuments: number
  totalChunks: number
  categories: string[]
  authorities: string[]
}> {
  try {
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('document_type, authority')

    if (docsError) {
      console.error('Error getting stats:', docsError)
      return { totalDocuments: 0, totalChunks: 0, categories: [], authorities: [] }
    }

    const { count: chunksCount, error: chunksError } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })

    if (chunksError) {
      console.error('Error getting chunks count:', chunksError)
    }

    const categories = [...new Set((docs || []).map(d => d.document_type).filter(Boolean))]
    const authorities = [...new Set((docs || []).map(d => d.authority).filter(Boolean))]

    return {
      totalDocuments: docs?.length || 0,
      totalChunks: chunksCount || 0,
      categories,
      authorities,
    }
  } catch (error) {
    console.error('Error getting stats:', error)
    return { totalDocuments: 0, totalChunks: 0, categories: [], authorities: [] }
  }
}
