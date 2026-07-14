import { supabase } from './supabase'

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

// Создать сессию
export async function createSession(title?: string): Promise<string | null> {
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

// Получить сессии
export async function getSessions(): Promise<ChatSession[]> {
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

// Получить сообщения сессии
export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
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
export async function saveMessage(
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

// Удалить сессию
export async function deleteSession(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('Error deleting session:', error)
    return false
  }

  return true
}
