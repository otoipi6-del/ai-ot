/**
 * Application constants
 */

export const APP_NAME = 'AI-OT';
export const APP_DESCRIPTION = 'AI-ассистент по охране труда в Республике Беларусь';

// Document types
export const DOCUMENT_TYPES = {
  law: 'Закон / Кодекс',
  regulation: 'Постановление / Приказ / Инструкция',
  explanation: 'Разъяснение / Письмо / Методические указания',
  standard: 'Стандарт / ГОСТ / СанПиН',
  other: 'Другое',
} as const;

// Authorities
export const AUTHORITIES = [
  'Министерство труда и социальной защиты',
  'Министерство здравоохранения',
  'Министерство строительства и архитектуры',
  'Центр гигиены и эпидемиологии',
  'Госпромнадзор',
  'Белэнерго',
  'Верховный Суд РБ',
  'Государственная инспекция труда',
  'Национальное собрание РБ',
] as const;

// AI Providers
export const AI_PROVIDERS = {
  groq: {
    name: 'Groq',
    model: 'llama-3.3-70b-versatile',
    maxTokens: 4096,
    url: 'https://api.groq.com/openai/v1/chat/completions',
  },
  deepseek: {
    name: 'DeepSeek',
    model: 'deepseek-chat',
    maxTokens: 4096,
    url: 'https://api.deepseek.com/v1/chat/completions',
  },
  openrouter: {
    name: 'OpenRouter',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    maxTokens: 4096,
    url: 'https://openrouter.ai/api/v1/chat/completions',
  },
  huggingface: {
    name: 'HuggingFace',
    model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    maxTokens: 2048,
    url: 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
  },
} as const;

// Embedding providers
export const EMBEDDING_PROVIDERS = {
  jina: {
    name: 'Jina AI',
    model: 'jina-embeddings-v3',
    dimension: 768,
    url: 'https://api.jina.ai/v1/embeddings',
  },
  huggingface: {
    name: 'HuggingFace',
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    dimension: 384,
    url: 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
  },
} as const;

// Search settings
export const SEARCH_CONFIG = {
  defaultLimit: 5,
  maxLimit: 20,
  defaultThreshold: 0.7,
  chunkSize: 1000,
  chunkOverlap: 200,
} as const;

// Web search
export const WEB_SEARCH_CONFIG = {
  maxResults: 5,
  searxngInstances: [
    'https://search.sapti.me',
    'https://searx.be',
    'https://search.bus-hit.me',
  ],
} as const;

// Chat settings
export const CHAT_CONFIG = {
  maxHistoryMessages: 10,
  systemPrompt: `Ты — эксперт по охране труда в Республике Беларусь.

Твоя задача — давать точные, актуальные ответы на основе нормативной базы РБ по охране труда.

Правила:
1. Отвечай только на основе предоставленного контекста из нормативных документов
2. Если информации недостаточно — честно скажи об этом и предложи обратиться в соответствующий орган
3. Указывай конкретные статьи, пункты и номера постановлений
4. Разделяй ответ на логические разделы с заголовками
5. Давай практические рекомендации по выполнению требований
6. Указывай ответственность за нарушения, если это применимо
7. Используй официальную терминологию законодательства РБ`,
} as const;

// File upload
export const UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
} as const;
