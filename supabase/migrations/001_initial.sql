-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN ('law', 'regulation', 'explanation', 'standard', 'other')),
  authority TEXT,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  chunk_count INTEGER DEFAULT 0
);

-- Document chunks with embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT DEFAULT 'Новый чат',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Google Drive sync state
CREATE TABLE IF NOT EXISTS drive_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  modified_time TEXT NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  document_title TEXT,
  document_type TEXT,
  authority TEXT,
  similarity FLOAT,
  source_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    d.title AS document_title,
    d.document_type,
    d.authority,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.source_url
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_document_chunks_search ON document_chunks 
  USING gin(to_tsvector('russian', content));

-- Vector index
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all reads" ON documents;
DROP POLICY IF EXISTS "Allow all reads" ON document_chunks;
DROP POLICY IF EXISTS "Allow all reads" ON chat_sessions;
DROP POLICY IF EXISTS "Allow all reads" ON chat_messages;
DROP POLICY IF EXISTS "Allow all inserts" ON documents;
DROP POLICY IF EXISTS "Allow all inserts" ON document_chunks;
DROP POLICY IF EXISTS "Allow all inserts" ON chat_sessions;
DROP POLICY IF EXISTS "Allow all inserts" ON chat_messages;
DROP POLICY IF EXISTS "Allow all updates" ON documents;
DROP POLICY IF EXISTS "Allow all updates" ON drive_sync_state;

-- Allow all reads (public access for now)
CREATE POLICY "Allow all reads" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON document_chunks FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON chat_messages FOR SELECT USING (true);

-- Allow inserts
CREATE POLICY "Allow all inserts" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts" ON document_chunks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts" ON chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts" ON chat_messages FOR INSERT WITH CHECK (true);

-- Allow updates
CREATE POLICY "Allow all updates" ON documents FOR UPDATE USING (true);
CREATE POLICY "Allow all updates" ON drive_sync_state FOR UPDATE USING (true);
