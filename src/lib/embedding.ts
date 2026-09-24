// Генерация эмбеддингов через Hugging Face Inference API
// Модель: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
// Она многоязычная (включая русский) и возвращает вектор размером 384.
// ВАЖНО: размерность вектора в базе данных (pgvector) должна совпадать.
// Если в миграции указано vector(1536) — см. примечание внизу файла.

const HF_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
const HF_API_URL = `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`
const EMBEDDING_DIM = 384

// Получить API ключ Hugging Face
function getHuggingFaceKey(): string {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('HUGGINGFACE_API_KEY')
    if (localKey) return localKey
  }
  return process.env.HUGGINGFACE_API_KEY || ''
}

// Генерация одного эмбеддинга
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getHuggingFaceKey()

  if (!apiKey) {
    console.warn('HUGGINGFACE_API_KEY не настроен — используется простой fallback-эмбеддинг.')
    return generateSimpleEmbedding(text)
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true }, // ждать загрузки модели, если она «спит»
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Hugging Face API error ${response.status}: ${errText}`)
    }

    const data = await response.json()

    // HF может вернуть либо плоский массив (для одного текста),
    // либо массив массивов. Обрабатываем оба случая.
    if (Array.isArray(data) && typeof data[0] === 'number') {
      return data as number[]
    }
    if (Array.isArray(data) && Array.isArray(data[0])) {
      // Усредняем по токенам, если вернулся «токен-левел» вектор
      const tokenVectors = data as number[][]
      const dim = tokenVectors[0].length
      const mean = new Array(dim).fill(0)
      for (const vec of tokenVectors) {
        for (let i = 0; i < dim; i++) mean[i] += vec[i]
      }
      return mean.map(v => v / tokenVectors.length)
    }

    throw new Error('Неожиданный формат ответа от Hugging Face')
  } catch (error) {
    console.error('Ошибка генерации эмбеддинга через Hugging Face:', error)
    return generateSimpleEmbedding(text)
  }
}

// Простой fallback-эмбеддинг (если нет API ключа или HF недоступен)
function generateSimpleEmbedding(text: string): number[] {
  const vector = new Array(EMBEDDING_DIM).fill(0)
  const words = text.toLowerCase().split(/\s+/)

  words.forEach((word, i) => {
    for (let j = 0; j < Math.min(word.length, 10); j++) {
      const idx = (word.charCodeAt(j) + i * 31) % EMBEDDING_DIM
      vector[idx] += 1
    }
  })

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
