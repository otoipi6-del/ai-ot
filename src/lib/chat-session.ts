/**
 * Chat Session Management
 * Stores and retrieves chat history
 */

import { supabase } from './supabase';
import type { ChatMessage } from './supabase';

/**
 * Create a new chat session
 */
export async function createChatSession(userId?: string): Promise<string> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId || null,
      title: 'Новый чат',
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Add a message to a session
 */
export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  sources?: string[]
): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      sources,
    });

  if (error) throw error;
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId?: string) {
  let query = supabase
    .from('chat_sessions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Update session title
 */
export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ title })
    .eq('id', sessionId);

  if (error) throw error;
}

/**
 * Delete a session and its messages
 */
export async function deleteSession(sessionId: string): Promise<void> {
  // Messages will be cascade deleted
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}
