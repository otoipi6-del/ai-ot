import OpenAI from 'openai'

// Генерация эмбеддингов через OpenAI (требует API ключ)
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY || 
                 (typeof window !== 'undefined' ? localStorage.getItem('OPENAI_API_KEY') : '') || ''

  if (!apiKey) {
    // Fallback: простой хеш-эмбеддинг (не идеален, но работает без API ключа)
    return generateSimpleEmbedding(text)
  }

  try {
    const openai = new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true 
    })

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding with OpenAI:', error)
    return generateSimpleEmbedding(text)
  }
}

// Простой fallback эмбеддинг (если нет API ключа)
function generateSimpleEmbedding(text: string): number[] {
  const vector = new Array(1536).fill(0)
  const words = text.toLowerCase().split(/\s+/)

  words.forEach((word, i) => {
    for (let j = 0; j < Math.min(word.length, 10); j++) {
      const idx = (word.charCodeAt(j) + i * 31) % 1536
      vector[idx] += 1
    }
  })

  // Нормализация
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
  if (magnitude > 0) {
    return vector.map(v => v / magnitude)
  }

  return vector
}

// Генерация эмбеддингов для массива текстов
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(text => generateEmbedding(text)))
}
