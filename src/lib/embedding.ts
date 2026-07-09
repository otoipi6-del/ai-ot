/**
 * Embedding generation for vector search
 * Supports: Jina AI, HuggingFace, Supabase pgvector
 */

// Jina AI Embeddings (free tier: 1M tokens)
async function jinaEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error('JINA_API_KEY not set');

  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      input: [text],
    }),
  });

  if (!response.ok) {
    throw new Error(`Jina API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// HuggingFace Inference API for embeddings
async function huggingfaceEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not set');

  const response = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  if (!response.ok) {
    throw new Error(`HuggingFace embedding error: ${response.status}`);
  }

  const data = await response.json();
  // HF returns array of arrays for single input
  return Array.isArray(data[0]) ? data[0] : data;
}

// Supabase Edge Function for embeddings (if configured)
async function supabaseEmbedding(text: string): Promise<number[]> {
  const { supabase } = await import('./supabase');

  const { data, error } = await supabase.functions.invoke('embed', {
    body: { text },
  });

  if (error) throw error;
  return data.embedding;
}

// Main embedding function with fallback
export async function generateEmbedding(text: string): Promise<number[]> {
  const providers = [
    { name: 'Jina', fn: jinaEmbedding },
    { name: 'HuggingFace', fn: huggingfaceEmbedding },
    { name: 'Supabase', fn: supabaseEmbedding },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`Trying embedding with ${provider.name}...`);
      const result = await provider.fn(text);
      console.log(`✅ Embedding success with ${provider.name}`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${provider.name} embedding failed:`, msg);
      errors.push(`${provider.name}: ${msg}`);
      continue;
    }
  }

  throw new Error(`All embedding providers failed: ${errors.join('; ')}`);
}

// Batch embedding for efficiency
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );
    results.push(...batchResults);
  }

  return results;
}
