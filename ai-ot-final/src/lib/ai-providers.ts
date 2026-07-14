import OpenAI from 'openai'
import Groq from 'groq-sdk'

export interface ModelConfig {
  name: string
  provider: 'groq' | 'openrouter' | 'deepseek' | 'openai'
  model: string
  apiKeyEnv: string
  baseURL?: string
  maxTokens?: number
  temperature?: number
}

// Доступные модели (бесплатные тиры)
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    name: 'Groq - Llama 3.1 70B',
    provider: 'groq',
    model: 'llama-3.1-70b-versatile',
    apiKeyEnv: 'GROQ_API_KEY',
    maxTokens: 4096,
    temperature: 0.3,
  },
  {
    name: 'Groq - Llama 3.1 8B',
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    apiKeyEnv: 'GROQ_API_KEY',
    maxTokens: 4096,
    temperature: 0.3,
  },
  {
    name: 'Groq - Mixtral 8x7B',
    provider: 'groq',
    model: 'mixtral-8x7b-32768',
    apiKeyEnv: 'GROQ_API_KEY',
    maxTokens: 4096,
    temperature: 0.3,
  },
  {
    name: 'DeepSeek - Chat',
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    baseURL: 'https://api.deepseek.com',
    maxTokens: 4096,
    temperature: 0.3,
  },
  {
    name: 'OpenRouter - Llama 3.1 70B',
    provider: 'openrouter',
    model: 'meta-llama/llama-3.1-70b-instruct',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    baseURL: 'https://openrouter.ai/api/v1',
    maxTokens: 4096,
    temperature: 0.3,
  },
  {
    name: 'OpenRouter - Mistral 7B',
    provider: 'openrouter',
    model: 'mistralai/mistral-7b-instruct',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    baseURL: 'https://openrouter.ai/api/v1',
    maxTokens: 4096,
    temperature: 0.3,
  },
  {
    name: 'OpenAI - GPT-4o-mini',
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKeyEnv: 'OPENAI_API_KEY',
    maxTokens: 4096,
    temperature: 0.3,
  },
]

// Получить API ключ
function getApiKey(config: ModelConfig): string {
  // Сначала проверяем localStorage (для клиента)
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem(config.apiKeyEnv)
    if (localKey) return localKey
  }
  // Затем env (для сервера)
  return process.env[config.apiKeyEnv] || ''
}

// Системный промпт
const SYSTEM_PROMPT = `Ты — AI-агент по охране труда Республики Беларусь.
Отвечай точно, ссылаясь на нормативные акты.
Если информации недостаточно — скажи об этом.

Контекст из документов:
{context}

Вопрос: {question}`

// Вызов Groq
async function callGroq(config: ModelConfig, messages: any[]): Promise<string> {
  const apiKey = getApiKey(config)
  if (!apiKey) throw new Error('GROQ_API_KEY не настроен')

  const groq = new Groq({ apiKey })

  const response = await groq.chat.completions.create({
    model: config.model,
    messages,
    max_tokens: config.maxTokens || 4096,
    temperature: config.temperature || 0.3,
  })

  return response.choices[0]?.message?.content || 'Ошибка генерации'
}

// Вызов OpenAI-совместимых API
async function callOpenAICompatible(config: ModelConfig, messages: any[]): Promise<string> {
  const apiKey = getApiKey(config)
  if (!apiKey) throw new Error(`${config.apiKeyEnv} не настроен`)

  const openai = new OpenAI({
    apiKey,
    baseURL: config.baseURL,
    dangerouslyAllowBrowser: true,
  })

  const response = await openai.chat.completions.create({
    model: config.model,
    messages,
    max_tokens: config.maxTokens || 4096,
    temperature: config.temperature || 0.3,
  })

  return response.choices[0]?.message?.content || 'Ошибка генерации'
}

// Генерация ответа
export async function generateResponse(
  question: string,
  sources: any[],
  config: ModelConfig,
  chatHistory: { role: string; content: string }[] = []
): Promise<{ content: string; sources: any[]; model_used: string }> {
  const context = sources.length > 0
    ? sources.map((s: any, i: number) => `[${i + 1}] ${s.title || 'Источник'}
${s.content || ''}`).join('

')
    : 'Контекст не найден.'

  const systemPrompt = SYSTEM_PROMPT
    .replace('{context}', context)
    .replace('{question}', question)

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6),
    { role: 'user', content: question },
  ]

  try {
    let content: string

    switch (config.provider) {
      case 'groq':
        content = await callGroq(config, messages)
        break
      case 'deepseek':
      case 'openrouter':
      case 'openai':
        content = await callOpenAICompatible(config, messages)
        break
      default:
        throw new Error(`Неизвестный провайдер: ${config.provider}`)
    }

    return { content, sources, model_used: config.name }
  } catch (error) {
    console.error('Error:', error)
    return {
      content: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}. Проверьте API ключ.`,
      sources,
      model_used: config.name,
    }
  }
}

export function getDefaultModel(): ModelConfig {
  return AVAILABLE_MODELS[0]
}

export function getModelByName(name: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find(m => m.name === name)
}
