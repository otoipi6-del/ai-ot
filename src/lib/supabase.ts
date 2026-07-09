import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Types for our database tables
export interface Document {
  id: string;
  title: string;
  content: string;
  source_url?: string;
  document_type: 'law' | 'regulation' | 'explanation' | 'standard' | 'other';
  authority?: string;
  effective_date?: string;
  created_at: string;
  updated_at: string;
  chunk_count: number;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: string[];
  created_at: string;
}

export interface SearchResult {
  id: string;
  content: string;
  document_title: string;
  document_type: string;
  authority?: string;
  similarity: number;
  source_url?: string;
}
